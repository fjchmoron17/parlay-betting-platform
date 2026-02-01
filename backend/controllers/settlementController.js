// backend/controllers/settlementController.js
// Controlador para resolución manual de apuestas por admin

import { query } from '../db/dbConfig.js';

/**
 * Resolver una apuesta manualmente (solo admin)
 * Endpoint: POST /api/settlement/resolve-manual
 * 
 * Body:
 * {
 *   betId: number,
 *   selections: [
 *     { selectionId: number, result: 'won' | 'lost' | 'void', homeScore?: number, awayScore?: number, finalScore?: string }
 *   ],
 *   adminNotes: string,
 *   adminId: string
 * }
 */
export const resolveManual = async (req, res) => {
  try {
    const { betId, selections, adminNotes, adminId } = req.body;
    
    // Validación de parámetros
    if (!betId || !selections || !Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request: betId and selections array are required'
      });
    }
    
    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID is required for audit trail'
      });
    }
    
    // Validar que cada selección tenga selectionId y result válido
    for (const sel of selections) {
      if (!sel.selectionId || !['won', 'lost', 'void'].includes(sel.result)) {
        return res.status(400).json({
          success: false,
          error: 'Each selection must have valid selectionId and result (won/lost/void)'
        });
      }
    }
    
    // Obtener la apuesta
    const betResult = await query(
      'SELECT * FROM bets WHERE id = $1',
      [betId]
    );
    
    if (betResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }
    
    const bet = betResult.rows[0];
    
    if (bet.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Cannot resolve a ${bet.status} bet. Only pending bets can be resolved.`
      });
    }
    
    // Procesar cada selección
    const updatePromises = [];
    const auditPromises = [];
    
    for (const sel of selections) {
      const { selectionId, result, homeScore = null, awayScore = null, finalScore = null } = sel;
      // Obtener selección actual
      const selResult = await query(
        'SELECT * FROM bet_selections WHERE id = $1 AND bet_id = $2',
        [selectionId, betId]
      );
      
      if (selResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: `Selection ${sel.selectionId} not found in this bet`
        });
      }
      
      const currentSelection = selResult.rows[0];
      
      // Actualizar selección
      updatePromises.push(
        query(
          'UPDATE bet_selections SET selection_status = $1 WHERE id = $2',
          [result, selectionId]
        )
      );
      
      // Registrar en audit log
      auditPromises.push(
        query(
          `INSERT INTO settlement_audit_log 
           (bet_id, selection_id, old_status, new_status, admin_id, admin_notes, ip_address, home_score, away_score, final_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            betId,
            selectionId,
            currentSelection.selection_status,
            result,
            adminId,
            adminNotes || '',
            req.ip || 'unknown',
            homeScore,
            awayScore,
            finalScore
          ]
        )
      );
    }
    
    // Ejecutar todas las actualizaciones
    await Promise.all([...updatePromises, ...auditPromises]);
    
    // Recalcular estado de la apuesta
    const allSelectionsResult = await query(
      'SELECT selection_status FROM bet_selections WHERE bet_id = $1 ORDER BY id',
      [betId]
    );
    
    const statuses = allSelectionsResult.rows.map(s => s.selection_status);
    const hasLost = statuses.includes('lost');
    const hasPending = statuses.includes('pending');
    const allWon = statuses.every(s => s === 'won');
    
    // Determinar nuevo estado de la apuesta
    let newBetStatus = 'pending';
    let actualWin = '0.00';
    
    if (hasLost) {
      newBetStatus = 'lost';
      actualWin = '0.00';
    } else if (allWon) {
      newBetStatus = 'won';
      actualWin = bet.potential_win || (parseFloat(bet.total_stake) * parseFloat(bet.total_odds)).toString();
    } else if (!hasPending && !hasLost) {
      // Todas las selecciones resueltas pero no todas ganadas y no hay pérdidas
      newBetStatus = 'void';
      actualWin = '0.00';
    }
    
    // Actualizar apuesta
    await query(
      `UPDATE bets 
       SET status = $1, actual_win = $2, settled_at = NOW() 
       WHERE id = $3`,
      [newBetStatus, actualWin, betId]
    );
    
    // Registrar resolución de apuesta completa
    await query(
      `INSERT INTO settlement_audit_log 
       (bet_id, old_status, new_status, admin_id, admin_notes, ip_address, is_bet_resolution)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [
        betId,
        'pending',
        newBetStatus,
        adminId,
        `Bet resolved manually: ${selections.length} selection(s) - ${adminNotes || ''}`,
        req.ip || 'unknown'
      ]
    );
    
    res.json({
      success: true,
      message: `Bet ${bet.bet_ticket_number} resolved manually by admin`,
      data: {
        betId,
        betTicketNumber: bet.bet_ticket_number,
        oldStatus: 'pending',
        newStatus: newBetStatus,
        actualWin: actualWin,
        resolvedSelections: selections.length,
        resolvedAt: new Date().toISOString(),
        adminId,
        adminNotes
      }
    });
  } catch (error) {
    console.error('Error in resolveManual:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve bet',
      details: error.message
    });
  }
};

/**
 * Obtener historial de resoluciones manuales (audit log)
 * Endpoint: GET /api/settlement/audit-log?betId=XX&limit=50&offset=0
 */
export const getAuditLog = async (req, res) => {
  try {
    const { betId, limit = 50, offset = 0 } = req.query;
    
    let sqlQuery = 'SELECT * FROM settlement_audit_log WHERE 1=1';
    const params = [];
    
    if (betId) {
      sqlQuery += ' AND bet_id = $' + (params.length + 1);
      params.push(betId);
    }
    
    sqlQuery += ` ORDER BY resolved_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await query(sqlQuery, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get audit log',
      details: error.message
    });
  }
};

