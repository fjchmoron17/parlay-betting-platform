// server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import gamesRoutes from './routes/games.js';
import betsRoutes from './routes/bets.js';
import bettingHousesRoutes from './routes/bettingHouses.js';
import betsDBRoutes from './routes/betsDB.js';
import reportsRoutes from './routes/reports.js';
import { getCacheStats } from './services/sportsApiService.js';
import authRoutes from './routes/auth.js';
import settlementRoutes from './routes/settlement.js';
import { startAutoSettlement } from './services/schedulerService.js';

// Load environment variables
// En Railway, las variables están en el sistema. dotenv solo lee archivos locales.
// Pero como fallback, también intentamos leer .env.production
dotenv.config({ path: '.env.production' });
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📝 ODDS_API_KEY available: ${!!process.env.ODDS_API_KEY}`);
console.log(`📝 PORT: ${process.env.PORT || 3333}`);

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware - CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://parlay-betting-platform-production.up.railway.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // In production, allow all origins OR specific allowed origins
    if (process.env.NODE_ENV === 'production') {
      // Allow all origins in production for mobile/international access
      callback(null, true);
    } else if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-admin-token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Additional headers for mobile and international access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apiKeyConfigured: !!process.env.ODDS_API_KEY && process.env.ODDS_API_KEY !== 'YOUR_API_KEY_HERE',
    apiKeyLength: process.env.ODDS_API_KEY?.length || 0
  });
});

// Cache Statistics Endpoint
app.get('/api/cache-stats', (req, res) => {
  const stats = getCacheStats();
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    cache: stats,
    message: 'Cache statistics for The Odds API. Higher hit rate means lower API usage and cost.'
  });
});

// API Routes
app.use('/api/games', gamesRoutes);
app.use('/api/bets', betsRoutes);
app.use('/api/betting-houses', bettingHousesRoutes);
app.use('/api/bets-db', betsDBRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settlement', settlementRoutes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║   🎰 PARLAY BETS BACKEND RUNNING   ║
  ║   🌐 Port: ${PORT}                      ║
  ║   🌍 ENV: ${process.env.NODE_ENV || 'development'}     ║
  ║   📦 API: /api/games               ║
  ║   📦 API: /api/bets                ║
  ║   📦 API: /api/betting-houses      ║
  ║   📦 API: /api/bets-db             ║
  ║   📦 API: /api/reports             ║
  ║   📦 API: /api/settlement          ║
  ╚════════════════════════════════════╝
  `);

  // Iniciar auto-resolución de apuestas
  // Se ejecuta cada 2 horas por defecto
  // Puede configurarse con AUTO_SETTLE_CRON env var
  const cronExpression = process.env.AUTO_SETTLE_CRON || '0 */2 * * *';
  const autoSettleEnabled = process.env.AUTO_SETTLE_ENABLED !== 'false';
  
  if (autoSettleEnabled) {
    startAutoSettlement(cronExpression);
  } else {
    console.log('⏸️  Auto-resolución deshabilitada (AUTO_SETTLE_ENABLED=false)');
  }
});
