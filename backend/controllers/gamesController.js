// controllers/gamesController.js
import { getGamesFromAPI, getSportsAvailable, getGamesByRegion } from '../services/sportsApiService.js';

// Obtener lista de deportes disponibles
export const getSports = async (req, res) => {
  try {
    const result = await getSportsAvailable();
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      total: result.data.length,
      source: result.source,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('getSports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sports'
    });
  }
};

// Obtener todos los juegos
export const getAllGames = async (req, res) => {
  try {
    const { league, region = 'us' } = req.query;
    
    const result = await getGamesFromAPI(league, null, region);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    res.json({
      success: true,
      data: result.data,
      total: result.data.length,
      timestamp: result.timestamp,
      source: result.source,
      region: result.region
    });
  } catch (error) {
    console.error('getAllGames error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
};

export const getGamesByLeague = async (req, res) => {
  try {
    const { league } = req.params;
    const validLeagues = ['NBA', 'MLB', 'NFL', 'NHL'];
    
    if (!validLeagues.includes(league.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Invalid league. Must be one of: ${validLeagues.join(', ')}`
      });
    }
    
    const result = await getGamesFromAPI(league);
    
    res.json({
      success: true,
      league: league.toUpperCase(),
      data: result.data,
      total: result.data.length,
      timestamp: result.timestamp
    });
  } catch (error) {
    console.error('getGamesByLeague error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch games'
    });
  }
};

export const getGameById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getGamesFromAPI();
    
    const game = result.data.find(g => g.id === id);
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      });
    }
    
    res.json({
      success: true,
      data: game
    });
  } catch (error) {
    console.error('getGameById error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game'
    });
  }
};
