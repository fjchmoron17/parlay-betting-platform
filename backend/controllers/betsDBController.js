// backend/controllers/betsDBController.js
import { Bet, BetSelection } from '../db/models/index.js';
import { query } from '../db/dbConfig.js';

export const placeBet = async (req, res) => {
  try {
    // Aceptar camelCase y snake_case desde el frontend
    const bettingHouseId = req.body.bettingHouseId ?? req.body.betting_house_id;
    const betTicketNumber = req.body.betTicketNumber ?? req.body.bet_ticket_number;
    const betType = req.body.betType ?? req.body.bet_type;
    const totalStake = req.body.totalStake ?? req.body.total_stake;
    const totalOdds = req.body.totalOdds ?? req.body.total_odds;
    const selections = req.body.selections || [];
    
    if (!bettingHouseId || !betTicketNumber || !betType || !totalStake || !totalOdds) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }
    
    // Validar tipo de apuesta
    if (!['single', 'parlay', 'system'].includes(betType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bet type'
      });
    }
    
    const potentialWin = totalStake * totalOdds;

    const bet = await Bet.create(
      bettingHouseId,
      betTicketNumber,
      betType,
      totalStake,
      totalOdds,
      potentialWin
    );

    // Guardar selecciones si existen
    if (selections.length > 0 && bet?.id) {
      await BetSelection.createMany(bet.id, selections);
    }
    
    res.status(201).json({
      success: true,
      data: bet,
      message: 'Bet placed successfully'
    });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to place bet'
    });
  }
};

export const getBetsForHouse = async (req, res) => {
  try {
    const bettingHouseId = req.query.betting_house_id || req.query.bettingHouseId;
    const { limit = 50, offset = 0, status } = req.query;
    
    if (!bettingHouseId) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id is required'
      });
    }
    
    let bets = await Bet.findAll(bettingHouseId, limit, offset);
    
    if (status) {
      bets = bets.filter(b => b.status === status);
    }

    // Obtener selecciones para cada apuesta
    for (let bet of bets) {
      const selections = await BetSelection.findByBetId(bet.id);
      bet.selections = selections || [];
    }
    
    res.json({
      success: true,
      data: bets,
      total: bets.length,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bets'
    });
  }
};

export const getBetById = async (req, res) => {
  try {
    const { id } = req.params;
    const bet = await Bet.findById(id);
    
    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Bet not found'
      });
    }

    // Cargar selecciones para esta apuesta
    const selections = await BetSelection.findByBetId(bet.id);
    bet.selections = selections || [];
    
    res.json({
      success: true,
      data: bet
    });
  } catch (error) {
    console.error('Error fetching bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bet'
    });
  }
};

export const settleBet = async (req, res) => {
  try {
    const { id } = req.params;
    // Aceptar tanto camelCase como snake_case por compatibilidad
    const { status, actualWin, actual_win } = req.body;
    const winAmount = actualWin || actual_win || 0;
    
    if (!['won', 'lost', 'void'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // actual_win es el monto pagado al ganador (= potential_win)
    // La comisión se calcula a nivel diario (5% del total apostado), no por apuesta
    const commission = 0;
    
    console.log(`Settling bet ${id}: status=${status}, actualWin=${winAmount}`);
    const updatedBet = await Bet.updateStatus(id, status, winAmount, commission);
    
    res.json({
      success: true,
      data: updatedBet,
      message: `Bet ${status} successfully`
    });
  } catch (error) {
    console.error('Error settling bet:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to settle bet'
    });
  }
};

export const getBetStats = async (req, res) => {
  try {
    const bettingHouseId = req.query.betting_house_id || req.query.bettingHouseId;
    const { fromDate, toDate } = req.query;
    
    if (!bettingHouseId) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id is required'
      });
    }
    
    const stats = await Bet.getStats(bettingHouseId, fromDate, toDate);
    
    res.json({
      success: true,
      data: stats,
      period: { fromDate, toDate }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting statistics'
    });
  }
};

export const getBetsByDate = async (req, res) => {
  try {
    const bettingHouseId = req.query.betting_house_id || req.query.bettingHouseId;
    const date = req.query.date;
    
    if (!bettingHouseId || !date) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id and date are required'
      });
    }
    
    const bets = await Bet.findByDate(bettingHouseId, date);
    
    res.json({
      success: true,
      data: bets,
      date,
      total: bets.length
    });
  } catch (error) {
    console.error('Error fetching bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bets'
    });
  }
};

