// src/components/ApiQuotaMonitor.jsx
import { useState, useEffect } from 'react';
import './ApiQuotaMonitor.css';

export default function ApiQuotaMonitor() {
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchQuotaInfo();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchQuotaInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotaInfo = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

      // Consultar cuotas de ambas API keys
      const response = await fetch(`${API_URL}/games/quota-keys`);
      if (!response.ok) {
        throw new Error('Failed to fetch quota info');
      }
      const data = await response.json();

      const keys = data?.data || [];
      const primary = keys[0] || null;
      const activeLabel = data?.activeKey || primary?.label || null;
      const active = keys.find((item) => item.label === activeLabel) || primary;

      setQuotaInfo({
        keys,
        activeLabel,
        active
      });

      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching quota:', err);
      setError('No se pudo obtener información de cuota');
    } finally {
      setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!quotaInfo?.active || quotaInfo.active.remaining === null) return 0;
    return ((quotaInfo.active.total - quotaInfo.active.remaining) / quotaInfo.active.total) * 100;
  };

  const getStatusColor = () => {
    const percentage = getUsagePercentage();
    if (percentage < 50) return '#10b981'; // Verde
    if (percentage < 80) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };

  const getStatusText = () => {
    const percentage = getUsagePercentage();
    if (percentage < 50) return 'Cuota saludable';
    if (percentage < 80) return 'Uso moderado';
    return 'Cuota limitada';
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading && !quotaInfo) {
    return (
      <div className="quota-monitor loading">
        <div className="loading-spinner"></div>
        <p>Cargando información de cuota...</p>
      </div>
    );
  }

  const percentage = getUsagePercentage();
  const statusColor = getStatusColor();

  return (
    <div className="quota-monitor">
      <div className="quota-header">
        <h2>Monitor de Cuota API</h2>
        <button 
          onClick={fetchQuotaInfo} 
          className="refresh-btn"
          disabled={loading}
          title="Actualizar"
        >
          🔄 {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div className="quota-cards">
        {/* Card Principal */}
        <div className="quota-card main-card">
          <div className="card-header">
            <h3>Estado de Cuota</h3>
            <span 
              className="status-badge"
              style={{ background: statusColor }}
            >
              {getStatusText()}
            </span>
          </div>

          {quotaInfo?.activeLabel && (
            <div className="active-key">Clave activa: {quotaInfo.activeLabel}</div>
          )}

          <div className="quota-visual">
            <div className="circular-progress">
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle
                  cx="90"
                  cy="90"
                  r="70"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="90"
                  cy="90"
                  r="70"
                  fill="none"
                  stroke={statusColor}
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${2 * Math.PI * 70 * (1 - percentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>
              <div className="progress-content">
                <div className="remaining-count">
                  {quotaInfo?.active?.remaining ?? '---'}
                </div>
                <div className="remaining-label">Requests restantes</div>
              </div>
            </div>
          </div>

          <div className="quota-details">
            <div className="detail-row">
              <span className="detail-label">Total asignado:</span>
              <span className="detail-value">{quotaInfo?.active?.total ?? '---'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Utilizados:</span>
              <span className="detail-value">{quotaInfo?.active?.used ?? '---'}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Porcentaje usado:</span>
              <span className="detail-value">{percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Cards Secundarias */}
        <div className="secondary-cards">
          {quotaInfo?.keys?.length > 0 && (
            <div className="info-card full-width">
              <div className="info-content">
                <span className="info-label">Cuotas por API Key</span>
                <div className="key-quota-list">
                  {quotaInfo.keys.map((item) => (
                    <div className="key-quota-item" key={item.label}>
                      <span className="key-label">{item.label}</span>
                      <span className="key-value">
                        {item.remaining ?? '---'} / {item.total ?? '---'}
                      </span>
                      <span className={`key-status ${item.ok ? 'ok' : 'error'}`}>
                        {item.ok ? 'OK' : 'Error'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="info-card">
            <div className="info-icon">⏰</div>
            <div className="info-content">
              <span className="info-label">Última actualización</span>
              <span className="info-value">
                {lastUpdate ? formatTime(lastUpdate) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">📊</div>
            <div className="info-content">
              <span className="info-label">Plan</span>
              <span className="info-value">Gratuito (500/mes)</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">🔄</div>
            <div className="info-content">
              <span className="info-label">Reseteo</span>
              <span className="info-value">Mensual</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">⚡</div>
            <div className="info-content">
              <span className="info-label">Cache activo</span>
              <span className="info-value">5 min TTL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="quota-tips">
        <h3>💡 Consejos para optimizar el uso:</h3>
        <ul>
          <li>El sistema usa caché de 5 minutos para reducir requests</li>
          <li>Los datos se comparten entre todas las regiones</li>
          <li>Evita refrescar la página constantemente</li>
          <li>El caché alcanza ~85% de efectividad en uso normal</li>
        </ul>
      </div>
    </div>
  );
}
