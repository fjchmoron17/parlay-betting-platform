import bcrypt from 'bcryptjs';
import { BettingHouseUser, BettingHouse } from '../db/models/index.js';

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
