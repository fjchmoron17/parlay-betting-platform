// backend/routes/betsDB.js
import express from 'express';
import {
  placeBet,
  getBetsForHouse,
  getBetById,
  settleBet,
  getBetStats,
  getBetsByDate,
  updateSelections,
  validateAndFixBets,
  resolveSelection,
  getPendingSelections
} from '../controllers/betsDBController.js';

const router = express.Router();

// POST /api/bets-db - Realizar una apuesta
router.post('/', placeBet);

// GET /api/bets-db?betting_house_id=X - Obtener apuestas de una casa (query params)
router.get('/', getBetsForHouse);

// GET /api/bets-db/stats?betting_house_id=X - Estadísticas de apuestas
router.get('/stats', getBetStats);

// GET /api/bets-db/by-date?betting_house_id=X&date=Y - Obtener apuestas por fecha
router.get('/by-date', getBetsByDate);

// GET /api/bets-db/pending - Obtener todas las selecciones pendientes
router.get('/pending', getPendingSelections);

// GET /api/bets-db/detail/:id - Obtener una apuesta por ID
router.get('/detail/:id', getBetById);

// POST /api/bets-db/update-selections - Actualizar campos en selecciones
router.post('/update-selections', updateSelections);

// POST /api/bets-db/validate-all - Validar y corregir todas las apuestas
router.post('/validate-all', validateAndFixBets);

// POST /api/bets-db/resolve-selection - Resolver una selección manualmente
router.post('/resolve-selection', resolveSelection);

// PUT /api/bets-db/:id/settle - Resolver una apuesta
router.put('/:id/settle', settleBet);

export default router;
