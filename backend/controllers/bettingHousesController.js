// backend/controllers/bettingHousesController.js
import { BettingHouse, BettingHouseUser } from '../db/models/index.js';
import bcrypt from 'bcryptjs';
import { sendBettingHouseRegistrationEmail } from '../services/emailService.js';

export const getAllBettingHouses = async (req, res) => {
  try {
    const houses = await BettingHouse.findAll();
    res.json({
      success: true,
      data: houses,
      total: houses.length
    });
  } catch (error) {
    console.error('Error fetching betting houses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting houses'
    });
  }
};

export const getBettingHouseById = async (req, res) => {
  try {
    const { id } = req.params;
    const house = await BettingHouse.findById(id);
    
    if (!house) {
      return res.status(404).json({
        success: false,
        error: 'Betting house not found'
      });
    }
    
    res.json({
      success: true,
      data: house
    });
  } catch (error) {
    console.error('Error fetching betting house:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting house'
    });
  }
};

export const createBettingHouse = async (req, res) => {
  try {
    const { name, email, country, currency = 'USD', username, password } = req.body;
    
    if (!name || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, username and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Crear casa de apuestas
    const house = await BettingHouse.create(name, email, country, currency);
    
    // Crear usuario para la casa
    const user = await BettingHouseUser.upsert({
      betting_house_id: house.id,
      username,
      email,
      password_hash: hashedPassword,
      role: 'house_admin'
    });

    // Enviar emails
    await sendBettingHouseRegistrationEmail(
      house,
      { username, password }
    );
    
    res.status(201).json({
      success: true,
      data: {
        house,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      },
      message: 'Betting house created successfully. Emails sent.'
    });
  } catch (error) {
    console.error('Error creating betting house:', error);
    if (error.code === '23505') { // Unique constraint
      return res.status(409).json({
        success: false,
        error: 'Betting house with this name, email or username already exists'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create betting house'
    });
  }
};

export const getBettingHouseSummary = async (req, res) => {
  try {
    const summary = await BettingHouse.getSummary();
    res.json({
      success: true,
      data: summary,
      total: summary.length
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch betting house summary'
    });
  }
};

export const deleteBettingHouse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que existe
    const house = await BettingHouse.findById(id);
    if (!house) {
      return res.status(404).json({
        success: false,
        error: 'Betting house not found'
      });
    }
    
    // Eliminar (cascada elimina usuarios, apuestas, reportes, etc)
    const deleted = await BettingHouse.delete(id);
    
    res.json({
      success: true,
      data: deleted,
      message: `Betting house "${deleted.name}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting betting house:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete betting house'
    });
  }
};

export const reseedAuthUsers = async (req, res) => {
  try {
    // Temporal: Sin validación de secret para permitir reseed en Railway
    // TODO: Agregar autenticación real
    
    // Obtener todas las casas
    const housesResult = await BettingHouse.findAll();
    const houses = housesResult;

    const users = [
      {
        username: 'superadmin',
        email: 'superadmin@parlay.com',
        password: 'Super!123',
        role: 'super_admin',
        betting_house_id: null
      },
      ...houses.map((house) => ({
        username: `casa${house.id}`,
        email: `admin${house.id}@parlay.com`,
        password: `Casa${house.id}!123`,
        role: 'house_admin',
        betting_house_id: house.id
      }))
    ];

    const inserted = [];

    for (const user of users) {
      const password_hash = await bcrypt.hash(user.password, 10);
      
      const result = await BettingHouseUser.upsert({
        betting_house_id: user.betting_house_id,
        username: user.username,
        email: user.email,
        password_hash,
        role: user.role
      });
      
      inserted.push({ 
        id: result.id, 
        username: result.username, 
        role: result.role, 
        betting_house_id: result.betting_house_id,
        password: user.password 
      });
    }

    res.json({
      success: true,
      data: inserted,
      message: 'Auth users reseeded successfully'
    });
  } catch (error) {
    console.error('Error reseeding users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reseed users'
    });
  }
};

