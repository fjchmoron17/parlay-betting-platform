// backend/routes/bettingHouses.js
import express from 'express';
import {
  getAllBettingHouses,
  getBettingHouseById,
  createBettingHouse,
  getBettingHouseSummary,
  deleteBettingHouse,
  reseedAuthUsers,
  updateBettingHouseStatus,
  activateBettingHouseFromEmail
} from '../controllers/bettingHousesController.js';

const router = express.Router();

const requireSuperAdminRole = (req, res, next) => {
  const roleHeader = req.headers['x-user-role'];
  if (roleHeader !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: super_admin role required'
    });
  }
  next();
};

// GET /api/betting-houses - Obtener todas las casas
router.get('/', getAllBettingHouses);

// GET /api/betting-houses/activate/:id - Activar casa via email
router.get('/activate/:id', activateBettingHouseFromEmail);

// GET /api/betting-houses/summary - Resumen de todas las casas
router.get('/summary', getBettingHouseSummary);

// GET /api/betting-houses/:id - Obtener una casa por ID
router.get('/:id', getBettingHouseById);

// POST /api/betting-houses - Crear nueva casa
router.post('/', createBettingHouse);

// DELETE /api/betting-houses/:id - Eliminar casa
router.delete('/:id', requireSuperAdminRole, deleteBettingHouse);

// PATCH /api/betting-houses/:id/status - Actualizar estado de casa
router.patch('/:id/status', requireSuperAdminRole, updateBettingHouseStatus);

// POST /api/betting-houses/admin/reseed - Reseed auth users (admin only)
router.post('/admin/reseed', reseedAuthUsers);

export default router;
