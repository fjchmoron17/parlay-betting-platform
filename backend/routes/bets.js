// routes/bets.js
import express from 'express';
import {
  createBet,
  getBet,
  getAllBets,
  getRecentBets,
  updateBetStatus,
  getBetStats
} from '../controllers/betsController.js';

import { voidOldPendingBets } from '../controllers/betsController.js';

const router = express.Router();

// POST /api/bets - Crear una nueva apuesta
router.post('/', createBet);

// GET /api/bets - Obtener todas las apuestas
router.get('/', getAllBets);

// GET /api/bets/stats - Obtener estadísticas
router.get('/stats', getBetStats);

// GET /api/bets/recent - Obtener apuestas recientes
router.get('/recent', getRecentBets);

// POST /api/bets/void-old - Marcar apuestas abiertas de hace más de una semana como void
router.post('/void-old', voidOldPendingBets);

// PUT /api/bets/:id/status - Actualizar estado de apuesta
router.put('/:id/status', updateBetStatus);

// GET /api/bets/:id - Obtener una apuesta específica
router.get('/:id', getBet);

export default router;