export const updateSelections = async (req, res) => {
  try {
    const { updates } = req.body; // Array de { selectionId, gameCommenceTime, selectionStatus }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'updates array is required'
      });
    }

    let successCount = 0;
    const results = [];

    for (const update of updates) {
      const { selectionId, gameCommenceTime, selectionStatus } = update;
      
      try {
        let sql = 'UPDATE bet_selections SET ';
        const params = [];
        let paramIndex = 1;

        if (gameCommenceTime) {
          sql += `game_commence_time = $${paramIndex++}`;
          params.push(gameCommenceTime);
        }

        if (selectionStatus) {
          if (params.length > 0) sql += ', ';
          sql += `selection_status = $${paramIndex++}`;
          params.push(selectionStatus);
        }

        sql += ` WHERE id = $${paramIndex} RETURNING *`;
        params.push(selectionId);

        const result = await query(sql, params);
        
        if (result.rows.length > 0) {
          successCount++;
          results.push({
            selectionId,
            success: true,
            data: result.rows[0]
          });
        } else {
          results.push({
            selectionId,
            success: false,
            error: 'Selection not found'
          });
        }
      } catch (error) {
        results.push({
          selectionId,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${successCount}/${updates.length} selections`,
      results
    });
  } catch (error) {
    console.error('Error updating selections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update selections'
    });
  }
};

// Validar y corregir estado de TODAS las apuestas basado en sus selecciones
export const validateAndFixBets = async (req, res) => {
  try {
    // 1. Obtener todas las apuestas
    const allBetsResult = await query(
      'SELECT id, status, potential_win FROM bets ORDER BY id'
    );
    
    const bets = allBetsResult.rows;
    console.log(`Found ${bets.length} bets to validate`);
    
    let fixed = 0;
    let errors = [];
    const results = [];
    
    // 2. Para cada apuesta, obtener sus selecciones y calcular estado correcto
    for (const bet of bets) {
      try {
        // Obtener selecciones
        const selectionsResult = await query(
          'SELECT id, selection_status FROM bet_selections WHERE bet_id = $1 ORDER BY id',
          [bet.id]
        );
        
        const selections = selectionsResult.rows;
        
        if (selections.length === 0) {
          // Sin selecciones = estado inválido
          results.push({
            bet_id: bet.id,
            status: 'error',
            message: 'No selections found'
          });
          continue;
        }
        
        // Calcular estado correcto basado en selecciones
        let correctStatus = 'pending';
        let correctActualWin = '0.00';
        
        const statuses = selections.map(s => s.selection_status);
        const hasLost = statuses.includes('lost');
        const hasPending = statuses.includes('pending');
        const allWon = statuses.every(s => s === 'won');
        
        if (hasLost) {
          // Si hay al menos una perdida = apuesta perdida
          correctStatus = 'lost';
          correctActualWin = '0.00';
        } else if (allWon) {
          // Si todas ganaron = apuesta ganada
          correctStatus = 'won';
          correctActualWin = bet.potential_win; // El ganador obtiene el potential_win
        } else if (hasPending) {
          // Si hay pendientes y no hay perdidas = pendiente
          correctStatus = 'pending';
          correctActualWin = '0.00';
        }
        
        // Si el estado es diferente, actualizar
        if (bet.status !== correctStatus) {
          await query(
            'UPDATE bets SET status = $1, actual_win = $2 WHERE id = $3',
            [correctStatus, correctActualWin, bet.id]
          );
          
          fixed++;
          results.push({
            bet_id: bet.id,
            old_status: bet.status,
            new_status: correctStatus,
            selections_count: selections.length,
            selection_statuses: statuses,
            action: 'FIXED'
          });
        } else {
          results.push({
            bet_id: bet.id,
            status: correctStatus,
            selections_count: selections.length,
            selection_statuses: statuses,
            action: 'OK'
          });
        }
      } catch (error) {
        errors.push({
          bet_id: bet.id,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      total_bets: bets.length,
      fixed_count: fixed,
      errors_count: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error validating and fixing bets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate and fix bets',
      details: error.message
    });
  }
};

// Resolver una selección individual manualmente
export const resolveSelection = async (req, res) => {
  try {
    const { selectionId, status } = req.body;

    // Validar parámetros
    if (!selectionId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: selectionId, status'
      });
    }

    if (!['won', 'lost', 'void'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Must be: won, lost, or void'
      });
    }

    // Obtener la selección actual
    const currentResult = await query(
      'SELECT id, bet_id, selection_status FROM bet_selections WHERE id = $1',
      [selectionId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Selection not found'
      });
    }

    const selection = currentResult.rows[0];
    const oldStatus = selection.selection_status;

    // Actualizar la selección
    await query(
      'UPDATE bet_selections SET selection_status = $1 WHERE id = $2',
      [status, selectionId]
    );

    // Obtener todas las selecciones de la apuesta para recalcular su estado
    const allSelectionsResult = await query(
      'SELECT id, selection_status FROM bet_selections WHERE bet_id = $1 ORDER BY id',
      [selection.bet_id]
    );

    const selections = allSelectionsResult.rows;
    const statuses = selections.map(s => s.selection_status);
    const hasLost = statuses.includes('lost');
    const hasPending = statuses.includes('pending');
    const allWon = statuses.every(s => s === 'won');

    // Calcular nuevo estado de la apuesta
    let newBetStatus = 'pending';
    let newActualWin = '0.00';

    if (hasLost) {
      newBetStatus = 'lost';
      newActualWin = '0.00';
    } else if (allWon) {
      // Obtener potential_win
      const betResult = await query(
        'SELECT potential_win FROM bets WHERE id = $1',
        [selection.bet_id]
      );
      if (betResult.rows.length > 0) {
        newBetStatus = 'won';
        newActualWin = betResult.rows[0].potential_win;
      }
    }

    // Actualizar la apuesta si cambió el estado
    await query(
      'UPDATE bets SET status = $1, actual_win = $2, settled_at = NOW() WHERE id = $3',
      [newBetStatus, newActualWin, selection.bet_id]
    );

    res.json({
      success: true,
      selection: {
        id: selectionId,
        old_status: oldStatus,
        new_status: status
      },
      bet: {
        id: selection.bet_id,
        new_status: newBetStatus,
        actual_win: newActualWin,
        all_selections_status: statuses
      },
      message: `Selection resolved from ${oldStatus} to ${status}. Bet updated to ${newBetStatus}`
    });
  } catch (error) {
    console.error('Error resolving selection:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve selection',
      details: error.message
    });
  }
};

// Revertir selecciones resueltas incorrectamente a pending si el partido aún no ha pasado
export const revertIncorrectResolutions = async (req, res) => {
  try {
    const now = new Date();

    // Obtener todas las selecciones que fueron resueltas como 'lost' pero cuyo partido aún no ha pasado
    const result = await query(
      `SELECT 
        bs.id,
        bs.bet_id,
        bs.home_team,
        bs.away_team,
        bs.market,
        bs.game_commence_time,
        bs.selection_status,
        b.bet_ticket_number
      FROM bet_selections bs
      JOIN bets b ON bs.bet_id = b.id
      WHERE bs.selection_status IN ('lost', 'void')
      AND bs.game_commence_time > NOW()
      ORDER BY bs.game_commence_time ASC`,
      []
    );

    const selectionsToRevert = result.rows;
    let reverted = 0;

    for (const sel of selectionsToRevert) {
      // Revertir a pending
      await query(
        'UPDATE bet_selections SET selection_status = $1 WHERE id = $2',
        ['pending', sel.id]
      );

      // Recalcular estado de la apuesta
      const allSelectionsResult = await query(
        'SELECT id, selection_status FROM bet_selections WHERE bet_id = $1 ORDER BY id',
        [sel.bet_id]
      );

      const selections = allSelectionsResult.rows;
      const statuses = selections.map(s => s.selection_status);
      const hasLost = statuses.includes('lost');
      const allWon = statuses.every(s => s === 'won');

      let newBetStatus = 'pending';
      let newActualWin = '0.00';

      if (hasLost) {
        newBetStatus = 'lost';
        newActualWin = '0.00';
      } else if (allWon) {
        const betResult = await query(
          'SELECT potential_win FROM bets WHERE id = $1',
          [sel.bet_id]
        );
        if (betResult.rows.length > 0) {
          newBetStatus = 'won';
          newActualWin = betResult.rows[0].potential_win;
        }
      }

      await query(
        'UPDATE bets SET status = $1, actual_win = $2 WHERE id = $3',
        [newBetStatus, newActualWin, sel.bet_id]
      );

      reverted++;
    }

    res.json({
      success: true,
      message: `Reverted ${reverted} incorrectly resolved selections back to pending`,
      reverted_count: reverted,
      reverted_selections: selectionsToRevert
    });
  } catch (error) {
    console.error('Error reverting incorrect resolutions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revert incorrect resolutions',
      details: error.message
    });
  }
};
  try {
    const result = await query(
      `SELECT 
        b.id as bet_id,
        b.bet_ticket_number,
        b.bet_type,
        b.status as bet_status,
        b.total_stake,
        b.potential_win,
        b.placed_at,
        b.placed_date,
        count(bs.id) FILTER (WHERE bs.selection_status = 'pending') as pending_count,
        count(bs.id) as total_selections,
        json_agg(json_build_object(
          'id', bs.id,
          'home_team', bs.home_team,
          'away_team', bs.away_team,
          'market', bs.market,
          'selected_team', bs.selected_team,
          'selection_status', bs.selection_status,
          'game_commence_time', bs.game_commence_time,
          'point_spread', bs.point_spread
        )) as selections
      FROM bets b
      LEFT JOIN bet_selections bs ON b.id = bs.bet_id
      WHERE bs.selection_status = 'pending'
      GROUP BY b.id
      ORDER BY b.placed_at DESC`,
      []
    );

    res.json({
      success: true,
      total_bets_with_pending: result.rows.length,
      total_pending_selections: result.rows.reduce((sum, r) => sum + r.pending_count, 0),
      bets: result.rows
    });
  } catch (error) {
    console.error('Error fetching pending selections:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending selections',
      details: error.message
    });
  }
};
