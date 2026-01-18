// src/services/api.js
const API_BASE_URL = 'http://localhost:3333/api';

// Función auxiliar para manejar peticiones
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Servicios de Deportes
export const sportsAPI = {
  // Obtener lista de deportes disponibles
  getAll: async () => {
    return fetchAPI('/games/sports');
  },
};

// Servicios de Juegos
export const gamesAPI = {
  // Obtener todos los juegos
  getAll: async (league = null, region = 'us') => {
    const params = new URLSearchParams();
    if (league) params.append('league', league);
    if (region) params.append('region', region);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/games${query}`);
  },

  // Obtener juegos por liga
  getByLeague: async (league, market = 'h2h', region = 'us') => {
    const params = new URLSearchParams();
    if (market) params.append('market', market);
    if (region) params.append('region', region);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/games/league/${league}${query}`);
  },

  // Obtener un juego específico
  getById: async (id) => {
    return fetchAPI(`/games/${id}`);
  },

  // Obtener juegos por región
  getByRegion: async (region = 'us', market = 'h2h') => {
    const params = new URLSearchParams();
    if (region) params.append('region', region);
    if (market) params.append('market', market);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchAPI(`/games${query}`);
  },
};

// Servicios de Apuestas
export const betsAPI = {
  // Crear una nueva apuesta
  create: async (betData) => {
    return fetchAPI('/bets', {
      method: 'POST',
      body: JSON.stringify(betData),
    });
  },

  // Obtener una apuesta por ID
  getById: async (betId) => {
    return fetchAPI(`/bets/${betId}`);
  },

  // Obtener apuestas de un usuario
  getUserBets: async (userId) => {
    return fetchAPI(`/bets/user/${userId}`);
  },

  // Obtener todas las apuestas (admin)
  getAll: async () => {
    return fetchAPI('/bets');
  },
};

export default {
  sportsAPI,
  gamesAPI,
  betsAPI,
};
