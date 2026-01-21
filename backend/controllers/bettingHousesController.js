// backend/controllers/bettingHousesController.js
import { BettingHouse } from '../db/models/index.js';

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
    const { name, email, country, currency = 'USD' } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Name and email are required'
      });
    }
    
    const house = await BettingHouse.create(name, email, country, currency);
    
    res.status(201).json({
      success: true,
      data: house,
      message: 'Betting house created successfully'
    });
  } catch (error) {
    console.error('Error creating betting house:', error);
    if (error.code === '23505') { // Unique constraint
      return res.status(409).json({
        success: false,
        error: 'Betting house with this name or email already exists'
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
