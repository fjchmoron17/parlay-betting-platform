import express from 'express';
import { login } from '../controllers/authController.js';
import { testEmailConnection } from '../services/emailService.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', login);

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
