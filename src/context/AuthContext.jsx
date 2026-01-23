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
    const savedSession = localStorage.getItem('authSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setUser(session.user || null);
      setHouse(session.house || null);
    }
    setLoading(false);
  }, []);

  const login = async ({ role, houseId, username, password }) => {
    try {
      if (role === 'super_admin') {
        // Autenticación de super admin (demo). En producción validar en backend.
        const userData = {
          id: 0,
          username,
          role: 'super_admin'
        };

        const session = { user: userData, house: null };
        localStorage.setItem('authSession', JSON.stringify(session));
        setUser(userData);
        setHouse(null);
        return { success: true };
      }

      if (!houseId) {
        throw new Error('Debes indicar la casa de apuestas');
      }

      const response = await getBettingHouseById(houseId);

      if (!response.success) {
        throw new Error('Casa de apuestas no encontrada');
      }

      const houseData = response.data;

      // En producción validar credenciales contra backend / BD
      const userData = {
        id: houseId,
        username,
        role: 'house_admin'
      };

      const session = {
        user: userData,
        house: houseData
      };

      localStorage.setItem('authSession', JSON.stringify(session));
      setUser(userData);
      setHouse(houseData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authSession');
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
        const savedSession = JSON.parse(localStorage.getItem('authSession'));
        if (savedSession) {
          savedSession.house = response.data;
          localStorage.setItem('authSession', JSON.stringify(savedSession));
        }
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
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