/**
 * Obtener apuestas pendientes que necesitan resolución manual
 * Endpoint: GET /api/settlement/pending-manual
 */
export const getPendingManualResolution = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const result = await query(
      `SELECT 
        b.id, b.bet_ticket_number, b.status, b.placed_at, b.placed_date,
        b.total_stake, b.total_odds, b.potential_win,
        COUNT(bs.id) as selection_count,
        SUM(CASE WHEN bs.selection_status = 'pending' THEN 1 ELSE 0 END) as pending_count
       FROM bets b
       LEFT JOIN bet_selections bs ON b.id = bs.bet_id
       WHERE b.status = 'pending'
       AND EXISTS (
         SELECT 1 FROM bet_selections bs2
         WHERE bs2.bet_id = b.id
           AND bs2.selection_status = 'pending'
           AND bs2.game_commence_time IS NOT NULL
           AND bs2.game_commence_time <= NOW() - INTERVAL '1 hour'
       )
       GROUP BY b.id
       ORDER BY b.placed_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    res.json({
      success: true,
      message: 'Bets pending manual resolution',
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting pending manual resolution:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending bets',
      details: error.message
    });
  }
};

/**
 * Obtener partidos con jugadas pendientes (agrupado por juego)
 * Endpoint: GET /api/settlement/pending-manual-games
 */
export const getPendingManualGames = async (req, res) => {
  try {
    const { limit = 50, offset = 0, onlyOverdue = 'false' } = req.query;
    const onlyOverdueFilter = String(onlyOverdue).toLowerCase() === 'true';

    const overdueClause = onlyOverdueFilter
      ? ' AND bs.game_commence_time <= NOW() - INTERVAL \'1 hour\''
      : '';

    const result = await query(
      `SELECT
        bs.home_team,
        bs.away_team,
        bs.game_commence_time,
        (bs.home_team || ' vs ' || bs.away_team || ' @ ' || bs.game_commence_time) as game_key,
        COUNT(*) FILTER (WHERE bs.selection_status = 'pending') as pending_count,
        COUNT(DISTINCT bs.bet_id) as bet_count,
        SUM(CASE WHEN bs.market = 'h2h' THEN 1 ELSE 0 END) as h2h_count,
        SUM(CASE WHEN bs.market = 'totals' THEN 1 ELSE 0 END) as totals_count,
        SUM(CASE WHEN bs.market = 'spreads' THEN 1 ELSE 0 END) as spreads_count
       FROM bet_selections bs
       JOIN bets b ON b.id = bs.bet_id
       WHERE b.status = 'pending'
         AND bs.selection_status = 'pending'
         AND bs.game_commence_time IS NOT NULL
       ${overdueClause}
       GROUP BY bs.home_team, bs.away_team, bs.game_commence_time
      ORDER BY bs.game_commence_time ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      message: 'Games pending manual resolution',
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error getting pending manual games:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get pending games',
      details: error.message
    });
  }
};

