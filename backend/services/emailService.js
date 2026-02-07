// backend/services/emailService.js
import nodemailer from 'nodemailer';
import axios from 'axios';

const MAIL_SERVICE = (process.env.MAIL_SERVICE || 'gmail').trim();
const MAIL_HOST = process.env.MAIL_HOST?.trim();
const MAIL_PORT = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined;
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;
const GRAPH_TENANT_ID = process.env.GRAPH_TENANT_ID;
const GRAPH_CLIENT_ID = process.env.GRAPH_CLIENT_ID;
const GRAPH_CLIENT_SECRET = process.env.GRAPH_CLIENT_SECRET;
const GRAPH_SENDER = process.env.GRAPH_SENDER || process.env.MAIL_USER;
const USE_GRAPH = MAIL_SERVICE.toLowerCase() === 'graph' || process.env.USE_GRAPH_EMAIL === 'true';
const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || 'fjchmoron@chirinossolutions.com';

// Log de configuración al iniciar
console.log('📧 Email Service Init:');
console.log('  SERVICE:', MAIL_SERVICE || 'NOT SET');
console.log('  HOST:', MAIL_HOST || (MAIL_SERVICE?.toLowerCase() === 'sendgrid' ? 'smtp.sendgrid.net' : '—'));
console.log('  PORT:', MAIL_PORT || (MAIL_SERVICE?.toLowerCase() === 'sendgrid' ? 587 : '—'));
console.log('  USER:', MAIL_USER || 'NOT SET');
console.log('  PASSWORD:', MAIL_PASSWORD ? 'SET (' + MAIL_PASSWORD.length + ' chars)' : 'NOT SET');
if (USE_GRAPH) {
  console.log('  GRAPH:', GRAPH_CLIENT_ID ? 'ENABLED' : 'NOT SET');
  console.log('  GRAPH_SENDER:', GRAPH_SENDER || 'NOT SET');
}

// Configurar transportador de email
const transporter = nodemailer.createTransport(
  MAIL_SERVICE.toLowerCase() === 'sendgrid'
    ? {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASSWORD
        }
      }
    : MAIL_HOST
    ? {
        host: MAIL_HOST,
        port: MAIL_PORT || 587,
        secure: MAIL_PORT === 465,
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASSWORD
        }
      }
    : {
        service: MAIL_SERVICE || 'gmail',
        auth: {
          user: MAIL_USER,
          pass: MAIL_PASSWORD
        }
      }
);

  let graphTokenCache = {
    token: null,
    expiresAt: 0
  };

  const getGraphToken = async () => {
    if (!GRAPH_TENANT_ID || !GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET) {
      throw new Error('Graph credentials are not configured');
    }

    const now = Date.now();
    if (graphTokenCache.token && graphTokenCache.expiresAt > now + 60_000) {
      return graphTokenCache.token;
    }

    const tokenUrl = `https://login.microsoftonline.com/${GRAPH_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', GRAPH_CLIENT_ID);
    params.append('client_secret', GRAPH_CLIENT_SECRET);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const token = response.data.access_token;
    const expiresIn = response.data.expires_in || 3600;
    graphTokenCache = {
      token,
      expiresAt: now + (expiresIn * 1000)
    };

    return token;
  };

  const sendGraphEmail = async ({ to, subject, html, text }) => {
    if (!GRAPH_SENDER) {
      throw new Error('Graph sender is not configured');
    }

    const accessToken = await getGraphToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(GRAPH_SENDER)}/sendMail`;

    const content = text || html || '';
    const contentType = text ? 'Text' : 'HTML';

    await axios.post(
      url,
      {
        message: {
          subject,
          body: {
            contentType,
            content
          },
          toRecipients: [
            {
              emailAddress: { address: to }
            }
          ]
        },
        saveToSentItems: true
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );
  };

  const sendEmail = async ({ to, subject, html, text }) => {
    if (USE_GRAPH) {
      await sendGraphEmail({ to, subject, html, text });
      return;
    }

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {})
    });
  };

