// backend/controllers/reportsController.js
import { DailyReport } from '../db/models/index.js';

export const calculateDailyReport = async (req, res) => {
  try {
    const bettingHouseId = req.body.betting_house_id || req.body.bettingHouseId;
    const reportDate = req.body.report_date || req.body.reportDate;
    
    if (!bettingHouseId || !reportDate) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id and report_date are required'
      });
    }
    
    const report = await DailyReport.calculate(bettingHouseId, reportDate);
    
    res.json({
      success: true,
      data: report,
      message: `Daily report calculated for ${reportDate}`
    });
  } catch (error) {
    console.error('Error calculating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate daily report'
    });
  }
};

export const getDailyReportByDate = async (req, res) => {
  try {
    const bettingHouseId = req.query.betting_house_id || req.query.bettingHouseId;
    const date = req.query.date;
    
    if (!bettingHouseId || !date) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id and date are required'
      });
    }
    
    const report = await DailyReport.findByDate(bettingHouseId, date);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found for this date'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch daily report'
    });
  }
};

export const getReportsByRange = async (req, res) => {
  try {
    const bettingHouseId = req.query.betting_house_id || req.query.bettingHouseId;
    const fromDate = req.query.from_date || req.query.fromDate;
    const toDate = req.query.to_date || req.query.toDate;
    
    if (!bettingHouseId || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id, from_date and to_date are required'
      });
    }
    
    const reports = await DailyReport.findByRange(bettingHouseId, fromDate, toDate);
    
    // Calcular totales del período
    const periodTotals = {
      totalBets: reports.reduce((sum, r) => sum + r.total_bets_placed, 0),
      totalWagered: reports.reduce((sum, r) => sum + r.total_amount_wagered, 0),
      totalWon: reports.reduce((sum, r) => sum + r.bets_won, 0),
      totalLost: reports.reduce((sum, r) => sum + r.bets_lost, 0),
      totalCommissions: reports.reduce((sum, r) => sum + r.total_commissions, 0),
      netProfitLoss: reports.reduce((sum, r) => sum + r.net_profit_loss, 0)
    };
    
    res.json({
      success: true,
      data: reports,
      totals: periodTotals,
      range: { fromDate, toDate },
      days: reports.length
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports'
    });
  }
};

export const getLatestReport = async (req, res) => {
  try {
    const bettingHouseId = req.query.betting_house_id || req.query.bettingHouseId;
    
    if (!bettingHouseId) {
      return res.status(400).json({
        success: false,
        error: 'betting_house_id is required'
      });
    }
    
    const report = await DailyReport.getLatest(bettingHouseId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'No reports found'
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching latest report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest report'
    });
  }
};
