// server.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import gamesRoutes from './routes/games.js';
import betsRoutes from './routes/bets.js';

dotenv.config({ path: '/Users/fjchmoron/Documents/PARLAY_SITE/backend/.env' });

const app = express();
const PORT = process.env.PORT || 3333;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://parlay-betting-platform-production.up.railway.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/games', gamesRoutes);
app.use('/api/bets', betsRoutes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════╗
  ║   🎰 PARLAY BETS BACKEND RUNNING   ║
  ║   🌐 http://localhost:${PORT}             ║
  ║   📦 API: /api/games               ║
  ║   📦 API: /api/bets                ║
  ╚════════════════════════════════════╝
  `);
});