// Función de prueba para verificar configuración
export async function testEmailConnection() {
  try {
    console.log('🔍 Testing email config...');
    console.log('MAIL_SERVICE:', process.env.MAIL_SERVICE || 'NOT SET');
    console.log('MAIL_HOST:', process.env.MAIL_HOST || 'NOT SET');
    console.log('MAIL_PORT:', process.env.MAIL_PORT || 'NOT SET');
    console.log('MAIL_USER:', process.env.MAIL_USER ? '✓ SET' : 'NOT SET');
    console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? `✓ SET (${process.env.MAIL_PASSWORD.substring(0, 10)}...)` : 'NOT SET');
    
    if (USE_GRAPH) {
      if (!GRAPH_TENANT_ID || !GRAPH_CLIENT_ID || !GRAPH_CLIENT_SECRET || !GRAPH_SENDER) {
        return {
          success: false,
          message: 'Missing Graph configuration',
          config: {
            GRAPH_TENANT_ID: GRAPH_TENANT_ID ? 'SET' : 'NOT SET',
            GRAPH_CLIENT_ID: GRAPH_CLIENT_ID ? 'SET' : 'NOT SET',
            GRAPH_CLIENT_SECRET: GRAPH_CLIENT_SECRET ? 'SET' : 'NOT SET',
            GRAPH_SENDER: GRAPH_SENDER || 'NOT SET'
          }
        };
      }

      await getGraphToken();
      return {
        success: true,
        message: 'Graph email configured correctly',
        config: {
          GRAPH_TENANT_ID: 'SET',
          GRAPH_CLIENT_ID: 'SET',
          GRAPH_SENDER: GRAPH_SENDER
        }
      };
    }

    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      return { 
        success: false, 
        message: 'Missing MAIL_USER or MAIL_PASSWORD environment variables',
        config: {
          service: process.env.MAIL_SERVICE || 'gmail',
          host: process.env.MAIL_HOST || 'auto',
          port: process.env.MAIL_PORT || 'auto',
          user: process.env.MAIL_USER ? 'SET' : 'NOT SET',
          password: process.env.MAIL_PASSWORD ? 'SET' : 'NOT SET'
        }
      };
    }
    
    console.log('⏳ Attempting transporter.verify()...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully');
    return { 
      success: true, 
      message: 'Email service configured correctly',
      config: {
        service: process.env.MAIL_SERVICE || 'gmail',
        host: process.env.MAIL_HOST || 'auto',
        port: process.env.MAIL_PORT || 'auto',
        user: process.env.MAIL_USER
      }
    };
  } catch (error) {
    console.error('❌ Transporter error:', error.code, error.message);
    return { 
      success: false, 
      message: 'Email service configuration error',
      error: error.message,
      errorCode: error.code,
      config: USE_GRAPH
        ? {
            GRAPH_TENANT_ID: GRAPH_TENANT_ID ? 'SET' : 'NOT SET',
            GRAPH_CLIENT_ID: GRAPH_CLIENT_ID ? 'SET' : 'NOT SET',
            GRAPH_CLIENT_SECRET: GRAPH_CLIENT_SECRET ? 'SET' : 'NOT SET',
            GRAPH_SENDER: GRAPH_SENDER || 'NOT SET'
          }
        : {
            service: process.env.MAIL_SERVICE || 'gmail',
            host: process.env.MAIL_HOST || 'auto',
            port: process.env.MAIL_PORT || 'auto',
            user: process.env.MAIL_USER ? 'SET' : 'NOT SET',
            password: process.env.MAIL_PASSWORD ? 'SET' : 'NOT SET'
          }
    };
  }
}

