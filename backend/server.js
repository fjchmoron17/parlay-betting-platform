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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
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
