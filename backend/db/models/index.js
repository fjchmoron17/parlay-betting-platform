// backend/db/models/BettingHouse.js
// Modelo para casas de apuestas
import { query, getOne, getAll } from '../dbConfig.js';

export const BettingHouse = {
  // Obtener todas las casas
  async findAll() {
    return getAll('SELECT * FROM betting_houses ORDER BY created_at DESC');
  },

  // Obtener una casa por ID
  async findById(id) {
    return getOne('SELECT * FROM betting_houses WHERE id = $1', [id]);
  },

  // Obtener una casa por nombre
  async findByName(name) {
    return getOne('SELECT * FROM betting_houses WHERE name = $1', [name]);
  },

  // Crear una casa
  async create(name, email, country, currency = 'USD', status = 'active') {
    const result = await query(
      `INSERT INTO betting_houses (name, email, country, currency, account_balance, status)
       VALUES ($1, $2, $3, $4, 0, $5)
       RETURNING *`,
      [name, email, country, currency, status]
    );
    return result.rows[0];
  },

  // Actualizar balance
  async updateBalance(id, newBalance) {
    const result = await query(
      `UPDATE betting_houses 
       SET account_balance = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newBalance, id]
    );
    return result.rows[0];
  },

  // Actualizar estado (active/inactive)
  async updateStatus(id, status) {
    const result = await query(
      `UPDATE betting_houses
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  },

  // Eliminar una casa (con cascada)
  async delete(id) {
    const result = await query(
      `DELETE FROM betting_houses WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  // Obtener resumen
  async getSummary() {
    return getAll(`
      SELECT 
        id,
        name,
        account_balance,
        (SELECT COUNT(*) FROM bets WHERE betting_house_id = betting_houses.id) as total_bets,
        (SELECT COUNT(*) FROM bets WHERE betting_house_id = betting_houses.id AND status = 'won') as bets_won,
        (SELECT COUNT(*) FROM bets WHERE betting_house_id = betting_houses.id AND status = 'lost') as bets_lost,
        status,
        created_at
      FROM betting_houses
      ORDER BY created_at DESC
    `);
  }
};

// backend/db/models/Bet.js
export const Bet = {
  // Obtener todas las apuestas
  async findAll(bettingHouseId, limit = 50, offset = 0) {
    return getAll(
      `SELECT * FROM bets 
       WHERE betting_house_id = $1
       ORDER BY placed_at DESC
       LIMIT $2 OFFSET $3`,
      [bettingHouseId, limit, offset]
    );
  },

  // Obtener una apuesta por ID
  async findById(id) {
    return getOne('SELECT * FROM bets WHERE id = $1', [id]);
  },

  // Crear una apuesta
  async create(bettingHouseId, betTicketNumber, betType, totalStake, totalOdds, potentialWin) {
    // La comisión se calcula a nivel diario (5% del total apostado), no por apuesta individual
    const commissionAmount = 0;
    const result = await query(
      `INSERT INTO bets (
        betting_house_id, bet_ticket_number, bet_type, 
        total_stake, total_odds, potential_win, status, commission_amount
      )
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7)
       RETURNING *`,
      [bettingHouseId, betTicketNumber, betType, totalStake, totalOdds, potentialWin, commissionAmount]
    );
    return result.rows[0];
  },

  // Actualizar estado de apuesta
  async updateStatus(id, status, actualWin = 0, commission = 0) {
    const netWin = actualWin - commission;
    const result = await query(
      `UPDATE bets 
       SET status = $1, actual_win = $2, commission_amount = $3, net_win = $4, settled_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status, actualWin, commission, netWin, id]
    );
    return result.rows[0];
  },

  // Obtener apuestas por día
  async findByDate(bettingHouseId, date) {
    return getAll(
      `SELECT * FROM bets 
       WHERE betting_house_id = $1 AND placed_at::date = $2::date
       ORDER BY placed_at DESC`,
      [bettingHouseId, date]
    );
  },

  // Obtener apuestas pendientes de una casa específica
  async findPending(bettingHouseId) {
    return getAll(
      `SELECT * FROM bets 
       WHERE betting_house_id = $1 AND status = 'pending'
       ORDER BY placed_at DESC`,
      [bettingHouseId]
    );
  },

  // Obtener TODAS las apuestas pendientes (para auto-resolución)
  async findAllPending() {
    return getAll(
      `SELECT * FROM bets 
       WHERE status = 'pending'
       ORDER BY placed_at DESC`
    );
  },

  // Actualizar apuesta (para auto-resolución)
  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    // Construir campos dinámicamente
    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }
    if (updates.actual_win !== undefined) {
      fields.push(`actual_win = $${paramIndex++}`);
      values.push(updates.actual_win);
    }
    if (updates.settled_at !== undefined) {
      fields.push(`settled_at = $${paramIndex++}`);
      values.push(updates.settled_at);
    }

    if (fields.length === 0) return null;

    values.push(id); // ID va al final
    const result = await query(
      `UPDATE bets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  // Estadísticas de apuestas
  async getStats(bettingHouseId, fromDate = null, toDate = null) {
    let sql = `
      SELECT 
        COUNT(*) as total_bets,
        SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as bets_won,
        SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END) as bets_lost,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as bets_pending,
        SUM(total_stake) as total_wagered,
        SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END) as total_winnings,
        COALESCE(SUM(total_stake), 0) * 0.05 as total_commissions,
        SUM(net_win) as net_profit_loss
      FROM bets
      WHERE betting_house_id = $1
    `;
    const params = [bettingHouseId];
    
    if (fromDate) {
      sql += ` AND placed_date >= $${params.length + 1}`;
      params.push(fromDate);
    }
    if (toDate) {
      sql += ` AND placed_date <= $${params.length + 1}`;
      params.push(toDate);
    }
    
    return getOne(sql, params);
  }
};

// backend/db/models/DailyReport.js
export const DailyReport = {
  // Obtener reporte del día
  async findByDate(bettingHouseId, date) {
    return getOne(
      `SELECT * FROM daily_reports 
       WHERE betting_house_id = $1 AND report_date = $2`,
      [bettingHouseId, date]
    );
  },

  // Obtener reportes de un período
  async findByRange(bettingHouseId, fromDate, toDate) {
    return getAll(
      `SELECT * FROM daily_reports 
       WHERE betting_house_id = $1 AND report_date BETWEEN $2 AND $3
       ORDER BY report_date DESC`,
      [bettingHouseId, fromDate, toDate]
    );
  },

  // Calcular reporte diario
  async calculate(bettingHouseId, reportDate) {
    // Obtener la fecha de la primera apuesta de la casa
    const firstBet = await query(
      `SELECT MIN(placed_at::date) as first_bet_date FROM bets WHERE betting_house_id = $1`,
      [bettingHouseId]
    );
    const firstBetDate = firstBet.rows[0]?.first_bet_date;

    // Si el día es anterior a la primera apuesta, todo debe ser 0
    if (!firstBetDate || new Date(reportDate) < new Date(firstBetDate)) {
      const openingBalance = 0;
      const closingBalance = 0;
      const result = await query(
        `INSERT INTO daily_reports (
          betting_house_id, report_date, 
          total_bets_placed, total_amount_wagered,
          bets_won, bets_lost, bets_void, bets_pending,
          total_winnings, total_losses, total_commissions, net_profit_loss,
          opening_balance, closing_balance
        ) VALUES ($1, $2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        ON CONFLICT (betting_house_id, report_date) 
        DO UPDATE SET
          total_bets_placed = 0,
          total_amount_wagered = 0,
          bets_won = 0,
          bets_lost = 0,
          bets_void = 0,
          bets_pending = 0,
          total_winnings = 0,
          total_losses = 0,
          total_commissions = 0,
          net_profit_loss = 0,
          closing_balance = 0,
          opening_balance = 0,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *`,
        [bettingHouseId, reportDate]
      );
      return result.rows[0];
    }

    // Obtener balance de apertura (del día anterior)
    const prevReport = await query(
      `SELECT closing_balance FROM daily_reports
       WHERE betting_house_id = $1 AND report_date = $2::date - INTERVAL '1 day'
       ORDER BY report_date DESC LIMIT 1`,
      [bettingHouseId, reportDate]
    );
    const openingBalance = prevReport.rows[0]?.closing_balance || 0;

    // Calcular totales del día desde las apuestas
    const stats = await query(
      `SELECT
        COUNT(*) as total_bets,
        COALESCE(SUM(total_stake), 0) as total_wagered,
        COALESCE(SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END), 0) as bets_won,
        COALESCE(SUM(CASE WHEN status = 'lost' THEN 1 ELSE 0 END), 0) as bets_lost,
        COALESCE(SUM(CASE WHEN status = 'void' THEN 1 ELSE 0 END), 0) as bets_void,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as bets_pending,
        COALESCE(SUM(CASE WHEN status = 'won' THEN actual_win ELSE 0 END), 0) as total_winnings,
        COALESCE(SUM(commission_amount), 0) as total_commissions
      FROM bets
      WHERE betting_house_id = $1 AND placed_at::date = $2::date`,
      [bettingHouseId, reportDate]
    );
    const dayStats = stats.rows[0];
    const noBets = parseInt(dayStats.total_bets) === 0;
    const totalBets = noBets ? 0 : parseInt(dayStats.total_bets);
    const totalWagered = noBets ? 0 : parseFloat(dayStats.total_wagered);
    const betsWon = noBets ? 0 : parseInt(dayStats.bets_won);
    const betsLost = noBets ? 0 : parseInt(dayStats.bets_lost);
    const betsVoid = noBets ? 0 : parseInt(dayStats.bets_void);
    const betsPending = noBets ? 0 : parseInt(dayStats.bets_pending);
    const totalWinnings = noBets ? 0 : parseFloat(dayStats.total_winnings);
    const totalCommissions = noBets ? 0 : totalWagered * 0.05;
    const totalLosses = noBets ? 0 : totalWagered - totalWinnings;
    const netProfitLoss = noBets ? 0 : totalWagered - totalWinnings - totalCommissions;
    const closingBalance = parseFloat(openingBalance) + netProfitLoss;

    // Insertar o actualizar reporte
    const result = await query(
      `INSERT INTO daily_reports (
        betting_house_id, report_date, 
        total_bets_placed, total_amount_wagered,
        bets_won, bets_lost, bets_void, bets_pending,
        total_winnings, total_losses, total_commissions, net_profit_loss,
        opening_balance, closing_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (betting_house_id, report_date) 
      DO UPDATE SET
        total_bets_placed = EXCLUDED.total_bets_placed,
        total_amount_wagered = EXCLUDED.total_amount_wagered,
        bets_won = EXCLUDED.bets_won,
        bets_lost = EXCLUDED.bets_lost,
        bets_void = EXCLUDED.bets_void,
        bets_pending = EXCLUDED.bets_pending,
        total_winnings = EXCLUDED.total_winnings,
        total_losses = EXCLUDED.total_losses,
        total_commissions = EXCLUDED.total_commissions,
        net_profit_loss = EXCLUDED.net_profit_loss,
        closing_balance = EXCLUDED.closing_balance,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [
        bettingHouseId, reportDate,
        totalBets, totalWagered,
        betsWon, betsLost, betsVoid, betsPending,
        totalWinnings, totalLosses, totalCommissions, netProfitLoss,
        openingBalance, closingBalance
      ]
    );

    // Actualizar el balance de la casa con el closing_balance del reporte
    await query(
      `UPDATE betting_houses 
       SET account_balance = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [closingBalance, bettingHouseId]
    );

    return result.rows[0];
  },

  // Obtener último reporte
  async getLatest(bettingHouseId) {
    return getOne(
      `SELECT * FROM daily_reports 
       WHERE betting_house_id = $1
       ORDER BY report_date DESC
       LIMIT 1`,
      [bettingHouseId]
    );
  }
};

// backend/db/models/Transaction.js
export const Transaction = {
  // Obtener todas las transacciones
  async findAll(bettingHouseId, limit = 50) {
    return getAll(
      `SELECT * FROM account_transactions 
       WHERE betting_house_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [bettingHouseId, limit]
    );
  },

  // Registrar transacción
  async create(bettingHouseId, transactionType, amount, balanceBefore, balanceAfter, description = null, betId = null) {
    const result = await query(
      `INSERT INTO account_transactions (
        betting_house_id, transaction_type, amount, balance_before, balance_after,
        description, bet_id, transaction_date
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE)
       RETURNING *`,
      [bettingHouseId, transactionType, amount, balanceBefore, balanceAfter, description, betId]
    );
    return result.rows[0];
  }
};

