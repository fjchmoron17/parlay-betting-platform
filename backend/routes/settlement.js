// backend/routes/settlement.js
import express from 'express';
import { processUnsettledBets } from '../services/betSettlementService.js';

const router = express.Router();

// POST /api/settlement/process - Procesar apuestas pendientes
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

export default router;
