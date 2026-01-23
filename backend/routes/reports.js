// backend/routes/reports.js
import express from 'express';
import {
  calculateDailyReport,
  getDailyReportByDate,
  getReportsByRange,
  getLatestReport
} from '../controllers/reportsController.js';

const router = express.Router();

// POST /api/reports/calculate - Calcular reporte diario (con betting_house_id y report_date en body)
router.post('/calculate', calculateDailyReport);

// GET /api/reports/daily?betting_house_id=X&date=Y - Obtener reporte de una fecha
router.get('/daily', getDailyReportByDate);

// GET /api/reports/range?betting_house_id=X&from_date=Y&to_date=Z - Obtener reportes por rango
router.get('/range', getReportsByRange);

// GET /api/reports/latest?betting_house_id=X - Obtener último reporte
router.get('/latest', getLatestReport);

export default router;
