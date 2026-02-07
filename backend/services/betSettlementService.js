// backend/services/betSettlementService.js
// Servicio para resolver automáticamente las apuestas usando scores de The Odds API

import axios from 'axios';
import { Bet, BetSelection } from '../db/models/index.js';
import { query } from '../db/dbConfig.js';

const ODDS_API_KEY = process.env.ODDS_API_KEY;
const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const normalizeKey = (value) => (value || '').toString().toLowerCase().trim();

async function getSportsTitleToKeyMap() {
  if (!ODDS_API_KEY) return {};

  try {
    const response = await axios.get(`${ODDS_API_BASE}/sports`, {
      params: { apiKey: ODDS_API_KEY },
      timeout: 10000
    });

    const map = {};
    (response.data || []).forEach((sport) => {
      const title = normalizeKey(sport?.title);
      const key = normalizeKey(sport?.key);
      if (title && key) {
        map[title] = sport.key;
        map[`key:${key}`] = sport.key;
      }
    });

    return map;
  } catch (error) {
    console.error('⚠️ Error fetching sports map:', error.message);
    return {};
  }
}

function resolveSportKey(league, sportsMap, leagueFallbacks) {
  const normalized = normalizeKey(league);
  if (!normalized) return 'unknown';

  if (sportsMap[normalized]) return sportsMap[normalized];
  if (sportsMap[`key:${normalized}`]) return sportsMap[`key:${normalized}`];
  if (leagueFallbacks[normalized]) return leagueFallbacks[normalized];

  return normalized;
}

