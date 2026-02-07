// backend/services/emailService.js
import nodemailer from 'nodemailer';

const MAIL_SERVICE = (process.env.MAIL_SERVICE || 'gmail').trim();
const MAIL_HOST = process.env.MAIL_HOST?.trim();
const MAIL_PORT = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) : undefined;
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASSWORD = process.env.MAIL_PASSWORD;

// Log de configuración al iniciar
console.log('📧 Email Service Init:');
console.log('  SERVICE:', MAIL_SERVICE || 'NOT SET');
console.log('  HOST:', MAIL_HOST || (MAIL_SERVICE?.toLowerCase() === 'sendgrid' ? 'smtp.sendgrid.net' : '—'));
console.log('  PORT:', MAIL_PORT || (MAIL_SERVICE?.toLowerCase() === 'sendgrid' ? 587 : '—'));
console.log('  USER:', MAIL_USER || 'NOT SET');
console.log('  PASSWORD:', MAIL_PASSWORD ? 'SET (' + MAIL_PASSWORD.length + ' chars)' : 'NOT SET');

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

// Función de prueba para verificar configuración
export async function testEmailConnection() {
  try {
    console.log('🔍 Testing email config...');
    console.log('MAIL_SERVICE:', process.env.MAIL_SERVICE || 'NOT SET');
    console.log('MAIL_HOST:', process.env.MAIL_HOST || 'NOT SET');
    console.log('MAIL_PORT:', process.env.MAIL_PORT || 'NOT SET');
    console.log('MAIL_USER:', process.env.MAIL_USER ? '✓ SET' : 'NOT SET');
    console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? `✓ SET (${process.env.MAIL_PASSWORD.substring(0, 10)}...)` : 'NOT SET');
    
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
      config: {
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
  userData
) {
  try {
    // Email para la casa de apuestas
    const houseEmailHtml = `
      <h2>Bienvenido a Parlay Bets</h2>
      <p>Tu casa de apuestas ha sido registrada exitosamente.</p>
      
      <h3>Detalles de Registro:</h3>
      <ul>
        <li><strong>Nombre de Casa:</strong> ${houseData.name}</li>
        <li><strong>Email:</strong> ${houseData.email}</li>
        <li><strong>País:</strong> ${houseData.country}</li>
        <li><strong>Moneda:</strong> ${houseData.currency}</li>
        <li><strong>ID de Casa:</strong> ${houseData.id}</li>
      </ul>
      
      <h3>Datos de Acceso:</h3>
      <ul>
        <li><strong>Usuario:</strong> ${userData.username}</li>
        <li><strong>Contraseña:</strong> ${userData.password}</li>
      </ul>
      
      <p><strong>⚠️ IMPORTANTE:</strong> Guarda tus credenciales en un lugar seguro. Cambia tu contraseña al primer acceso.</p>
      
      <p><a href="https://parlay-betting-platform-production.up.railway.app">Ir al Portal</a></p>
    `;

    // Email para administrador
    const adminEmailHtml = `
      <h2>Nueva Casa de Apuestas Registrada</h2>
      <p>Una nueva casa de apuestas ha sido registrada en el sistema.</p>
      
      <h3>Detalles:</h3>
      <ul>
        <li><strong>Nombre de Casa:</strong> ${houseData.name}</li>
        <li><strong>Email:</strong> ${houseData.email}</li>
        <li><strong>País:</strong> ${houseData.country}</li>
        <li><strong>Moneda:</strong> ${houseData.currency}</li>
        <li><strong>ID:</strong> ${houseData.id}</li>
        <li><strong>Balance Inicial:</strong> $${houseData.account_balance}</li>
      </ul>
      
      <h3>Usuario Administrador:</h3>
      <ul>
        <li><strong>Usuario:</strong> ${userData.username}</li>
        <li><strong>Email del Admin:</strong> ${houseData.email}</li>
      </ul>
      
      <p><strong>Fecha de Registro:</strong> ${new Date().toLocaleString('es-ES')}</p>
    `;

    // Enviar email a la casa
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: houseData.email,
      subject: 'Bienvenido a Parlay Bets - Registro Completado',
      html: houseEmailHtml
    });

    // Enviar email al administrador
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: 'fjchmoron@chirinossolutions.com',
      subject: `Nueva Casa de Apuestas: ${houseData.name}`,
      html: adminEmailHtml
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

    await transporter.sendMail({
      from: process.env.MAIL_USER,
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

    await transporter.sendMail({
      from: process.env.MAIL_USER,
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
