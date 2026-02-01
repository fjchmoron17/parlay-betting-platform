// backend/controllers/settlementController.js
// Controlador para resolución manual de apuestas por admin

import { query } from '../db/dbConfig.js';
import { Bet, BetSelection } from '../db/models/index.js';

/**
 * Resolver una apuesta manualmente (solo admin)
 * Endpoint: POST /api/settlement/resolve-manual
 * 
 * Body:
 * {
 *   betId: number,
 *   selections: [
 *     { selectionId: number, result: 'won' | 'lost' | 'void' }
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
      // Obtener selección actual
      const selResult = await query(
        'SELECT * FROM bet_selections WHERE id = $1 AND bet_id = $2',
        [sel.selectionId, betId]
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
          [sel.result, sel.selectionId]
        )
      );
      
      // Registrar en audit log
      auditPromises.push(
        query(
          `INSERT INTO settlement_audit_log 
           (bet_id, selection_id, old_status, new_status, admin_id, admin_notes, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            betId,
            sel.selectionId,
            currentSelection.selection_status,
            sel.result,
            adminId,
            adminNotes || '',
            req.ip || 'unknown'
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
       AND (
         SELECT COUNT(*) FROM bet_selections bs2 
         WHERE bs2.bet_id = b.id 
         AND bs2.game_commence_time < NOW()
       ) > 0
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