// backend/db/models/BetSelection.js
export const BetSelection = {
  async findByBetId(betId) {
    return getAll(
      'SELECT * FROM bet_selections WHERE bet_id = $1 ORDER BY id ASC',
      [betId]
    );
  },

  async updateStatus(selectionId, status) {
    return getOne(
      'UPDATE bet_selections SET selection_status = $1 WHERE id = $2 RETURNING *',
      [status, selectionId]
    );
  },

  async updateCommenceTime(selectionId, commenceTime) {
    return getOne(
      'UPDATE bet_selections SET game_commence_time = $1 WHERE id = $2 RETURNING *',
      [commenceTime, selectionId]
    );
  },

  async createMany(betId, selections = []) {
    if (!betId || selections.length === 0) return [];

    const values = [];
    const params = [];

    selections.forEach((sel, idx) => {
      const baseIndex = idx * 12;
      values.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10}, $${baseIndex + 11}, $${baseIndex + 12})`);
      const commenceTime =
        sel.game_commence_time ??
        sel.gameCommenceTime ??
        sel.commence_time ??
        sel.game_time ??
        null;

      params.push(
        betId,
        sel.game_id,
        sel.sport_key || sel.sportKey || 'unknown',
        sel.home_team,
        sel.away_team,
        sel.league,
        sel.market,
        sel.selected_team,
        sel.selected_odds,
        sel.point_spread ?? null,
        sel.bookmaker ?? null,
        commenceTime
      );
    });

    const sql = `
      INSERT INTO bet_selections (
        bet_id, game_id, sport_key, home_team, away_team, league, market,
        selected_team, selected_odds, point_spread, bookmaker, game_commence_time
      ) VALUES ${values.join(', ')}
      RETURNING id, bet_id, game_id, sport_key, home_team, away_team, league, market, selected_team, selected_odds, point_spread, game_commence_time, selection_status;
    `;

    const result = await query(sql, params);
    return result.rows;
  }
};

// backend/db/models/BettingHouseUser.js
export const BettingHouseUser = {
  async findByUsername(username) {
    return getOne(
      `SELECT id, betting_house_id, username, email, password_hash, role, is_active
       FROM betting_house_users
       WHERE username = $1`,
      [username]
    );
  },

  async create({ betting_house_id = null, username, email, password_hash, role = 'house_admin' }) {
    const result = await query(
      `INSERT INTO betting_house_users (betting_house_id, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, betting_house_id, username, email, role, is_active`,
      [betting_house_id, username, email, password_hash, role]
    );
    return result.rows[0];
  },

  async upsert(user) {
    const { betting_house_id = null, username, email, password_hash, role = 'house_admin' } = user;
    const result = await query(
      `INSERT INTO betting_house_users (betting_house_id, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (username) DO UPDATE
       SET betting_house_id = EXCLUDED.betting_house_id,
           email = EXCLUDED.email,
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           is_active = true
       RETURNING id, betting_house_id, username, email, role, is_active`,
      [betting_house_id, username, email, password_hash, role]
    );
    return result.rows[0];
  }
};
