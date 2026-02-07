import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { BettingHouseUser, BettingHouse } from '../db/models/index.js';
import { query } from '../db/dbConfig.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password, role, houseId } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'username y password son obligatorios' });
    }

    const user = await BettingHouseUser.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ success: false, error: 'Usuario inactivo' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ success: false, error: 'Rol no autorizado para este usuario' });
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }

    let house = null;
    if (user.role === 'house_admin') {
      // Validar que la casa exista y coincida
      const targetHouseId = houseId || user.betting_house_id;
      if (!targetHouseId || targetHouseId !== user.betting_house_id) {
        return res.status(403).json({ success: false, error: 'No tienes acceso a esta casa' });
      }
      house = await BettingHouse.findById(targetHouseId);
      if (!house) {
        return res.status(404).json({ success: false, error: 'Casa de apuestas no encontrada' });
      }
    }

    const sanitizedUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      betting_house_id: user.betting_house_id,
      email: user.email
    };

    return res.json({
      success: true,
      data: {
        user: sanitizedUser,
        house
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ success: false, error: 'Error interno en autenticación' });
  }
};

const buildResetUrl = (token) => {
  const base = process.env.FRONTEND_BASE_URL || 'https://parlay-betting-platform-production.up.railway.app';
  return `${base.replace(/\/$/, '')}/reset?token=${encodeURIComponent(token)}`;
};

// POST /api/auth/password-reset/request
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({ success: false, error: 'email es obligatorio' });
    }

    const user = await query(
      `SELECT id, email FROM betting_house_users WHERE email = $1 LIMIT 1`,
      [email]
    );

    if (!user.rows.length) {
      return res.json({ success: true, message: 'Si el email existe, recibirás un enlace' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.rows[0].id, tokenHash, expiresAt]
    );

    await sendPasswordResetEmail({
      to: email,
      resetUrl: buildResetUrl(token)
    });

    return res.json({ success: true, message: 'Si el email existe, recibirás un enlace' });
  } catch (error) {
    console.error('Error solicitando reset:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
};

// POST /api/auth/password-reset/confirm
export const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, error: 'token y newPassword son obligatorios' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const tokenResult = await query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (!tokenResult.rows.length) {
      return res.status(400).json({ success: false, error: 'Token inválido' });
    }

    const resetToken = tokenResult.rows[0];
    if (resetToken.used_at) {
      return res.status(400).json({ success: false, error: 'Token ya utilizado' });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: 'Token expirado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await query(
      `UPDATE betting_house_users SET password_hash = $1 WHERE id = $2`,
      [passwordHash, resetToken.user_id]
    );

    await query(
      `UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`,
      [resetToken.id]
    );

    return res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error confirmando reset:', error);
    return res.status(500).json({ success: false, error: 'Error interno' });
  }
};
