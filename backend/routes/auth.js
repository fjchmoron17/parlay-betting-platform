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
  res.json({
    MAIL_SERVICE: process.env.MAIL_SERVICE || 'NOT SET',
    MAIL_USER: process.env.MAIL_USER || 'NOT SET',
    MAIL_PASSWORD_LENGTH: process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD.length : 'NOT SET',
    MAIL_PASSWORD_FIRST_CHAR: process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD[0] : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV || 'development',
    TIMESTAMP: new Date().toISOString()
  });
});

export default router;