const evaluateSelectionOutcome = (selection, homeScore, awayScore, homeSets = null, awaySets = null, winnerOverride = null) => {
  const market = selection.market;
  const point = selection.point_spread != null ? parseFloat(selection.point_spread) : null;
  const selectedTeam = selection.selected_team;
  const hasSets = homeSets != null && awaySets != null;

  if (market === 'h2h') {
    if (winnerOverride) {
      return selectedTeam === winnerOverride ? 'won' : 'lost';
    }
    if (hasSets) {
      if (homeSets === awaySets) return 'void';
      const winner = homeSets > awaySets ? selection.home_team : selection.away_team;
      return selectedTeam === winner ? 'won' : 'lost';
    }
    if (homeScore === awayScore) return 'void';
    const winner = homeScore > awayScore ? selection.home_team : selection.away_team;
    return selectedTeam === winner ? 'won' : 'lost';
  }

  if (market === 'spreads') {
    if (point == null) return 'void';
    const isHome = selectedTeam === selection.home_team;
    const adjusted = isHome ? homeScore + point : awayScore + point;
    const opponent = isHome ? awayScore : homeScore;
    if (adjusted === opponent) return 'void';
    return adjusted > opponent ? 'won' : 'lost';
  }

  if (market === 'totals') {
    if (point == null) return 'void';
    const total = homeScore + awayScore;
    if (total === point) return 'void';
    const isOver = selectedTeam?.toLowerCase().includes('over');
    if (isOver) return total > point ? 'won' : 'lost';
    return total < point ? 'won' : 'lost';
  }

  return 'void';
};

const parseTennisSets = (setsScore) => {
  if (!setsScore || typeof setsScore !== 'string') return null;
  const sets = setsScore
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (sets.length === 0) return null;

  let homeGames = 0;
  let awayGames = 0;
  let homeSets = 0;
  let awaySets = 0;

  for (const set of sets) {
    const parts = set.split(/[-:]/).map(p => p.trim());
    if (parts.length !== 2) return null;
    const home = Number(parts[0]);
    const away = Number(parts[1]);
    if (Number.isNaN(home) || Number.isNaN(away)) return null;
    homeGames += home;
    awayGames += away;
    if (home > away) homeSets += 1;
    if (away > home) awaySets += 1;
  }

  return { homeGames, awayGames, homeSets, awaySets };
};

/**
 * Resolver manualmente todas las jugadas de un partido
 * Endpoint: POST /api/settlement/resolve-manual-game
 * Body: { homeTeam, awayTeam, gameCommenceTime, homeScore?, awayScore?, setsScore?, adminId, adminNotes }
 */
