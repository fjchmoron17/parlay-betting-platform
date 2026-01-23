// backend/controllers/betsDBController.js
import { Bet, BetSelection } from '../db/models/index.js';

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
    const { status, actualWin = 0 } = req.body;
    
    if (!['won', 'lost', 'void'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    // actual_win es el monto pagado al ganador (= potential_win)
    // La comisión se calcula a nivel diario (5% del total apostado), no por apuesta
    const commission = 0;
    
    const updatedBet = await Bet.updateStatus(id, status, actualWin, commission);
    
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
