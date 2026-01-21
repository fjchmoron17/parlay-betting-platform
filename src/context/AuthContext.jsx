// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { getBettingHouseById } from '../services/b2bApi';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [house, setHouse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedSession = localStorage.getItem('bettingHouseSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setUser(session.user);
      setHouse(session.house);
    }
    setLoading(false);
  }, []);

  const login = async (houseId, username, password) => {
    try {
      // Obtener datos de la casa
      const response = await getBettingHouseById(houseId);
      
      if (!response.success) {
        throw new Error('Casa de apuestas no encontrada');
      }

      const houseData = response.data;

      // En producción, aquí validarías username/password contra la BD
      // Por ahora, simulamos autenticación básica
      const userData = {
        id: houseId,
        username: username,
        role: 'house_admin'
      };

      const session = {
        user: userData,
        house: houseData
      };

      localStorage.setItem('bettingHouseSession', JSON.stringify(session));
      setUser(userData);
      setHouse(houseData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('bettingHouseSession');
    setUser(null);
    setHouse(null);
  };

  const refreshHouseData = async () => {
    if (!house) return;
    
    try {
      const response = await getBettingHouseById(house.id);
      if (response.success) {
        setHouse(response.data);
        
        // Actualizar en localStorage
        const savedSession = JSON.parse(localStorage.getItem('bettingHouseSession'));
        savedSession.house = response.data;
        localStorage.setItem('bettingHouseSession', JSON.stringify(savedSession));
      }
    } catch (error) {
      console.error('Error refreshing house data:', error);
    }
  };

  const value = {
    user,
    house,
    loading,
    login,
    logout,
    refreshHouseData,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
