// src/components/BetsList.jsx
import { useState, useEffect } from 'react';
import { getBetsForHouse, settleBet } from '../services/b2bApi';
import './BetsList.css';

export default function BetsList({ bettingHouseId }) {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, won, lost

  useEffect(() => {
    if (bettingHouseId) {
      loadBets();
    }
  }, [bettingHouseId, filter]);

  const loadBets = async () => {
    try {
      setLoading(true);
      const response = await getBetsForHouse(bettingHouseId);
      let filteredBets = response.data || [];
      
      if (filter !== 'all') {
        filteredBets = filteredBets.filter(bet => bet.status === filter);
      }
      
      setBets(filteredBets);
      setError(null);
    } catch (err) {
      setError('Error al cargar apuestas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSettleBet = async (betId, status, actualWin) => {
    try {
      await settleBet(betId, status, actualWin);
      loadBets(); // Reload bets after settling
    } catch (err) {
      console.error('Error settling bet:', err);
      alert('Error al liquidar la apuesta');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      won: '#10b981',
      lost: '#ef4444',
      void: '#6b7280',
      cashout: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  if (!bettingHouseId) {
    return (
      <div className="bets-list-empty">
        <p>Selecciona una casa de apuestas para ver sus jugadas</p>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-container">Cargando apuestas...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadBets} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="bets-list">
      <div className="bets-header">
        <h2>Apuestas</h2>
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            Todas
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''}
            onClick={() => setFilter('pending')}
          >
            Pendientes
          </button>
          <button 
            className={filter === 'won' ? 'active' : ''}
            onClick={() => setFilter('won')}
          >
            Ganadas
          </button>
          <button 
            className={filter === 'lost' ? 'active' : ''}
            onClick={() => setFilter('lost')}
          >
            Perdidas
          </button>
        </div>
      </div>

      {bets.length === 0 ? (
        <div className="empty-state">
          <p>No hay apuestas {filter !== 'all' ? filter : ''}</p>
        </div>
      ) : (
        <div className="bets-table-container">
          <table className="bets-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Cuota</th>
                <th>Ganancia Potencial</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bets.map((bet) => (
                <tr key={bet.id}>
                  <td className="ticket-col">
                    <span className="ticket-number">{bet.bet_ticket_number}</span>
                  </td>
                  <td>
                    <span className="bet-type">{bet.bet_type}</span>
                  </td>
                  <td className="amount-col">
                    {formatCurrency(bet.total_stake)}
                  </td>
                  <td className="odds-col">
                    {Number(bet.total_odds).toFixed(2)}
                  </td>
                  <td className="potential-col">
                    {formatCurrency(bet.potential_win)}
                  </td>
                  <td>
                    <span 
                      className="status-badge"
                      style={{ background: getStatusColor(bet.status) }}
                    >
                      {bet.status}
                    </span>
                  </td>
                  <td className="date-col">
                    {formatDate(bet.placed_at)}
                  </td>
                  <td className="actions-col">
                    {bet.status === 'pending' && (
                      <div className="action-buttons">
                        <button
                          className="settle-btn win-btn"
                          onClick={() => handleSettleBet(bet.id, 'won', bet.potential_win)}
                          title="Marcar como ganada"
                        >
                          ✓
                        </button>
                        <button
                          className="settle-btn lose-btn"
                          onClick={() => handleSettleBet(bet.id, 'lost', 0)}
                          title="Marcar como perdida"
                        >
                          ✗
                        </button>
                      </div>
                    )}
                    {bet.status === 'won' && (
                      <span className="win-amount">
                        +{formatCurrency(bet.actual_win)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bets-summary">
        <div className="summary-item">
          <span className="summary-label">Total de apuestas:</span>
          <span className="summary-value">{bets.length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Monto apostado:</span>
          <span className="summary-value">
            {formatCurrency(bets.reduce((sum, bet) => sum + parseFloat(bet.total_stake), 0))}
          </span>
        </div>
      </div>
    </div>
  );
}
