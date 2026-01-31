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
  const [sessionTimer, setSessionTimer] = useState(null);

  // Constante de timeout: 5 minutos
  const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutos en milisegundos

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedSession = localStorage.getItem('authSession');
    if (savedSession) {
      const session = JSON.parse(savedSession);
      const loginTime = session.loginTime || Date.now();
      const timeElapsed = Date.now() - loginTime;
      
      // Si han pasado más de 2 minutos, expirar sesión
      if (timeElapsed >= SESSION_TIMEOUT) {
        localStorage.removeItem('authSession');
        alert('⏱️ Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.');
      } else {
        setUser(session.user || null);
        setHouse(session.house || null);
        // Iniciar timer para el tiempo restante
        startSessionTimer(SESSION_TIMEOUT - timeElapsed);
      }
    }
    setLoading(false);
  }, []);

  const startSessionTimer = (timeout) => {
    // Limpiar timer anterior si existe
    if (sessionTimer) {
      clearTimeout(sessionTimer);
    }

    // Crear nuevo timer
    const timer = setTimeout(() => {
      alert('⏱️ Tu sesión ha expirado por inactividad. Serás redirigido al login.');
      logout();
    }, timeout);

    setSessionTimer(timer);
  };

  const login = async ({ role, username, password }) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, username, password })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Credenciales inválidas');
      }

      const session = {
        user: data.data.user,
        house: data.data.house || null,
        loginTime: Date.now() // Guardar timestamp del login
      };

      localStorage.setItem('authSession', JSON.stringify(session));
      setUser(data.data.user);
      setHouse(data.data.house || null);

      // Iniciar timer de sesión (2 minutos)
      startSessionTimer(SESSION_TIMEOUT);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    // Limpiar timer
    if (sessionTimer) {
      clearTimeout(sessionTimer);
      setSessionTimer(null);
    }
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

  // Limpiar timer cuando el componente se desmonte
  useEffect(() => {
    return () => {
      if (sessionTimer) {
        clearTimeout(sessionTimer);
      }
    };
  }, [sessionTimer]);

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
