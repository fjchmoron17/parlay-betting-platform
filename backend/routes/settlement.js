// backend/routes/settlement.js
import express from 'express';
import { processUnsettledBets, forceResolveOverdueStuckBets } from '../services/betSettlementService.js';
import { 
  getSchedulerStatus, 
  startAutoSettlement, 
  stopAutoSettlement 
} from '../services/schedulerService.js';

const router = express.Router();

// POST /api/settlement/process - Procesar apuestas pendientes manualmente
router.post('/process', async (req, res) => {
  try {
    const result = await processUnsettledBets();
    res.json({
      success: true,
      message: `Procesadas ${result.processed} apuestas, ${result.settled} resueltas automáticamente`,
      data: result
    });
  } catch (error) {
    console.error('Error in settlement process:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/settlement/force-resolve-overdue - Forzar resolución de apuestas atrasadas
router.post('/force-resolve-overdue', async (req, res) => {
  try {
    const result = await forceResolveOverdueStuckBets();
    res.json({
      success: true,
      message: `${result.forced} apuestas resueltas por timeout (>24h)`,
      data: result
    });
  } catch (error) {
    console.error('Error forcing resolution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/settlement/status - Obtener estado del scheduler
router.get('/status', (req, res) => {
  try {
    const status = getSchedulerStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/settlement/start - Iniciar auto-resolución
router.post('/start', (req, res) => {
  try {
    const { cronExpression } = req.body;
    startAutoSettlement(cronExpression);
    res.json({
      success: true,
      message: 'Auto-resolución iniciada',
      data: getSchedulerStatus()
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/settlement/stop - Detener auto-resolución
router.post('/stop', (req, res) => {
  try {
    stopAutoSettlement();
    res.json({
      success: true,
      message: 'Auto-resolución detenida'
    });
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
