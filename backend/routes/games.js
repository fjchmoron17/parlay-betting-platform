// routes/games.js
import express from 'express';
import {
  getAllGames,
  getGamesByLeague,
  getGameById,
  getSports
} from '../controllers/gamesController.js';

const router = express.Router();

// GET /api/games/sports - Obtener lista de deportes disponibles
router.get('/sports', getSports);

// GET /api/games - Obtener todos los partidos
router.get('/', getAllGames);

// GET /api/games/league/:league - Obtener partidos por liga
router.get('/league/:league', getGamesByLeague);

// GET /api/games/:id - Obtener un partido específico
router.get('/:id', getGameById);

export default router;
