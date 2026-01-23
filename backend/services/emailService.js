// backend/services/emailService.js
import nodemailer from 'nodemailer';

// Configurar transportador de email
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Función de prueba para verificar configuración
export async function testEmailConnection() {
  try {
    console.log('🔍 Testing email config...');
    console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ SET' : 'NOT SET');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ SET' : 'NOT SET');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return { 
        success: false, 
        message: 'Missing EMAIL_USER or EMAIL_PASSWORD environment variables',
        config: {
          service: process.env.EMAIL_SERVICE || 'gmail',
          user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
          password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
        }
      };
    }
    
    await transporter.verify();
    return { 
      success: true, 
      message: 'Email service configured correctly',
      config: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER
      }
    };
  } catch (error) {
    return { 
      success: false, 
      message: 'Email service configuration error',
      error: error.message,
      config: {
        service: process.env.EMAIL_SERVICE || 'gmail',
        user: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
        password: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET'
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
      from: process.env.EMAIL_USER,
      to: houseData.email,
      subject: 'Bienvenido a Parlay Bets - Registro Completado',
      html: houseEmailHtml
    });

    // Enviar email al administrador
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
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
