// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, houseId, username, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      const session = {
        user: data.data.user,
        house: data.data.house || null
      };

      localStorage.setItem('authSession', JSON.stringify(session));
      setUser(data.data.user);
      setHouse(data.data.house || null);

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
      const resp = await fetch(`${API_URL}/betting-houses/${house.id}`);
      const response = await resp.json();
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
