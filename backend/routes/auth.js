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

export default router;
