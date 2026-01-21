// src/components/DailyReports.jsx
import { useState, useEffect } from 'react';
import { 
  calculateDailyReport, 
  getDailyReportByDate, 
  getReportsByRange,
  getLatestReport 
} from '../services/b2bApi';
import './DailyReports.css';

export default function DailyReports({ bettingHouseId, houseName }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (bettingHouseId) {
      loadReports();
    }
  }, [bettingHouseId, dateRange]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await getReportsByRange(
        bettingHouseId, 
        dateRange.from, 
        dateRange.to
      );
      setReports(response.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar reportes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateReport = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      await calculateDailyReport(bettingHouseId, today);
      alert('Reporte calculado exitosamente');
      loadReports();
    } catch (err) {
      alert('Error al calcular reporte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotals = () => {
    return reports.reduce((acc, report) => ({
      totalBets: acc.totalBets + (parseInt(report.total_bets_placed) || 0),
      totalWagered: acc.totalWagered + (parseFloat(report.total_amount_wagered) || 0),
      totalWinnings: acc.totalWinnings + (parseFloat(report.total_winnings) || 0),
      totalCommissions: acc.totalCommissions + (parseFloat(report.total_commissions) || 0),
      netProfitLoss: acc.netProfitLoss + (parseFloat(report.net_profit_loss) || 0)
    }), {
      totalBets: 0,
      totalWagered: 0,
      totalWinnings: 0,
      totalCommissions: 0,
      netProfitLoss: 0
    });
  };

  if (!bettingHouseId) {
    return (
      <div className="reports-empty">
        <p>Selecciona una casa de apuestas para ver reportes</p>
      </div>
    );
  }

  const totals = getTotals();

  return (
    <div className="daily-reports">
      <div className="reports-header">
        <div>
          <h2>Reportes Diarios - {houseName}</h2>
          <p className="reports-subtitle">
            Análisis de rendimiento y ganancias
          </p>
        </div>
        <button 
          onClick={handleCalculateReport}
          className="calculate-btn"
          disabled={loading}
        >
          🔄 Calcular Reporte de Hoy
        </button>
      </div>

      <div className="date-filter">
        <div className="date-input-group">
          <label htmlFor="from-date">Desde:</label>
          <input
            id="from-date"
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            disabled={loading}
          />
        </div>
        <div className="date-input-group">
          <label htmlFor="to-date">Hasta:</label>
          <input
            id="to-date"
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            disabled={loading}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">🎲</div>
          <div className="card-content">
            <span className="card-label">Total Apuestas</span>
            <span className="card-value">{totals.totalBets}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="card-label">Total Apostado</span>
            <span className="card-value">{formatCurrency(totals.totalWagered)}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🏆</div>
          <div className="card-content">
            <span className="card-label">Ganancias Pagadas</span>
            <span className="card-value">{formatCurrency(totals.totalWinnings)}</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">💵</div>
          <div className="card-content">
            <span className="card-label">Comisiones</span>
            <span className="card-value">{formatCurrency(totals.totalCommissions)}</span>
          </div>
        </div>

        <div className={`summary-card ${totals.netProfitLoss >= 0 ? 'positive' : 'negative'}`}>
          <div className="card-icon">{totals.netProfitLoss >= 0 ? '📈' : '📉'}</div>
          <div className="card-content">
            <span className="card-label">Balance Neto</span>
            <span className="card-value">{formatCurrency(totals.netProfitLoss)}</span>
          </div>
        </div>
      </div>

      {loading && <div className="loading-reports">Cargando reportes...</div>}

      {error && (
        <div className="error-message">
          <span>⚠️</span> {error}
        </div>
      )}

      {!loading && reports.length === 0 ? (
        <div className="empty-reports">
          <p>No hay reportes para el rango de fechas seleccionado</p>
          <button onClick={handleCalculateReport} className="primary-btn">
            Calcular Reporte de Hoy
          </button>
        </div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Apuestas</th>
                <th>Ganadas/Perdidas</th>
                <th>Apostado</th>
                <th>Ganancias</th>
                <th>Comisiones</th>
                <th>Balance Neto</th>
                <th>Balance Cierre</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => {
                const netPL = parseFloat(report.net_profit_loss);
                return (
                  <tr key={report.id}>
                    <td className="date-col">
                      {formatDate(report.report_date)}
                    </td>
                    <td className="center-col">
                      {report.total_bets_placed}
                    </td>
                    <td className="center-col">
                      <span className="won-lost">
                        <span className="won">{report.bets_won}</span>
                        <span className="separator">/</span>
                        <span className="lost">{report.bets_lost}</span>
                      </span>
                    </td>
                    <td className="amount-col">
                      {formatCurrency(report.total_amount_wagered)}
                    </td>
                    <td className="amount-col">
                      {formatCurrency(report.total_winnings)}
                    </td>
                    <td className="commission-col">
                      {formatCurrency(report.total_commissions)}
                    </td>
                    <td className={`balance-col ${netPL >= 0 ? 'positive' : 'negative'}`}>
                      {formatCurrency(netPL)}
                    </td>
                    <td className="amount-col">
                      {formatCurrency(report.closing_balance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
