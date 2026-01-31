// src/components/BetSettlement.jsx
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export default function BetSettlement() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);

  // Cargar estado del scheduler al montar
  useEffect(() => {
    loadSchedulerStatus();
  }, []);

  const loadSchedulerStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/settlement/status`);
      const data = await response.json();
      if (data.success) {
        setSchedulerStatus(data.data);
      }
    } catch (err) {
      console.error('Error loading scheduler status:', err);
    }
  };

  const handleProcessBets = async () => {
    if (!confirm('¿Deseas procesar todas las apuestas pendientes y resolver automáticamente las que tengan resultados disponibles?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/settlement/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Error al procesar apuestas');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleScheduler = async (action) => {
    try {
      const response = await fetch(`${API_URL}/settlement/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success) {
        await loadSchedulerStatus();
        alert(data.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="bet-settlement">
      <div className="content-header">
        <div>
          <h2>🎯 Resolución Automática de Apuestas</h2>
          <p className="subtitle">
            Procesa apuestas pendientes y resuelve automáticamente usando resultados de The Odds API
          </p>
        </div>
      </div>

      {/* Estado del Scheduler Automático */}
      {schedulerStatus && (
        <div className={`scheduler-status ${schedulerStatus.active ? 'active' : 'inactive'}`}>
          <div className="status-header">
            <div className="status-indicator">
              <span className={`status-dot ${schedulerStatus.active ? 'active' : ''}`}></span>
              <h3>
                {schedulerStatus.active ? '🤖 Auto-Resolución Activa' : '⏸️ Auto-Resolución Inactiva'}
              </h3>
            </div>
            <button
              onClick={() => handleToggleScheduler(schedulerStatus.active ? 'stop' : 'start')}
              className={schedulerStatus.active ? 'btn-stop' : 'btn-start'}
            >
              {schedulerStatus.active ? '⏸️ Detener' : '▶️ Activar'}
            </button>
          </div>
          {schedulerStatus.active && (
            <div className="status-info">
              <p>
                <strong>Próxima ejecución:</strong> {schedulerStatus.nextExecution || 'Calculando...'}
              </p>
              <p>
                <strong>Frecuencia:</strong> Cada 2 horas
              </p>
              {schedulerStatus.running && (
                <p className="running-badge">⚡ Ejecutándose ahora...</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="settlement-card">
        <div className="settlement-info">
          <div className="info-section">
            <h3>📋 Cómo funciona</h3>
            <ul>
              <li>✅ Busca todas las apuestas con estado "pendiente"</li>
              <li>🔍 Consulta los resultados de los juegos en The Odds API</li>
              <li>🎲 Evalúa cada selección según el tipo de mercado (h2h, spreads, totals)</li>
              <li>💰 Calcula ganancias automáticamente para apuestas ganadoras</li>
              <li>📊 Actualiza el estado de las apuestas resueltas</li>
              <li>🤖 Se ejecuta automáticamente cada 2 horas (configurable)</li>
            </ul>
          </div>

          <div className="info-section">
            <h3>⚠️ Consideraciones</h3>
            <ul>
              <li>Solo procesa juegos completados en los últimos 3 días</li>
              <li>Las apuestas que no tengan resultados disponibles permanecen pendientes</li>
              <li>Consume 2 créditos de API por cada deporte procesado</li>
              <li>Soporta mercados: Moneyline (h2h), Spreads y Totals</li>
              <li>Puedes ejecutar manualmente en cualquier momento</li>
              <li>La ejecución automática puede activarse/desactivarse según necesidad</li>
            </ul>
          </div>
        </div>

        <div className="settlement-actions">
          <button
            onClick={handleProcessBets}
            disabled={loading}
            className="primary-btn large"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Procesando...
              </>
            ) : (
              <>
                ▶️ Ejecutar Manualmente
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <strong>❌ Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="settlement-result">
            <div className="alert alert-success">
              <strong>✅ {result.message}</strong>
            </div>
            <div className="result-stats">
              <div className="stat-card">
                <div className="stat-value">{result.data.processed}</div>
                <div className="stat-label">Apuestas Procesadas</div>
              </div>
              <div className="stat-card success">
                <div className="stat-value">{result.data.settled}</div>
                <div className="stat-label">Apuestas Resueltas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{result.data.processed - result.data.settled}</div>
                <div className="stat-label">Aún Pendientes</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .bet-settlement {
          padding: 24px;
        }

        .scheduler-status {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #d1d5db;
        }

        .scheduler-status.active {
          border-left-color: #10b981;
          background: linear-gradient(to right, #f0fdf4 0%, white 10%);
        }

        .scheduler-status.inactive {
          border-left-color: #f59e0b;
          background: linear-gradient(to right, #fffbeb 0%, white 10%);
        }

        .status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .status-indicator h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #f59e0b;
          animation: pulse-inactive 2s infinite;
        }

        .status-dot.active {
          background: #10b981;
          animation: pulse-active 2s infinite;
        }

        @keyframes pulse-active {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes pulse-inactive {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        .btn-start,
        .btn-stop {
          padding: 8px 20px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-start {
          background: #10b981;
          color: white;
        }

        .btn-start:hover {
          background: #059669;
        }

        .btn-stop {
          background: #f59e0b;
          color: white;
        }

        .btn-stop:hover {
          background: #d97706;
        }

        .status-info {
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }

        .status-info p {
          margin: 8px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .running-badge {
          display: inline-block;
          padding: 4px 12px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
        }

        .settlement-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .settlement-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .info-section h3 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #1f2937;
        }

        .info-section ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-section li {
          padding: 8px 0;
          color: #4b5563;
          line-height: 1.6;
        }

        .settlement-actions {
          display: flex;
          justify-content: center;
          padding: 24px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .large {
          font-size: 16px;
          padding: 16px 48px;
          min-width: 280px;
        }

        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .settlement-result {
          margin-top: 32px;
        }

        .result-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-top: 24px;
        }

        .stat-card {
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }

        .stat-card.success {
          background: #f0fdf4;
          border-color: #86efac;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .alert {
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 16px;
        }

        .alert-danger {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .alert-success {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #166534;
        }

        @media (max-width: 768px) {
          .settlement-info {
            grid-template-columns: 1fr;
          }

          .result-stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
