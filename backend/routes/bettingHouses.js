// backend/routes/bettingHouses.js
import express from 'express';
import {
  getAllBettingHouses,
  getBettingHouseById,
  createBettingHouse,
  getBettingHouseSummary,
  deleteBettingHouse
} from '../controllers/bettingHousesController.js';

const router = express.Router();

// GET /api/betting-houses - Obtener todas las casas
router.get('/', getAllBettingHouses);

// GET /api/betting-houses/summary - Resumen de todas las casas
router.get('/summary', getBettingHouseSummary);

// GET /api/betting-houses/:id - Obtener una casa por ID
router.get('/:id', getBettingHouseById);

// POST /api/betting-houses - Crear nueva casa
router.post('/', createBettingHouse);

// DELETE /api/betting-houses/:id - Eliminar casa
router.delete('/:id', deleteBettingHouse);

export default router;
