// backend/controllers/betsController.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const betsFilePath = path.join(__dirname, '../data/bets.json');

// Asegurar que el directorio data existe
const ensureDataDir = () => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Leer apuestas del archivo
const readBets = () => {
  ensureDataDir();
  try {
    if (fs.existsSync(betsFilePath)) {
      const data = fs.readFileSync(betsFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading bets file:', error);
  }
  return [];
};

// Guardar apuestas en el archivo
const saveBets = (bets) => {
  ensureDataDir();
  try {
    fs.writeFileSync(betsFilePath, JSON.stringify(bets, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error saving bets file:', error);
  }
};

// Generar ID único para la apuesta
const generateBetId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `BET-${timestamp}-${random}`;
};

export const createBet = async (req, res) => {
  try {
    const { selections, amount, combinedOdds } = req.body;

    if (!selections || !amount || !combinedOdds) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: selections, amount, combinedOdds',
      });
    }

    const bet = {
      id: generateBetId(),
      selections,
      amount,
      combinedOdds,
      potentialWinnings: (amount * combinedOdds - amount).toFixed(2),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Guardar en archivo
    const bets = readBets();
    bets.push(bet);
    saveBets(bets);

    console.log(`✅ Bet created: ${bet.id}`);

    res.json({
      success: true,
      data: bet,
      message: 'Apuesta creada exitosamente',
    });
  } catch (error) {
    console.error('Error creating bet:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear la apuesta',
    });
  }
};

export const getBet = async (req, res) => {
  try {
    const { id } = req.params;
    const bets = readBets();
    const bet = bets.find((b) => b.id === id);

    if (!bet) {
      return res.status(404).json({
        success: false,
        error: 'Apuesta no encontrada',
      });
    }

    res.json({
      success: true,
      data: bet,
    });
  } catch (error) {
    console.error('Error getting bet:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la apuesta',
    });
  }
};

export const getAllBets = async (req, res) => {
  try {
    const bets = readBets();

    res.json({
      success: true,
      data: bets,
      total: bets.length,
    });
  } catch (error) {
    console.error('Error getting all bets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las apuestas',
    });
  }
};

export const getRecentBets = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const bets = readBets();
    const recentBets = bets.slice(-parseInt(limit)).reverse();

    res.json({
      success: true,
      data: recentBets,
      total: recentBets.length,
    });
  } catch (error) {
    console.error('Error getting recent bets:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener las apuestas recientes',
    });
  }
};

export const updateBetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Falta el status',
      });
    }

    const bets = readBets();
    const betIndex = bets.findIndex((b) => b.id === id);

    if (betIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Apuesta no encontrada',
      });
    }

    bets[betIndex].status = status;
    bets[betIndex].updatedAt = new Date().toISOString();
    saveBets(bets);

    res.json({
      success: true,
      data: bets[betIndex],
      message: `Apuesta actualizada a ${status}`,
    });
  } catch (error) {
    console.error('Error updating bet:', error);
    res.status(500).json({
      success: false,
      error: 'Error al actualizar la apuesta',
    });
  }
};

export const getBetStats = async (req, res) => {
  try {
    const bets = readBets();

    const stats = {
      total: bets.length,
      pending: bets.filter((b) => b.status === 'pending').length,
      won: bets.filter((b) => b.status === 'won').length,
      lost: bets.filter((b) => b.status === 'lost').length,
      totalStaked: bets.reduce((sum, b) => sum + parseFloat(b.amount), 0).toFixed(2),
      totalWon: bets
        .filter((b) => b.status === 'won')
        .reduce((sum, b) => sum + parseFloat(b.potentialWinnings), 0)
        .toFixed(2),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting bet stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas',
    });
  }
};

export default {
  createBet,
  getBet,
  getAllBets,
  getRecentBets,
  updateBetStatus,
  getBetStats,
};

