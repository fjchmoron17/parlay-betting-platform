import express from 'express';
import { 
  login,
  requestPasswordReset,
  confirmPasswordReset
} from '../controllers/authController.js';
import { 
  testEmailConnection,
  sendAccountCreatedEmail,
  sendPasswordResetEmail
} from '../services/emailService.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/password-reset/request
router.post('/password-reset/request', requestPasswordReset);

// POST /api/auth/password-reset/confirm
router.post('/password-reset/confirm', confirmPasswordReset);

// GET /api/auth/test-email - Prueba de configuración de email
router.get('/test-email', async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing email',
      error: error.message
    });
  }
});

const requireAdminToken = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (!process.env.ADMIN_TOKEN) {
    return res.status(500).json({
      success: false,
      error: 'ADMIN_TOKEN not configured'
    });
  }
  if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin token required'
    });
  }
  next();
};

// POST /api/auth/test-email/welcome - Enviar email de creación de cuenta
router.post('/test-email/welcome', requireAdminToken, async (req, res) => {
  try {
    const { to, username, tempPassword, houseName } = req.body || {};

    if (!to || !username || !tempPassword) {
      return res.status(400).json({
        success: false,
        error: 'to, username, tempPassword are required'
      });
    }

    const result = await sendAccountCreatedEmail({
      to,
      username,
      tempPassword,
      houseName
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/test-email/reset - Enviar email de reset de contraseña
router.post('/test-email/reset', requireAdminToken, async (req, res) => {
  try {
    const { to, resetUrl } = req.body || {};

    if (!to || !resetUrl) {
      return res.status(400).json({
        success: false,
        error: 'to and resetUrl are required'
      });
    }

    const result = await sendPasswordResetEmail({ to, resetUrl });
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/auth/debug-env - Mostrar variables de entorno (DEBUG ONLY)
router.get('/debug-env', (req, res) => {
  // Buscar todas las variables que contengan MAIL o EMAIL
  const allEnvKeys = Object.keys(process.env);
  const mailRelated = allEnvKeys.filter(key => 
    key.includes('MAIL') || key.includes('EMAIL') || key.includes('SMTP')
  );
  
  const mailVars = {};
  mailRelated.forEach(key => {
    mailVars[key] = key.includes('PASSWORD') || key.includes('PASS') 
      ? 'SET (' + process.env[key].length + ' chars)' 
      : process.env[key];
  });
  
  // Mostrar TODAS las variables (primeras 10 letras de valores sensibles)
  const allVars = {};
  allEnvKeys.forEach(key => {
    const value = process.env[key];
    if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN')) {
      allVars[key] = value ? `${value.substring(0, 10)}... (${value.length} chars)` : 'NOT SET';
    } else {
      allVars[key] = value;
    }
  });
  
  res.json({
    targetVars: {
      MAIL_SERVICE: process.env.MAIL_SERVICE || 'NOT SET',
      MAIL_USER: process.env.MAIL_USER || 'NOT SET',
      MAIL_PASSWORD_LENGTH: process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD.length : 'NOT SET',
      MAIL_PASSWORD_FIRST_CHAR: process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD[0] : 'NOT SET'
    },
    allMailRelatedVars: mailVars,
    allEnvVars: allVars,
    totalEnvVarsCount: allEnvKeys.length,
    NODE_ENV: process.env.NODE_ENV || 'development',
    RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || 'NOT SET',
    TIMESTAMP: new Date().toISOString()
  });
});

export default router;
