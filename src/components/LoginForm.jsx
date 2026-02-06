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
  const [ticketQuery, setTicketQuery] = useState('');

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

  const handleTicketLookup = (e) => {
    e.preventDefault();
    if (!ticketQuery.trim()) {
      setError('Ingresa un número de ticket para consultar');
      return;
    }
    window.location.href = `/consulta-ticket?ticket=${encodeURIComponent(ticketQuery.trim())}`;
  };

  return (
    <div className="login-container">
      <header className="login-topbar">
        <div className="brand">
          <span className="brand-mark">◆</span>
          <div>
            <h1>Parlay Bets</h1>
            <p>Motor B2B de parlays</p>
          </div>
        </div>
        <nav className="top-links">
          <a href="/">Inicio</a>
          <a href="/reglas">Reglas</a>
          <a href="/consulta-ticket">Consulta tu ticket</a>
          <a href="/promociones">Promociones</a>
          <a href="/ayuda">Ayuda</a>
          <a href="/contacto">Contacto</a>
          <a className="highlight" href="/afilia">Afiliar Agencia</a>
        </nav>
      </header>

      <div className="login-hero">
        <div className="hero-copy">
          <span className="hero-badge">Plataforma multi-tenant</span>
          <h2>Convierte tus cuotas en parlays con reglas por casa.</h2>
          <p>
            Integra deportes, mercados y reglas personalizadas para ofrecer combinaciones
            seguras, claras y auditables. Tu casa decide qué se habilita, nosotros lo ejecutamos.
          </p>
          <ul>
            <li>Normalización de eventos y mercados</li>
            <li>Control de correlación y combinaciones inválidas</li>
            <li>Flujo B2B con auditoría por ticket</li>
          </ul>
          <div className="hero-cta">
            <a className="primary" href="/afilia">Solicitar demo</a>
            <a className="secondary" href="/consulta-ticket">Consultar ticket</a>
          </div>
          <div className="support">
            <span>Soporte: 10:00 AM a 8:00 PM</span>
            <span className="dot">•</span>
            <span>WhatsApp: +58 412 625 7738</span>
          </div>
        </div>

        <div className="login-panel">
          <div className="login-card">
            <div className="login-header">
              <h3>Acceso Seguro</h3>
              <p>Ingresa con tu rol para continuar</p>
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
                {loading ? 'Iniciando sesión...' : 'Entrar'}
              </button>
            </form>

            <div className="login-footer">
              <p className="demo-info">
                💡 <strong>Demo:</strong> Usa "super admin" para ver todas las casas o selecciona "Casa de Apuestas"
              </p>
              <div className="helper-links">
                <a href="/recuperar">Recuperar cuenta</a>
                <a href="/registro">Crear cuenta</a>
              </div>
            </div>
          </div>

          <div className="quick-panel">
            <h4>Consulta tu ticket</h4>
            <form onSubmit={handleTicketLookup} className="ticket-form">
              <input
                type="text"
                placeholder="Ej: BET-1769..."
                value={ticketQuery}
                onChange={(e) => setTicketQuery(e.target.value)}
              />
              <button type="submit">Buscar</button>
            </form>
            <p className="quick-note">Usa este acceso rápido para validar estado y fecha del evento.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
