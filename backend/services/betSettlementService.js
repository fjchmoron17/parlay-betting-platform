// Commit for Railway snapshot: 2026-02-08
// backend/services/betSettlementService.js
// Servicio para resolver automáticamente las apuestas usando scores de The Odds API

import { Bet, BetSelection } from '../db/models/index.js';
import { query } from '../db/dbConfig.js';
import { oddsApiGet } from './oddsApiClient.js';

const ODDS_API_BASE = 'https://api.the-odds-api.com/v4';

const normalizeKey = (value) => (value || '').toString().toLowerCase().trim();

async function getSportsTitleToKeyMap() {
  try {
    const { response } = await oddsApiGet('/sports', {}, { timeout: 10000 });

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

  // Fallback: try to match league/country/team to API keys
  if (sportsMap[normalized]) return sportsMap[normalized];
  if (sportsMap[`key:${normalized}`]) return sportsMap[`key:${normalized}`];
  if (leagueFallbacks[normalized]) return leagueFallbacks[normalized];

  // Fallback for 'other': try to match by team/country
  if (normalized === 'other') {
    // Try to match using home/away team or country
    // This will be handled in settleParlayBet per selection
    return 'other';
  }

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
    const { response } = await oddsApiGet(
      `/sports/${sportKey}/scores`,
      { daysFrom: daysFrom, dateFormat: 'iso' }
    );

    const now = Date.now();
    const completionCutoff = now - 2 * 60 * 60 * 1000; // 2 horas

    // Filtrar juegos completados o con scores disponibles (fallback)
    const completedGames = response.data.filter((game) => {
      if (game.completed === true) return true;
      if (!game.scores || game.scores.length < 2) return false;
      const commence = new Date(game.commence_time).getTime();
      if (Number.isNaN(commence)) return false;
      return commence < completionCutoff;
    });
    
    // Si no hay scores completados, intentar obtener eventos activos para detectar desapariciones
    if (completedGames.length === 0) {
      console.log(`   📡 No hay scores de ${sportKey}, intentando detectar juegos finalizados por desaparición...`);
      try {
        const { response: activeResponse } = await oddsApiGet(
          `/sports/${sportKey}/odds`,
          {
            regions: 'us',
            markets: 'h2h',
            oddsFormat: 'decimal'
          }
        );
        
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
    const { response } = await oddsApiGet(
      `/sports/${sportKey}/odds`,
      {
        regions: 'us',
        markets: 'h2h',
        oddsFormat: 'decimal'
      }
    );

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
  if (!winner) return null;
  if (winner === 'draw') return 'void';

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

  const overUnderType = bet.over_under_type || (bet.selected_team && bet.selected_team.toLowerCase().includes('over') ? 'over' : 'under');
  const overUnderValue = bet.over_under_value != null ? parseFloat(bet.over_under_value) : parseFloat(bet.point_spread);

  // Si es tenis y hay sets, calcular por juegos o sets
  if (game.sport_key && game.sport_key.includes('tennis') && Array.isArray(game.sets) && game.sets.length > 0) {
    // Si el mercado es juegos totales
    if (bet.market === 'totals_games' || bet.market === 'totals' || bet.market === 'total_games') {
      const totalJuegos = game.sets.reduce((sum, set) => sum + (parseInt(set.home) || 0) + (parseInt(set.away) || 0), 0);
      if (overUnderType === 'over') {
        if (totalJuegos > overUnderValue) return true;
        if (totalJuegos < overUnderValue) return false;
        return 'void';
      } else if (overUnderType === 'under') {
        if (totalJuegos < overUnderValue) return true;
        if (totalJuegos > overUnderValue) return false;
        return 'void';
      }
    }
    // Si el mercado es sets totales
    if (bet.market === 'totals_sets' || bet.market === 'total_sets') {
      const homeSets = game.sets.filter(set => (parseInt(set.home) || 0) > (parseInt(set.away) || 0)).length;
      const awaySets = game.sets.filter(set => (parseInt(set.away) || 0) > (parseInt(set.home) || 0)).length;
      const totalSets = homeSets + awaySets;
      if (overUnderType === 'over') {
        if (totalSets > overUnderValue) return true;
        if (totalSets < overUnderValue) return false;
        return 'void';
      } else if (overUnderType === 'under') {
        if (totalSets < overUnderValue) return true;
        if (totalSets > overUnderValue) return false;
        return 'void';
      }
    }
  } else {
    // Resolver por goles, canastas o puntos (otros deportes)
    const homeScore = parseInt(game.scores.find(s => s.name === game.home_team)?.score || 0);
    const awayScore = parseInt(game.scores.find(s => s.name === game.away_team)?.score || 0);
    const totalScore = homeScore + awayScore;
    if (overUnderType === 'over') {
      if (totalScore > overUnderValue) return true;
      if (totalScore < overUnderValue) return false;
      return 'void';
    } else if (overUnderType === 'under') {
      if (totalScore < overUnderValue) return true;
      if (totalScore > overUnderValue) return false;
      return 'void';
    }
  }
  return null;
}

/**
 * Evaluar si una apuesta individual ganó
 */
function evaluateBet(bet, game) {
  let result = null;

  switch (bet.market) {
    case 'h2h':
      result = evaluateH2HBet(bet, game);
      break;
    case 'spreads':
      result = evaluateSpreadBet(bet, game);
      break;
    case 'totals':
      result = evaluateTotalsBet(bet, game);
      break;
    default:
      console.warn(`Market type ${bet.market} not supported for auto-settlement`);
      return null;
  }

  if (result === 'void') return 'void';
  if (result === true) return 'won';
  if (result === false) return 'lost';
  return null;
}

/**
 * Resolver una apuesta parlay
 */
async function settleParlayBet(bet, completedGames, activeGames = [], allCompletedGames = {}, allActiveGames = {}) {
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
        const updateResult = await BetSelection.updateStatus(selection.id, 'lost');
        console.log(`      [AUDIT] updateStatus called for selection ${selection.id} -> 'lost'. Result:`, updateResult);
      } catch (error) {
        console.error(`      ⚠️  No se pudo actualizar estado de selección ${selection.id}:`, error.message);
      }

      anyLost = true;
      allWon = false;
      continue;
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
    const selectionLeague = normalizeKey(selection.league);
    const selectionCountry = normalizeKey(selection.country || '');

    let matchedGame = completedGames.find(game => {
      const gameHome = normalizeKey(game.home_team);
      const gameAway = normalizeKey(game.away_team);
      const gameId = normalizeKey(game.id);
      const gameLeague = normalizeKey(game.league || game.sportTitle || '');
      const gameCountry = normalizeKey(game.country || '');
      const gameCommence = toUTCDateOnly(game.commence_time);
      const selectionCommence = toUTCDateOnly(selection.game_commence_time);

      // Match by gameId
      if (gameId && selectionGameId && gameId === selectionGameId) {
        console.log(`         [MATCH] Por gameId: ${gameId}`);
        return true;
      }

      // Match by teams and date (±2 días, solo fecha)
      if (gameHome === selectionHome && gameAway === selectionAway) {
        if (!selectionCommence || !gameCommence) {
          console.log(`         [MATCH] Por equipos (sin fecha)`);
          return true;
        }
        // Comparar solo la fecha (YYYY-MM-DD)
        const date1 = gameCommence;
        const date2 = selectionCommence;
        const diffDays = Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 2) {
          console.log(`         [MATCH] Por equipos y fecha (±2 días)`);
          return true;
        }
      }

      // Fallback: match by league/country if 'other'
      if (selectionLeague === 'other') {
        if (gameLeague && selectionLeague && gameLeague === selectionLeague) {
          console.log(`         [MATCH] Por league (other): ${gameLeague}`);
          return true;
        }
        if (gameCountry && selectionCountry && gameCountry === selectionCountry) {
          console.log(`         [MATCH] Por country (other): ${gameCountry}`);
          return true;
        }
      }
      return false;
    });

    if (!matchedGame && allCompletedGames) {
      let sportKeys = [];
      if (selection.sport && selection.sport.toLowerCase() !== 'other') {
        sportKeys = Object.keys(allCompletedGames).filter(key => key.startsWith(selection.sport.toLowerCase()));
      }
      // Si no hay sportKeys o el deporte es 'other', buscar en todos los sportKeys
      if (sportKeys.length === 0) {
        sportKeys = Object.keys(allCompletedGames);
        console.log(`         [FALLBACK] Buscando en TODOS los sportKeys disponibles (ligas: ${sportKeys.join(', ')})`);
      } else {
        console.log(`         [FALLBACK] Buscando en todos los sportKeys del deporte: ${selection.sport} (${sportKeys.join(', ')})`);
      }
      for (const key of sportKeys) {
        const games = allCompletedGames[key] || [];
        matchedGame = games.find(game => {
          const gameHome = normalizeKey(game.home_team);
          const gameAway = normalizeKey(game.away_team);
          const gameId = normalizeKey(game.id);
          const gameCommence = toUTCDateOnly(game.commence_time);
          const selectionCommence = toUTCDateOnly(selection.game_commence_time);
          if (gameId && selectionGameId && gameId === selectionGameId) {
            console.log(`            [MATCH-FALLBACK] Por gameId en ${key}: ${gameId}`);
            return true;
          }
          if (gameHome === selectionHome && gameAway === selectionAway) {
            if (!selectionCommence || !gameCommence) {
              console.log(`            [MATCH-FALLBACK] Por equipos en ${key} (sin fecha)`);
              return true;
            }
            const diffDays = Math.abs(new Date(game.commence_time).getTime() - new Date(selection.game_commence_time).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1) {
              console.log(`            [MATCH-FALLBACK] Por equipos y fecha en ${key} (±1 día)`);
              return true;
            }
          }
          return false;
        });
        if (matchedGame) break;
      }
      if (!matchedGame) {
        console.log(`         [NO MATCH] No se encontró partido en ningún sportKey disponible`);
      }
    }

    if (!matchedGame) {
      // Si no hay scores, verificar si el juego está ACTIVO en la API (no resolver si está activo)
      let isInActiveGames = false;
      // Buscar en todos los sportKeys si no hay match directo
      const allActive = [
        ...(activeGames || []),
        ...Object.values(allActiveGames || {}).flat()
      ];
      isInActiveGames = allActive.some(game => {
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
      // Si el juego desapareció de eventos activos y aún no hay scores, esperar a la API
      console.log(`      ⚠️  Selección ${selection.id}: juego no está en activos, sin scores disponibles - esperando API`);
      hasNoScores = true;
      allWon = false;
      continue;
    }

    if (matchedGame.commence_time && selection.game_commence_time !== matchedGame.commence_time) {
      try {
        const updateCommence = await BetSelection.updateCommenceTime(selection.id, matchedGame.commence_time);
        console.log(`      [AUDIT] updateCommenceTime called for selection ${selection.id}. Result:`, updateCommence);
        selection.game_commence_time = matchedGame.commence_time;
        console.log(`      🕒 Selección ${selection.id}: actualizada hora de evento ${matchedGame.commence_time}`);
      } catch (error) {
        console.error(`      ⚠️  No se pudo actualizar hora de evento para selección ${selection.id}:`, error.message);
      }
    }

    const selectionResult = evaluateBet(selection, matchedGame);
    
    if (selectionResult === null) {
      console.log(`      ⏸️  Selección ${selection.id}: no se pudo evaluar`);
      // No se pudo evaluar, mantener pendiente
      allWon = false;
      continue;
    }

    if (selectionResult === 'void') {
      evaluatedCount++;
      const updateResult = await BetSelection.updateStatus(selection.id, 'void');
      console.log(`      [AUDIT] updateStatus called for selection ${selection.id} -> 'void'. Result:`, updateResult);
      console.log(`      ⚪️ Selección ${selection.id}: ${selection.selected_team} - EMPATE/VOID`);
      allWon = false;
      continue;
    }

    evaluatedCount++;
    
    // Actualizar el estado de la selección
    const selectionStatus = selectionResult;
    const updateResult = await BetSelection.updateStatus(selection.id, selectionStatus);
    console.log(`      [AUDIT] updateStatus called for selection ${selection.id} -> '${selectionStatus}'. Result:`, updateResult);
    console.log(`      ${selectionResult === 'won' ? '✅' : '❌'} Selección ${selection.id}: ${selection.selected_team} - ${selectionResult === 'won' ? 'GANÓ' : 'PERDIÓ'}`);

    if (selectionResult === 'lost') {
      anyLost = true;
      allWon = false;
      // No cortar: seguir actualizando otras selecciones terminadas
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

    // Cerrar selecciones con Fecha N/D (game_commence_time NULL)
    const ndResult = await query(
      `WITH updated AS (
        UPDATE bet_selections
        SET selection_status = 'lost'
        WHERE selection_status = 'pending'
          AND game_commence_time IS NULL
        RETURNING bet_id
      )
      SELECT DISTINCT bet_id FROM updated`
    );

    if (ndResult.rows.length > 0) {
      const betIds = ndResult.rows.map(r => r.bet_id);
      console.log(`⚠️  Marcadas ${betIds.length} apuestas con selecciones Fecha N/D como PERDIDAS`);

      await query(
        `UPDATE bets
         SET status = 'lost', actual_win = 0, settled_at = NOW()
         WHERE id = ANY($1::int[]) AND status = 'pending'`,
        [betIds]
      );
    }

    // Obtener todas las apuestas pendientes
    const pendingSelectionResult = await query(
      `SELECT DISTINCT bet_id
       FROM bet_selections
       WHERE selection_status = 'pending'`
    );

    const pendingSelectionBetIds = pendingSelectionResult.rows.map(row => row.bet_id);

    // Auditoría: log de cuántas selecciones pendientes existen
    const pendingCountResult = await query(
      `SELECT COUNT(*) FROM bet_selections WHERE selection_status = 'pending'`
    );
    console.log(`[AUDIT] Selecciones pendientes totales antes de procesar: ${pendingCountResult.rows[0].count}`);

    if (pendingSelectionBetIds.length === 0) {
      console.log('✅ No hay selecciones pendientes para procesar');
      return { processed: 0, settled: 0 };
    }

    const betsResult = await query(
      `SELECT * FROM bets WHERE id = ANY($1::int[]) ORDER BY placed_at DESC`,
      [pendingSelectionBetIds]
    );

    const selectionBets = betsResult.rows;
    const pendingBets = selectionBets.filter(bet => bet.status === 'pending');

    console.log(`📊 Encontradas ${pendingBets.length} apuestas pendientes`);
    console.log(`📌 Selecciones pendientes en ${selectionBets.length} apuestas (incluye resueltas)`);

    // Cargar selecciones para cada apuesta con selecciones pendientes
    for (const bet of selectionBets) {
      bet.selections = await BetSelection.findByBetId(bet.id);
      // Auditoría: log de cada selección pendiente antes de procesar
      bet.selections.forEach(sel => {
        if (sel.selection_status === 'pending') {
          console.log(`[AUDIT] Selección pendiente antes de procesar: id=${sel.id}, bet_id=${sel.bet_id}, equipo=${sel.selected_team}, mercado=${sel.market}, creado=${sel.created_at}`);
        }
      });
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
      'soccer': 'soccer',
      'atp': 'tennis_atp_aus_open_singles',
      'tennis': 'tennis_atp_aus_open_singles'
    };

    const fallbackSoccerKeys = [
      'soccer_epl',
      'soccer_la_liga',
      'soccer_serie_a',
      'soccer_bundesliga',
      'soccer_ligue_1',
      'soccer_spain_segunda_division',
      'soccer_italy_serie_b',
      'soccer_uefa_champs_league',
      'soccer_uefa_europa_league'
    ];

    // Resolver sport keys dinámicamente desde la API de deportes
    const sportsMap = await getSportsTitleToKeyMap();

    // Agrupar por deporte para minimizar llamadas a la API
    const rawSportKeys = selectionBets
      .filter(bet => bet.selections && bet.selections.length > 0)
      .flatMap(bet => bet.selections.map(sel => resolveSportKey(sel.league, sportsMap, leagueToSportKey)))
      .filter(key => key && key !== 'unknown');

    const needsSoccerFallback = selectionBets
      .flatMap(bet => bet.selections || [])
      .some(sel => {
        const normalized = normalizeKey(sel.league);
        return normalized === 'soccer' || normalized === 'other';
      });

    const expandedKeys = needsSoccerFallback
      ? rawSportKeys.concat(fallbackSoccerKeys)
      : rawSportKeys;

    const sportKeys = [...new Set(expandedKeys.filter(key => key !== 'other' && key !== 'soccer'))];

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
    for (const bet of selectionBets) {
      try {
        // Derivar sport para cada selección si no está presente
        for (const sel of bet.selections || []) {
          if (!sel.sport) {
            // Intentar derivar el deporte del sportKey
            const key = resolveSportKey(sel.league, sportsMap, leagueToSportKey);
            if (key && key.includes('_')) {
              sel.sport = key.split('_')[0];
            } else if (key) {
              sel.sport = key;
            } else {
              sel.sport = 'unknown';
            }
          }
        }

        const betSportKeys = (bet.selections || [])
          .map(sel => resolveSportKey(sel.league, sportsMap, leagueToSportKey))
          .filter(key => key && key !== 'unknown');

        const completedGames = betSportKeys.flatMap(key => allCompletedGames[key] || []);
        const activeGames = betSportKeys.flatMap(key => allActiveGames[key] || []);

        console.log(`   🔍 Apuesta ${bet.id}: ${bet.selections?.length || 0} selecciones, ligas: ${[...new Set(betSportKeys)].join(', ') || 'unknown'}`);

        // Pasar allCompletedGames y allActiveGames para fallback universal
        const result = await settleParlayBet(bet, completedGames, activeGames, allCompletedGames, allActiveGames);

        if (result && bet.status === 'pending') {
          // Actualizar la apuesta usando el método estático
          await Bet.update(bet.id, {
            status: result.status,
            actual_win: result.actual_win,
            settled_at: new Date()
          });

          settledCount++;
          console.log(`   ✅ Apuesta ${bet.bet_ticket_number} resuelta: ${result.status.toUpperCase()}, win: $${result.actual_win}`);
        } else if (!result) {
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
