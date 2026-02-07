// routes/games.js
import express from 'express';
import {
  getAllGames,
  getGamesByLeague,
  getGameById,
  getSports
} from '../controllers/gamesController.js';
import axios from 'axios';
import { oddsApiGet, getOddsApiKeyStatus } from '../services/oddsApiClient.js';

const router = express.Router();

// GET /api/games/sports - Obtener lista de deportes disponibles
router.get('/sports', getSports);

// GET /api/games/quota-keys - Ver cuota de API keys (principal y respaldo)
router.get('/quota-keys', async (req, res) => {
  try {
    const baseUrl = process.env.ODDS_API_BASE_URL || 'https://api.the-odds-api.com/v4';
    const keys = [
      { label: 'Principal', key: process.env.ODDS_API_KEY },
      { label: 'Respaldo', key: process.env.ODDS_APY_KEY_BK || process.env.ODDS_API_KEY_BK }
    ].filter((item) => item.key && item.key !== 'YOUR_API_KEY_HERE');

    if (keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No Odds API keys configured'
      });
    }

    const results = await Promise.all(keys.map(async (item) => {
      try {
        const response = await axios.get(`${baseUrl}/sports`, {
          params: { apiKey: item.key },
          timeout: 10000
        });

        return {
          label: item.label,
          remaining: response.headers['x-requests-remaining'] ?? null,
          used: response.headers['x-requests-used'] ?? null,
          total: 500,
          ok: true
        };
      } catch (error) {
        return {
          label: item.label,
          remaining: null,
          used: null,
          total: 500,
          ok: false,
          status: error.response?.status || null
        };
      }
    }));

    const status = getOddsApiKeyStatus();
    const activeLabel = keys[status.activeIndex]?.label || null;

    res.json({
      success: true,
      data: results,
      activeKey: activeLabel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/games/debug - Debug endpoint para ver respuesta raw de API
router.get('/debug', async (req, res) => {
  try {
    const { sport = 'basketball_nba', region = 'us' } = req.query;
    const { response, keyUsed, quotaRemaining, quotaUsed } = await oddsApiGet(
      `/sports/${sport}/odds`,
      {
        regions: region,
        markets: 'h2h',
        oddsFormat: 'decimal',
        dateFormat: 'iso'
      }
    );
    
    const games = response.data;
    const sample = games[0] || null;
    
    res.json({
      success: true,
      apiKeyLength: keyUsed?.length || 0,
      totalGames: games.length,
      sampleGame: sample ? {
        id: sample.id,
        home: sample.home_team,
        away: sample.away_team,
        bookmakers: sample.bookmakers?.length || 0,
        bookmakersList: sample.bookmakers?.map(b => b.key) || [],
        firstBookmaker: sample.bookmakers?.[0] || null
      } : null,
      quotaRemaining: quotaRemaining,
      quotaUsed: quotaUsed
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