export const resolveManualGame = async (req, res) => {
  try {
    const { homeTeam, awayTeam, gameCommenceTime, homeScore, awayScore, setsScore, winnerOverride, adminId, adminNotes } = req.body;

    if (!homeTeam || !awayTeam || !gameCommenceTime) {
      return res.status(400).json({
        success: false,
        error: 'homeTeam, awayTeam and gameCommenceTime are required'
      });
    }

    const parsedSets = parseTennisSets(setsScore);
    const resolvedHomeScore = parsedSets ? parsedSets.homeGames : (homeScore == null ? null : Number(homeScore));
    const resolvedAwayScore = parsedSets ? parsedSets.awayGames : (awayScore == null ? null : Number(awayScore));
    const resolvedHomeSets = parsedSets ? parsedSets.homeSets : null;
    const resolvedAwaySets = parsedSets ? parsedSets.awaySets : null;

    const normalizedWinner = winnerOverride === 'home'
      ? homeTeam
      : winnerOverride === 'away'
        ? awayTeam
        : winnerOverride;

    if (resolvedHomeScore == null || resolvedAwayScore == null) {
      return res.status(400).json({
        success: false,
        error: 'Final score is required (homeScore/awayScore or setsScore)'
      });
    }

    if (!adminId) {
      return res.status(400).json({
        success: false,
        error: 'Admin ID is required for audit trail'
      });
    }

    const selectionResult = await query(
      `SELECT bs.*, b.potential_win, b.status as bet_status
       FROM bet_selections bs
       JOIN bets b ON b.id = bs.bet_id
       WHERE bs.home_team = $1
         AND bs.away_team = $2
         AND bs.game_commence_time = $3
         AND bs.selection_status = 'pending'
         AND b.status = 'pending'`,
      [homeTeam, awayTeam, gameCommenceTime]
    );

    const selections = selectionResult.rows;
    if (selections.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No pending selections found for this game'
      });
    }

    const updatePromises = [];
    const auditPromises = [];
    const betIds = new Set();
    const finalScore = setsScore || `${resolvedHomeScore}-${resolvedAwayScore}`;

    for (const sel of selections) {
      const outcome = evaluateSelectionOutcome(
        sel,
        resolvedHomeScore,
        resolvedAwayScore,
        resolvedHomeSets,
        resolvedAwaySets,
        normalizedWinner
      );
      betIds.add(sel.bet_id);

      updatePromises.push(
        query('UPDATE bet_selections SET selection_status = $1 WHERE id = $2', [outcome, sel.id])
      );

      auditPromises.push(
        query(
          `INSERT INTO settlement_audit_log
           (bet_id, selection_id, old_status, new_status, admin_id, admin_notes, ip_address, home_score, away_score, final_score)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            sel.bet_id,
            sel.id,
            sel.selection_status,
            outcome,
            adminId,
            adminNotes || `Manual game resolution for ${homeTeam} vs ${awayTeam} (${finalScore})`,
            req.ip || 'unknown',
            resolvedHomeScore,
            resolvedAwayScore,
            finalScore
          ]
        )
      );
    }

    await Promise.all([...updatePromises, ...auditPromises]);

    const updatedBets = [];
    for (const betId of betIds) {
      const betStatusResult = await query(
        'SELECT status FROM bets WHERE id = $1',
        [betId]
      );
      const oldStatus = betStatusResult.rows[0]?.status || 'pending';

      const selectionsResult = await query(
        'SELECT selection_status FROM bet_selections WHERE bet_id = $1 ORDER BY id',
        [betId]
      );
      const statuses = selectionsResult.rows.map(s => s.selection_status);
      const hasLost = statuses.includes('lost');
      const hasPending = statuses.includes('pending');
      const allWon = statuses.every(s => s === 'won');

      let newBetStatus = 'pending';
      let actualWin = '0.00';

      if (hasLost) {
        newBetStatus = 'lost';
      } else if (allWon) {
        const betResult = await query('SELECT potential_win FROM bets WHERE id = $1', [betId]);
        if (betResult.rows.length > 0) {
          newBetStatus = 'won';
          actualWin = betResult.rows[0].potential_win;
        }
      } else if (!hasPending && !hasLost) {
        newBetStatus = 'void';
      }

      if (newBetStatus !== oldStatus) {
        if (newBetStatus === 'pending') {
          await query('UPDATE bets SET status = $1 WHERE id = $2', [newBetStatus, betId]);
        } else {
          await query('UPDATE bets SET status = $1, actual_win = $2, settled_at = NOW() WHERE id = $3', [newBetStatus, actualWin, betId]);

          await query(
            `INSERT INTO settlement_audit_log
             (bet_id, old_status, new_status, admin_id, admin_notes, ip_address, is_bet_resolution, home_score, away_score, final_score)
             VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9)`,
            [
              betId,
              oldStatus,
              newBetStatus,
              adminId,
              `Bet resolved via manual game resolution (${homeTeam} vs ${awayTeam}) ${adminNotes || ''}`,
              req.ip || 'unknown',
              resolvedHomeScore,
              resolvedAwayScore,
              finalScore
            ]
          );
        }
      }

      updatedBets.push({ betId, oldStatus, newStatus: newBetStatus });
    }

    res.json({
      success: true,
      message: `Game ${homeTeam} vs ${awayTeam} resolved manually for ${selections.length} selections`,
      data: {
        homeTeam,
        awayTeam,
        gameCommenceTime,
        homeScore: resolvedHomeScore,
        awayScore: resolvedAwayScore,
        setsScore: setsScore || null,
        winnerOverride: normalizedWinner || null,
        selectionsResolved: selections.length,
        betsUpdated: updatedBets.length
      }
    });
  } catch (error) {
    console.error('Error resolving manual game:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve game',
      details: error.message
    });
  }
};
