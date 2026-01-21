// backend/routes/reports.js
import express from 'express';
import {
  calculateDailyReport,
  getDailyReportByDate,
  getReportsByRange,
  getLatestReport
} from '../controllers/reportsController.js';

const router = express.Router();

// POST /api/reports/:bettingHouseId/calculate - Calcular reporte diario
router.post('/:bettingHouseId/calculate', calculateDailyReport);

// GET /api/reports/:bettingHouseId/date/:date - Obtener reporte de una fecha
router.get('/:bettingHouseId/date/:date', getDailyReportByDate);

// GET /api/reports/:bettingHouseId/range - Obtener reportes por rango de fechas
router.get('/:bettingHouseId/range', getReportsByRange);

// GET /api/reports/:bettingHouseId/latest - Obtener último reporte
router.get('/:bettingHouseId/latest', getLatestReport);

export default router;
