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
  async create(name, email, country, currency = 'USD') {
    const result = await query(
      `INSERT INTO betting_houses (name, email, country, currency, account_balance)
       VALUES ($1, $2, $3, $4, 0)
       RETURNING *`,
      [name, email, country, currency]
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
    const result = await query(
      `INSERT INTO bets (
        betting_house_id, bet_ticket_number, bet_type, 
        total_stake, total_odds, potential_win, status
      )
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [bettingHouseId, betTicketNumber, betType, totalStake, totalOdds, potentialWin]
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
       WHERE betting_house_id = $1 AND placed_date = $2
       ORDER BY placed_at DESC`,
      [bettingHouseId, date]
    );
  },

  // Obtener apuestas pendientes
  async findPending(bettingHouseId) {
    return getAll(
      `SELECT * FROM bets 
       WHERE betting_house_id = $1 AND status = 'pending'
       ORDER BY placed_at DESC`,
      [bettingHouseId]
    );
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
        SUM(commission_amount) as total_commissions,
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
    const result = await query(
      `SELECT calculate_daily_report($1, $2)`,
      [bettingHouseId, reportDate]
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
  async createMany(betId, selections = []) {
    if (!betId || selections.length === 0) return [];

    const values = [];
    const params = [];

    selections.forEach((sel, idx) => {
      const baseIndex = idx * 10;
      values.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8}, $${baseIndex + 9}, $${baseIndex + 10})`);
      params.push(
        betId,
        sel.game_id,
        sel.home_team,
        sel.away_team,
        sel.league,
        sel.market,
        sel.selected_team,
        sel.selected_odds,
        sel.point_spread ?? null,
        sel.bookmaker ?? null
      );
    });

    const sql = `
      INSERT INTO bet_selections (
        bet_id, game_id, home_team, away_team, league, market,
        selected_team, selected_odds, point_spread, bookmaker
      ) VALUES ${values.join(', ')}
      RETURNING id, bet_id, game_id, selected_team, selected_odds;
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
