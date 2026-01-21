// backend/controllers/betsDBController.js
import { Bet, DailyReport, Transaction } from '../db/models/index.js';

export const placeBet = async (req, res) => {
  try {
    const { bettingHouseId, betTicketNumber, betType, totalStake, totalOdds, selections } = req.body;
    
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
    const { bettingHouseId } = req.params;
    const { limit = 50, offset = 0, status } = req.query;
    
    let bets = await Bet.findAll(bettingHouseId, limit, offset);
    
    if (status) {
      bets = bets.filter(b => b.status === status);
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
    const { status, actualWin = 0, commissionPercentage = 2 } = req.body;
    
    if (!['won', 'lost', 'void'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const commission = actualWin * (commissionPercentage / 100);
    
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
    const { bettingHouseId } = req.params;
    const { fromDate, toDate } = req.query;
    
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
    const { bettingHouseId, date } = req.params;
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
