// src/components/LoginForm.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginForm.css';

export default function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    role: 'house_admin',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.password) {
      setError('Usuario y contraseña son obligatorios');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await login({
        role: formData.role,
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        onSuccess && onSuccess();
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🎰 Parlay Bets</h1>
          <h2>Acceso Seguro</h2>
          <p>Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="role">Tipo de Usuario</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="super_admin">Super Admin (todas las casas)</option>
              <option value="house_admin">Casa de Apuestas (solo su casa)</option>
            </select>
          </div>

          {formData.role === 'house_admin' && (
            <div className="form-group">
              <label htmlFor="houseId">ID de Casa de Apuestas</label>
              <input
                type="number"
                id="houseId"
                name="houseId"
                value={formData.houseId}
                onChange={handleChange}
                placeholder="Ej: 1"
                disabled={loading}
                autoFocus
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Nombre de usuario"
              disabled={loading}
            />
          </div>

          <div className="form-group password-group">
            <label htmlFor="password">Contraseña</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-info">
            💡 <strong>Demo:</strong> Usa "super admin" para ver todas las casas o selecciona "Casa de Apuestas"
          </p>
        </div>
      </div>
    </div>
  );
}