function toUTCDateOnly(value) {
  const d = value instanceof Date ? value : new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/**
 * Obtener scores de juegos completados en los últimos días
 * También intenta obtener datos de la API de eventos activos para detectar juegos que desaparecieron
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
    const completedGames = response.data.filter(game => game.completed === true);
    
    // Si no hay scores completados, intentar obtener eventos activos para detectar desapariciones
    if (completedGames.length === 0) {
      console.log(`   📡 No hay scores de ${sportKey}, intentando detectar juegos finalizados por desaparición...`);
      try {
        const activeUrl = `${ODDS_API_BASE}/sports/${sportKey}/odds`;
        const activeResponse = await axios.get(activeUrl, {
          params: {
            apiKey: ODDS_API_KEY,
            regions: 'us',
            markets: 'h2h',
            oddsFormat: 'decimal'
          }
        });
        
        // Los juegos que no están en activos pero tienen commence_time > now probablemente terminaron
        const activeGames = activeResponse.data.map(g => ({
          home_team: g.home_team,
          away_team: g.away_team,
          commence_time: g.commence_time
        }));
        
        console.log(`   📡 Encontrados ${activeGames.length} eventos activos`);
      } catch (e) {
        console.log(`   ⚠️  No se pudieron obtener eventos activos: ${e.message}`);
      }
    }
    
    return completedGames;
  } catch (error) {
    console.error(`Error fetching scores for ${sportKey}:`, error.message);
    return [];
  }
}

/**
 * Obtener eventos activos para un deporte
 * Ayuda a detectar cuándo un juego ha desaparecido (probablemente terminó)
 */
async function getActiveGames(sportKey) {
  try {
    const url = `${ODDS_API_BASE}/sports/${sportKey}/odds`;
    const response = await axios.get(url, {
      params: {
        apiKey: ODDS_API_KEY,
        regions: 'us',
        markets: 'h2h',
        oddsFormat: 'decimal'
      }
    });

    return response.data || [];
  } catch (error) {
    console.error(`Error fetching active games for ${sportKey}:`, error.message);
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
async function settleParlayBet(bet, completedGames, activeGames = []) {
  const selections = bet.selections;
  
  if (!selections || selections.length === 0) {
    console.log(`      ⚠️  Apuesta ${bet.id} sin selecciones`);
    return null;
  }

  let allWon = true;
  let anyLost = false;
  let evaluatedCount = 0;
  let hasNoScores = false;

  for (const selection of selections) {
    const eventDate = toUTCDateOnly(selection.game_commence_time);

    if (!eventDate) {
      console.log(`      ❌ Selección ${selection.id}: sin game_commence_time válido - marcando selección como perdida`);
      try {
        await BetSelection.updateStatus(selection.id, 'lost');
      } catch (error) {
        console.error(`      ⚠️  No se pudo actualizar estado de selección ${selection.id}:`, error.message);
      }

      anyLost = true;
      allWon = false;
      break;
    }

    if (new Date(selection.game_commence_time) > new Date()) {
      console.log(`      ⏸️  Selección ${selection.id}: evento aún no inicia (${selection.game_commence_time})`);
      allWon = false;
      continue;
    }

    // Buscar el juego completado que coincida con esta selección
    const selectionHome = normalizeKey(selection.home_team);
    const selectionAway = normalizeKey(selection.away_team);
    const selectionGameId = normalizeKey(selection.game_id);

    let matchedGame = completedGames.find(game => {
      const gameHome = normalizeKey(game.home_team);
      const gameAway = normalizeKey(game.away_team);
      const gameId = normalizeKey(game.id);

      return (
        (gameHome === selectionHome && gameAway === selectionAway) ||
        (gameId && selectionGameId && gameId === selectionGameId)
      );
    });

    if (!matchedGame) {
      // Si no hay scores, verificar si el juego desapareció de eventos activos
      const isInActiveGames = activeGames.some(game => {
        const gameHome = normalizeKey(game.home_team);
        const gameAway = normalizeKey(game.away_team);
        const gameId = normalizeKey(game.id);

        return (
          (gameHome === selectionHome && gameAway === selectionAway) ||
          (gameId && selectionGameId && gameId === selectionGameId)
        );
      });

      if (isInActiveGames) {
        console.log(`      ⏸️  Selección ${selection.id}: juego aún activo (${selection.home_team} vs ${selection.away_team})`);
        allWon = false;
        continue; // Juego aún está en eventos activos, no se puede resolver
      }

      // Si el juego desapareció de eventos activos y ya pasó su hora de inicio, probablemente terminó
      // pero sin scores disponibles, marcar como void (empate)
      console.log(`      ⚠️  Selección ${selection.id}: juego no está en activos, sin scores disponibles - VOID`);
      hasNoScores = true;
      // Marcar como void (sin resolver automáticamente)
      allWon = false;
      continue; // Por ahora, esperar a que la API entregue scores
    }

    if (matchedGame.commence_time && selection.game_commence_time !== matchedGame.commence_time) {
      try {
        await BetSelection.updateCommenceTime(selection.id, matchedGame.commence_time);
        selection.game_commence_time = matchedGame.commence_time;
        console.log(`      🕒 Selección ${selection.id}: actualizada hora de evento ${matchedGame.commence_time}`);
      } catch (error) {
        console.error(`      ⚠️  No se pudo actualizar hora de evento para selección ${selection.id}:`, error.message);
      }
    }

    const selectionWon = evaluateBet(selection, matchedGame);
    
    if (selectionWon === null) {
      console.log(`      ⏸️  Selección ${selection.id}: no se pudo evaluar`);
      // No se pudo evaluar, mantener pendiente
      allWon = false;
      continue;
    }

    evaluatedCount++;
    
    // Actualizar el estado de la selección
    const selectionStatus = selectionWon ? 'won' : 'lost';
    await BetSelection.updateStatus(selection.id, selectionStatus);
    
    console.log(`      ${selectionWon ? '✅' : '❌'} Selección ${selection.id}: ${selection.selected_team} - ${selectionWon ? 'GANÓ' : 'PERDIÓ'}`);

    if (selectionWon === false) {
      anyLost = true;
      allWon = false;
      break; // Si una pierde, toda la parlay pierde
    }
  }

  console.log(`      📊 Evaluadas ${evaluatedCount}/${selections.length} selecciones`);

  if (anyLost) {
    // Parlay perdida
    return {
      status: 'lost',
      actual_win: 0
    };
  }

  if (allWon && evaluatedCount === selections.length) {
    // Parlay ganada - calcular ganancia
    const potentialWin = parseFloat(bet.potential_win) || (parseFloat(bet.total_stake) * parseFloat(bet.total_odds));
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

    // Mapeo de ligas a sport keys de The Odds API (fallbacks)
    const leagueToSportKey = {
      'nfl': 'americanfootball_nfl',
      'nba': 'basketball_nba',
      'mlb': 'baseball_mlb',
      'nhl': 'icehockey_nhl',
      'ncaaf': 'americanfootball_ncaaf',
      'ncaab': 'basketball_ncaab',
      'other': 'other',
      'atp': 'tennis_atp_aus_open_singles',
      'tennis': 'tennis_atp_aus_open_singles'
    };

    // Resolver sport keys dinámicamente desde la API de deportes
    const sportsMap = await getSportsTitleToKeyMap();

    // Agrupar por deporte para minimizar llamadas a la API
    const sportKeys = [...new Set(pendingBets
      .filter(bet => bet.selections && bet.selections.length > 0)
      .flatMap(bet => bet.selections.map(sel => resolveSportKey(sel.league, sportsMap, leagueToSportKey)))
      .filter(key => key && key !== 'unknown')
    )];

    const allCompletedGames = {};
    const allActiveGames = {};

    // Obtener scores de cada deporte
    for (const sportKey of sportKeys) {
      if (sportKey !== 'unknown') {
        const games = await getCompletedGames(sportKey, 3);
        allCompletedGames[sportKey] = games;
        console.log(`📥 Obtenidos ${games.length} juegos completados de ${sportKey}`);
        
        // También obtener eventos activos para detectar desapariciones
        const activeGames = await getActiveGames(sportKey);
        allActiveGames[sportKey] = activeGames;
        console.log(`📡 Obtenidos ${activeGames.length} eventos activos de ${sportKey}`);
      }
    }

    let settledCount = 0;

    // Procesar cada apuesta
    for (const bet of pendingBets) {
      try {
        const betSportKeys = (bet.selections || [])
          .map(sel => resolveSportKey(sel.league, sportsMap, leagueToSportKey))
          .filter(key => key && key !== 'unknown');

        const completedGames = betSportKeys.flatMap(key => allCompletedGames[key] || []);
        const activeGames = betSportKeys.flatMap(key => allActiveGames[key] || []);

        console.log(`   🔍 Apuesta ${bet.id}: ${bet.selections?.length || 0} selecciones, ligas: ${[...new Set(betSportKeys)].join(', ') || 'unknown'}`);

        const result = await settleParlayBet(bet, completedGames, activeGames);

        if (result) {
          // Actualizar la apuesta usando el método estático
          await Bet.update(bet.id, {
            status: result.status,
            actual_win: result.actual_win,
            settled_at: new Date()
          });

          settledCount++;
          console.log(`   ✅ Apuesta ${bet.bet_ticket_number} resuelta: ${result.status.toUpperCase()}, win: $${result.actual_win}`);
        } else {
          console.log(`   ⏸️  Apuesta ${bet.id}: juegos aún no completados`);
        }
      } catch (error) {
        console.error(`   ❌ Error procesando apuesta ${bet.id}:`, error.message);
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

/**
 * Forzar resolución de apuestas que han estado pendientes más de 24 horas
 * sin que haya scores disponibles. Esto es un fallback para deportes donde
 * la API no actualiza rápidamente (como tenis)
 */
async function forceResolveOverdueStuckBets() {
  try {
    console.log('🔄 Verificando apuestas atrasadas para resolución forzada...');
    
    const overdueResult = await query(
      `SELECT b.id, b.bet_ticket_number, b.placed_at 
       FROM bets b 
       WHERE b.status = 'pending' 
       AND b.placed_at < NOW() - INTERVAL '24 hours'
       ORDER BY b.placed_at ASC 
       LIMIT 50`
    );
    
    const overdueBets = overdueResult.rows;
    
    if (overdueBets.length === 0) {
      console.log('✅ No hay apuestas atrasadas pendientes');
      return { forced: 0 };
    }
    
    console.log(`⏰ Encontradas ${overdueBets.length} apuestas pendientes > 24h`);
    
    let forcedCount = 0;
    
    for (const bet of overdueBets) {
      try {
        const selectionsResult = await query(
          'SELECT id, selection_status FROM bet_selections WHERE bet_id = $1',
          [bet.id]
        );
        
        const selections = selectionsResult.rows;
        const hasAllCompleted = selections.length > 0 && 
                                selections.every(s => s.selection_status !== 'pending');
        
        if (hasAllCompleted) {
          // La apuesta ya tiene todas sus selecciones resueltas, solo actualizar estado
          const hasLost = selections.some(s => s.selection_status === 'lost');
          const allWon = selections.every(s => s.selection_status === 'won');
          
          let newStatus = 'pending';
          let actualWin = '0.00';
          
          if (hasLost) {
            newStatus = 'lost';
          } else if (allWon) {
            const betDataResult = await query(
              'SELECT potential_win FROM bets WHERE id = $1',
              [bet.id]
            );
            newStatus = 'won';
            actualWin = betDataResult.rows[0]?.potential_win || '0.00';
          }
          
          if (newStatus !== 'pending') {
            await query(
              'UPDATE bets SET status = $1, actual_win = $2, settled_at = NOW() WHERE id = $3',
              [newStatus, actualWin, bet.id]
            );
            forcedCount++;
            console.log(`   ✅ Apuesta ${bet.bet_ticket_number} resuelta por timeout: ${newStatus.toUpperCase()}`);
          }
        } else {
          console.log(`   ⚠️  Apuesta ${bet.bet_ticket_number} aún tiene selecciones sin resolver - esperando API`);
        }
      } catch (error) {
        console.error(`   ❌ Error procesando apuesta atrasada ${bet.id}:`, error.message);
      }
    }
    
    console.log(`🎯 Resolución forzada completada: ${forcedCount} apuestas`);
    return { forced: forcedCount };
  } catch (error) {
    console.error('Error en forceResolveOverdueStuckBets:', error);
    throw error;
  }
}

export {
  processUnsettledBets,
  forceResolveOverdueStuckBets,
  getCompletedGames,
  getActiveGames,
  evaluateBet
};
