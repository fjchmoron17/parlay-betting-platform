// routes/games.js
import express from 'express';
import {
  getAllGames,
  getGamesByLeague,
  getGameById,
  getSports
} from '../controllers/gamesController.js';
import axios from 'axios';

const router = express.Router();

// GET /api/games/sports - Obtener lista de deportes disponibles
router.get('/sports', getSports);

// GET /api/games/debug - Debug endpoint para ver respuesta raw de API
router.get('/debug', async (req, res) => {
  try {
    const { sport = 'basketball_nba', region = 'us' } = req.query;
    const apiKey = process.env.ODDS_API_KEY;
    const baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
    
    const response = await axios.get(
      `${baseUrl}/sports/${sport}/odds`,
      {
        params: {
          apiKey: apiKey,
          regions: region,
          markets: 'h2h',
          oddsFormat: 'decimal',
          dateFormat: 'iso'
        }
      }
    );
    
    const games = response.data;
    const sample = games[0] || null;
    
    res.json({
      success: true,
      apiKeyLength: apiKey?.length || 0,
      totalGames: games.length,
      sampleGame: sample ? {
        id: sample.id,
        home: sample.home_team,
        away: sample.away_team,
        bookmakers: sample.bookmakers?.length || 0,
        bookmakersList: sample.bookmakers?.map(b => b.key) || [],
        firstBookmaker: sample.bookmakers?.[0] || null
      } : null,
      quotaRemaining: response.headers['x-requests-remaining'],
      quotaUsed: response.headers['x-requests-used']
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status
    });
  }
});

// GET /api/games - Obtener todos los partidos
router.get('/', getAllGames);

// GET /api/games/league/:league - Obtener partidos por liga
router.get('/league/:league', getGamesByLeague);

// GET /api/games/:id - Obtener un partido específico
router.get('/:id', getGameById);

export default router;