export async function sendBettingHouseRegistrationEmail(
  houseData,
  userData,
  options = {}
) {
  try {
    const approvalRequired = options?.approvalRequired === true;
    const activationUrl = options?.activationUrl;

    // Email para la casa de apuestas
    const houseEmailText = [
      'Bienvenido a Parlay Bets',
      'Tu casa de apuestas ha sido registrada exitosamente.',
      '',
      'Detalles de Registro:',
      `- Nombre de Casa: ${houseData.name}`,
      `- Email: ${houseData.email}`,
      `- País: ${houseData.country}`,
      `- Moneda: ${houseData.currency}`,
      `- ID de Casa: ${houseData.id}`,
      '',
      'Datos de Acceso:',
      `- Usuario: ${userData.username}`,
      `- Contraseña: ${userData.password}`,
      '',
      approvalRequired
        ? '✅ Tu casa quedará habilitada para apuestas una vez que el administrador apruebe la solicitud.'
        : '',
      '⚠️ IMPORTANTE: Guarda tus credenciales en un lugar seguro. Cambia tu contraseña al primer acceso.',
      'Portal: https://parlay-betting-platform-production.up.railway.app'
    ].filter(Boolean).join('\n');

    // Email para administrador
    const adminEmailText = [
      'Nueva Casa de Apuestas Registrada',
      'Una nueva casa de apuestas ha sido registrada en el sistema.',
      '',
      'Detalles:',
      `- Nombre de Casa: ${houseData.name}`,
      `- Email: ${houseData.email}`,
      `- País: ${houseData.country}`,
      `- Moneda: ${houseData.currency}`,
      `- ID: ${houseData.id}`,
      `- Balance Inicial: $${houseData.account_balance}`,
      '',
      'Usuario Administrador:',
      `- Usuario: ${userData.username}`,
      `- Email del Admin: ${houseData.email}`,
      '',
      `Fecha de Registro: ${new Date().toLocaleString('es-ES')}`,
      '',
      activationUrl
        ? `Activar casa de apuestas: ${activationUrl}`
        : '⚠️ No se generó link de activación (ADMIN_TOKEN no configurado).'
    ].join('\n');

    // Enviar email a la casa
    await sendEmail({
      to: houseData.email,
      subject: 'Bienvenido a Parlay Bets - Registro Completado',
      text: houseEmailText
    });

    // Enviar email al administrador
    await sendEmail({
      to: ADMIN_NOTIFICATION_EMAIL,
      subject: `Nueva Casa de Apuestas: ${houseData.name}`,
      text: adminEmailText
    });

    console.log('✅ Emails enviados exitosamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    // No lanzar error, solo registrar que falló el envío de email
    return { success: false, error: error.message };
  }
}

export async function sendAccountCreatedEmail({ to, username, tempPassword, houseName }) {
  try {
    const emailHtml = `
      <h2>Bienvenido a Parlay Bets</h2>
      <p>Tu cuenta ha sido creada correctamente.</p>
      <ul>
        <li><strong>Casa:</strong> ${houseName || 'Parlay Bets'}</li>
        <li><strong>Usuario:</strong> ${username}</li>
        <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
      </ul>
      <p>Por seguridad, cambia tu contraseña en el primer acceso.</p>
      <p><a href="https://parlay-betting-platform-production.up.railway.app">Ir al Portal</a></p>
    `;

    await sendEmail({
      to,
      subject: 'Tu cuenta Parlay Bets está lista',
      html: emailHtml
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de cuenta:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordResetEmail({ to, resetUrl }) {
  try {
    const emailHtml = `
      <h2>Restablecer contraseña</h2>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p><a href="${resetUrl}">Restablecer contraseña</a></p>
      <p>Si no solicitaste este cambio, ignora este mensaje.</p>
    `;

    await sendEmail({
      to,
      subject: 'Restablecer contraseña - Parlay Bets',
      html: emailHtml
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de reset:', error);
    return { success: false, error: error.message };
  }
}

export async function sendPasswordChangedEmail({ userId, newPassword }) {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const { query } = await import('../db/dbConfig.js');
    const userResult = await query(
      'SELECT email, username FROM betting_house_users WHERE id = $1 LIMIT 1',
      [userId]
    );

    if (!userResult.rows.length) {
      throw new Error('User not found for password change email');
    }

    const { email, username } = userResult.rows[0];

    const emailHtml = `
      <h2>Contraseña actualizada</h2>
      <p>Hola ${username || ''}, tu contraseña fue actualizada correctamente.</p>
      <p><strong>Nueva contraseña:</strong> ${newPassword}</p>
      <p>Si no realizaste este cambio, contacta al administrador de inmediato.</p>
      <p><a href="https://parlay-betting-platform-production.up.railway.app">Ir al Portal</a></p>
    `;

    await sendEmail({
      to: email,
      subject: 'Contraseña actualizada - Parlay Bets',
      html: emailHtml
    });

    return { success: true };
  } catch (error) {
    console.error('❌ Error enviando email de contraseña:', error);
    return { success: false, error: error.message };
  }
}
