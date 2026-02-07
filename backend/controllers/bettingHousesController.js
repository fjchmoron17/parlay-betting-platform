// backend/controllers/bettingHousesController.js
import { BettingHouse, BettingHouseUser } from '../db/models/index.js';
import { query as queryDb } from '../db/dbConfig.js';
import bcrypt from 'bcryptjs';
import { sendBettingHouseRegistrationEmail } from '../services/emailService.js';

export const getAllBettingHouses = async (req, res) => {
  try {
    const houses = await BettingHouse.findAll();
    
    // Enriquecer cada casa con información de comisiones acumuladas
    const enrichedHouses = await Promise.all(
      houses.map(async (house) => {
        try {
          // Obtener total de comisiones generadas del reporte
          const commissionResult = await queryDb(
            `SELECT COALESCE(SUM(total_commissions), 0) as total_commissions_generated
             FROM daily_reports
             WHERE betting_house_id = $1`,
            [house.id]
          );
          
          const commissionsGenerated = parseFloat(
            commissionResult.rows[0]?.total_commissions_generated || 0
          );
          
          return {
            ...house,
            commission_percentage: 5, // Comisión fija 5%
            commission_generated: commissionsGenerated
          };
        } catch (err) {
          console.error(`Error calculating commissions for house ${house.id}:`, err);
          return {
            ...house,
            commission_percentage: 5,
            commission_generated: 0
          };
        }
      })
    );
    
    res.json({
      success: true,
      data: enrichedHouses,
      total: enrichedHouses.length
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
    const isPublic = req.body?.isPublic === true || req.body?.publicMode === true;
    
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
    const houseStatus = isPublic ? 'inactive' : 'active';
    const house = await BettingHouse.create(name, email, country, currency, houseStatus);
    
    // Crear usuario para la casa
    const user = await BettingHouseUser.upsert({
      betting_house_id: house.id,
      username,
      email,
      password_hash: hashedPassword,
      role: 'house_admin'
    });

    // Enviar emails (no blocking - fire and forget)
    const baseApiUrl = (process.env.BACKEND_BASE_URL || process.env.API_BASE_URL || 'https://parlay-betting-platform-production.up.railway.app').replace(/\/$/, '');
    const activationUrl = process.env.ADMIN_TOKEN
      ? `${baseApiUrl}/api/betting-houses/activate/${house.id}?token=${encodeURIComponent(process.env.ADMIN_TOKEN)}`
      : null;

    sendBettingHouseRegistrationEmail(house, { username, password }, {
      approvalRequired: isPublic,
      activationUrl
    })
      .catch(err => console.error('❌ Email send failed (non-blocking):', err.message));
    
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
      message: isPublic
        ? 'Betting house created in inactive status. Awaiting admin approval.'
        : 'Betting house created successfully.'
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

export const activateBettingHouseFromEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.query.token;

    if (!process.env.ADMIN_TOKEN) {
      return res.status(500).send('ADMIN_TOKEN not configured');
    }

    if (!token || token !== process.env.ADMIN_TOKEN) {
      return res.status(403).send('Invalid or missing activation token');
    }

    const house = await BettingHouse.findById(id);
    if (!house) {
      return res.status(404).send('Betting house not found');
    }

    if (house.status === 'active') {
      return res.send('Betting house is already active');
    }

    await BettingHouse.updateStatus(id, 'active');
    return res.send('Betting house activated successfully');
  } catch (error) {
    console.error('Error activating betting house:', error);
    return res.status(500).send('Failed to activate betting house');
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

export const updateBettingHouseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status. Use active or inactive.'
      });
    }

    const house = await BettingHouse.findById(id);
    if (!house) {
      return res.status(404).json({
        success: false,
        error: 'Betting house not found'
      });
    }

    const updated = await BettingHouse.updateStatus(id, status);
    res.json({
      success: true,
      data: updated,
      message: `Betting house status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating betting house status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update betting house status'
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

