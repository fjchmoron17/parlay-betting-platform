// backend/routes/betsDB.js
import express from 'express';
import {
  placeBet,
  getBetsForHouse,
  getBetById,
  settleBet,
  getBetStats,
  getBetsByDate
} from '../controllers/betsDBController.js';

const router = express.Router();

// POST /api/bets-db - Realizar una apuesta
router.post('/', placeBet);

// GET /api/bets-db/:bettingHouseId - Obtener apuestas de una casa
router.get('/:bettingHouseId', getBetsForHouse);

// GET /api/bets-db/:bettingHouseId/date/:date - Obtener apuestas por fecha
router.get('/:bettingHouseId/date/:date', getBetsByDate);

// GET /api/bets-db/:bettingHouseId/stats - Estadísticas de apuestas
router.get('/:bettingHouseId/stats', getBetStats);

// GET /api/bets-db/:id - Obtener una apuesta por ID
router.get('/detail/:id', getBetById);

// PUT /api/bets-db/:id/settle - Resolver una apuesta
router.put('/:id/settle', settleBet);

export default router;
