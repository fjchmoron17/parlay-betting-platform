// backend/services/betSettlementService.js
// Servicio para resolver automáticamente las apuestas usando scores de The Odds API

import axios from 'axios';
import { Bet, BetSelection } from '../db/models/index.js';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

/**
 * Obtener scores de juegos completados en los últimos días
 * @param {string} sportKey - Clave del deporte (ej: 'basketball_nba')
 * @param {number} daysFrom - Días hacia atrás para buscar (1-3)
 */
async function getCompletedGames(sportKey, daysFrom = 3) {
  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/scores`;
    const response = await axios.get(url, {
      params: {
        apiKey: ODDS_API_KEY,
        daysFrom: daysFrom
      }
    });

    // Filtrar solo juegos completados
    return response.data.filter(game => game.completed === true);
  } catch (error) {
    console.error(`Error fetching scores for ${sportKey}:`, error.message);
    return [];
  }
}

/**
 * Determinar el ganador de un juego según el resultado
 * @param {object} game - Objeto de juego con scores
 */
function determineWinner(game) {
  if (!game.scores || game.scores.length < 2) return null;

  const homeScore = parseInt(game.scores.find(s => s.name === game.home_team)?.score || 0);
  const awayScore = parseInt(game.scores.find(s => s.name === game.away_team)?.score || 0);

  if (homeScore > awayScore) return game.home_team;
  if (awayScore > homeScore) return game.away_team;
  return 'draw';
}

/**
 * Evaluar si una apuesta h2h (moneyline) ganó
 */
function evaluateH2HBet(bet, game) {
  const winner = determineWinner(game);
  if (!winner || winner === 'draw') return null;

  return bet.selected_team === winner;
}

/**
 * Evaluar si una apuesta de spreads ganó
 */
function evaluateSpreadBet(bet, game) {
  if (!game.scores || game.scores.length < 2) return null;

  const homeScore = parseInt(game.scores.find(s => s.name === game.home_team)?.score || 0);
  const awayScore = parseInt(game.scores.find(s => s.name === game.away_team)?.score || 0);

  const pointSpread = parseFloat(bet.point_spread);
  
  // Determinar si el equipo seleccionado es home o away
  const isHomeTeam = bet.selected_team === game.home_team;
  
  if (isHomeTeam) {
    // Home team con spread
    const adjustedHomeScore = homeScore + pointSpread;
    return adjustedHomeScore > awayScore;
  } else {
    // Away team con spread
    const adjustedAwayScore = awayScore + pointSpread;
    return adjustedAwayScore > homeScore;
  }
}

/**
 * Evaluar si una apuesta de totals (over/under) ganó
 */
function evaluateTotalsBet(bet, game) {
  if (!game.scores || game.scores.length < 2) return null;

  const homeScore = parseInt(game.scores.find(s => s.name === game.home_team)?.score || 0);
  const awayScore = parseInt(game.scores.find(s => s.name === game.away_team)?.score || 0);
  const totalScore = homeScore + awayScore;

  const pointTotal = parseFloat(bet.point_spread); // En totals, point_spread contiene el total
  const isOver = bet.selected_team.toLowerCase().includes('over');

  if (isOver) {
    return totalScore > pointTotal;
  } else {
    return totalScore < pointTotal;
  }
}

/**
 * Evaluar si una apuesta individual ganó
 */
function evaluateBet(bet, game) {
  switch (bet.market) {
    case 'h2h':
      return evaluateH2HBet(bet, game);
    case 'spreads':
      return evaluateSpreadBet(bet, game);
    case 'totals':
      return evaluateTotalsBet(bet, game);
    default:
      console.warn(`Market type ${bet.market} not supported for auto-settlement`);
      return null;
  }
}

/**
 * Resolver una apuesta parlay
 */
async function settleParlayBet(bet, completedGames) {
  const selections = bet.selections;
  let allWon = true;
  let anyLost = false;

  for (const selection of selections) {
    // Buscar el juego completado que coincida con esta selección
    const matchedGame = completedGames.find(game => 
      (game.home_team === selection.home_team && game.away_team === selection.away_team) ||
      (game.id === selection.game_id)
    );

    if (!matchedGame) {
      // No se encontró el resultado, la apuesta no se puede resolver aún
      return null;
    }

    const selectionWon = evaluateBet(selection, matchedGame);
    
    if (selectionWon === null) {
      // No se pudo evaluar, mantener pendiente
      return null;
    }

    if (selectionWon === false) {
      anyLost = true;
      allWon = false;
      break; // Si una pierde, toda la parlay pierde
    }
  }

  if (anyLost) {
    // Parlay perdida
    return {
      status: 'lost',
      actual_win: 0
    };
  }

  if (allWon) {
    // Parlay ganada - calcular ganancia
    const potentialWin = bet.potential_win || (bet.stake_amount * bet.total_odds);
    return {
      status: 'won',
      actual_win: potentialWin
    };
  }

  return null; // No se puede determinar aún
}

/**
 * Procesar apuestas pendientes y resolver las que tengan resultados
 */
async function processUnsettledBets() {
  try {
    console.log('🔄 Iniciando proceso de resolución automática de apuestas...');

    // Obtener todas las apuestas pendientes
    const pendingBets = await Bet.findAllPending();

    if (pendingBets.length === 0) {
      console.log('✅ No hay apuestas pendientes para procesar');
      return { processed: 0, settled: 0 };
    }

    console.log(`📊 Encontradas ${pendingBets.length} apuestas pendientes`);

    // Cargar selecciones para cada apuesta
    for (const bet of pendingBets) {
      bet.selections = await BetSelection.findByBetId(bet.id);
    }

    // Agrupar por deporte para minimizar llamadas a la API
    const sportKeys = [...new Set(pendingBets
      .filter(bet => bet.selections && bet.selections.length > 0)
      .map(bet => bet.selections[0]?.league?.toLowerCase().replace(/\s+/g, '_') || 'unknown')
    )];

    // Mapeo de ligas a sport keys de The Odds API
    const leagueToSportKey = {
      'nfl': 'americanfootball_nfl',
      'nba': 'basketball_nba',
      'mlb': 'baseball_mlb',
      'nhl': 'icehockey_nhl',
      'ncaaf': 'americanfootball_ncaaf',
      'ncaab': 'basketball_ncaab'
    };

    const allCompletedGames = {};

    // Obtener scores de cada deporte
    for (const sportKey of sportKeys) {
      const mappedKey = leagueToSportKey[sportKey] || sportKey;
      if (mappedKey !== 'unknown') {
        const games = await getCompletedGames(mappedKey, 3);
        allCompletedGames[sportKey] = games;
        console.log(`📥 Obtenidos ${games.length} juegos completados de ${mappedKey}`);
      }
    }

    let settledCount = 0;

    // Procesar cada apuesta
    for (const bet of pendingBets) {
      try {
        const sportKey = bet.selections[0]?.league?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
        const completedGames = allCompletedGames[sportKey] || [];

        if (completedGames.length === 0) continue;

        const result = await settleParlayBet(bet, completedGames);

        if (result) {
          // Actualizar la apuesta
          await bet.update({
            status: result.status,
            actual_win: result.actual_win,
            settled_at: new Date()
          });

          settledCount++;
          console.log(`✅ Apuesta ${bet.ticket_number} resuelta: ${result.status.toUpperCase()}`);
        }
      } catch (error) {
        console.error(`Error procesando apuesta ${bet.id}:`, error.message);
      }
    }

    console.log(`🎯 Proceso completado: ${settledCount} de ${pendingBets.length} apuestas resueltas`);

    return {
      processed: pendingBets.length,
      settled: settledCount
    };
  } catch (error) {
    console.error('Error en processUnsettledBets:', error);
    throw error;
  }
}

export {
  processUnsettledBets,
  getCompletedGames,
  evaluateBet
};
