// src/components/BetsList.jsx
// v2.1 - Mostrar fecha de evento y estado de selecciones
import { useState, useEffect } from 'react';
import { getBetsForHouse } from '../services/b2bApi';
import './BetsList.css';

export default function BetsList({ bettingHouseId }) {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, won, lost
  const [selectedBet, setSelectedBet] = useState(null); // Para el modal de detalles
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

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
      // Filtrar por estado
      if (filter !== 'all') {
        filteredBets = filteredBets.filter(bet => bet.status === filter);
      }
      // Filtrar por rango de fechas
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        filteredBets = filteredBets.filter(bet => {
          const betDate = new Date(bet.placed_at);
          return betDate >= startDate && betDate <= endDate;
        });
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

  const handlePrintTicket = () => {
    if (!selectedBet) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Ticket ${selectedBet.bet_ticket_number}</title>
        <style>
          body {
            font-family: monospace;
            margin: 0;
            padding: 20px;
            background: white;
          }
          .ticket {
            width: 80mm;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 20px;
            text-align: center;
          }
          .header {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 20px;
            border-bottom: 2px dashed #333;
            padding-bottom: 10px;
          }
          .ticket-number {
            font-size: 14px;
            margin: 10px 0;
          }
          .divider {
            border-bottom: 2px dashed #333;
            margin: 10px 0;
          }
          .selection {
            text-align: left;
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 11px;
          }
          .selection-title {
            font-weight: bold;
            margin-bottom: 5px;
          }
          .summary {
            margin-top: 15px;
            text-align: center;
            font-size: 12px;
          }
          .summary-item {
            margin: 5px 0;
          }
          .summary-label {
            font-weight: bold;
          }
          .footer {
            margin-top: 20px;
            border-top: 2px dashed #333;
            padding-top: 10px;
            font-size: 10px;
          }
          .status {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
            color: #2ecc71;
          }
          @media print {
            body {
              margin: 0;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="header">🎰 TICKET DE APUESTA</div>
          <div class="ticket-number">
            Ticket: <strong>${selectedBet.bet_ticket_number}</strong>
          </div>
          <div class="divider"></div>
          
          <div style="text-align: center; font-weight: bold; margin: 10px 0;">
            ${selectedBet.bet_type === 'parlay' ? 'PARLAY' : 'APUESTA SIMPLE'}
          </div>
          
          <div class="divider"></div>
          
          <div style="margin: 15px 0; text-align: center;">
            <strong>SELECCIONES:</strong>
          </div>
          
          ${selectedBet.selections?.map((sel, idx) => {
            const gameTime = sel.game_commence_time || sel.gameCommenceTime;
            const gameDate = gameTime
              ? new Date(gameTime).toLocaleString('es-ES', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Fecha N/D';

            return `
            <div class="selection">
              <div class="selection-title">${idx + 1}. ${sel.home_team} vs ${sel.away_team}</div>
              <div>Mercado: ${sel.market.toUpperCase()}</div>
              <div>Fecha: ${gameDate}</div>
              <div>Selección: <strong>${sel.selected_team}</strong></div>
              <div>Cuota: <strong>${parseFloat(sel.selected_odds).toFixed(2)}</strong></div>
              ${sel.point_spread !== null ? `<div>Punto: ${sel.point_spread > 0 ? '+' : ''}${sel.point_spread}</div>` : ''}
            </div>
          `;
          }).join('')}
          
          <div class="divider"></div>
          
          <div class="summary">
            <div class="summary-item">
              <span class="summary-label">Monto Apostado:</span> $${parseFloat(selectedBet.total_stake).toFixed(2)}
            </div>
            <div class="summary-item">
              <span class="summary-label">Cuota Total:</span> ${parseFloat(selectedBet.total_odds).toFixed(2)}
            </div>
            <div class="summary-item">
              <span class="summary-label">Ganancia Potencial:</span> $${parseFloat(selectedBet.potential_win).toFixed(2)}
            </div>
            ${selectedBet.status === 'won' ? `
              <div class="summary-item status">
                ✓ GANADO: +$${parseFloat(selectedBet.actual_win).toFixed(2)}
              </div>
            ` : selectedBet.status === 'lost' ? `
              <div class="summary-item" style="color: #e74c3c;">
                ✗ PERDIDO
              </div>
            ` : `
              <div class="summary-item" style="color: #f39c12;">
                PENDIENTE
              </div>
            `}
          </div>
          
          <div class="footer">
            <div>Fecha: ${new Date(selectedBet.placed_at).toLocaleString('es-ES')}</div>
            <div style="margin-top: 10px;">----- CONSERVE SU TICKET -----</div>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
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
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
          <label style={{ fontSize: '13px', color: '#374151' }}>Rango de fechas:</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
          <span style={{ fontSize: '13px', color: '#374151' }}>a</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
            style={{ padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          />
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
                    <div className="action-buttons">
                      <button
                        className="details-btn"
                        onClick={() => setSelectedBet(bet)}
                        title="Ver detalles e imprimir"
                      >
                        👁️ Ver
                      </button>
                    </div>
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

      {/* Modal de Detalles */}
      {selectedBet && (
        <div className="bet-details-modal" onClick={() => setSelectedBet(null)}>
          <div className="bet-details-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedBet(null)}>✕</button>
            
            <div className="modal-header">
              <h3>📋 Detalles de la Apuesta</h3>
              <div className="modal-ticket-number">{selectedBet.bet_ticket_number}</div>
            </div>

            <div className="modal-body">
              {/* Información General */}
              <div className="bet-info-section">
                <div className="info-row">
                  <span className="info-label">Tipo de Apuesta:</span>
                  <span className="info-value">
                    {selectedBet.bet_type === 'parlay' ? '🎯 PARLAY' : '🎲 SIMPLE'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Estado:</span>
                  <span 
                    className="info-value"
                    style={{ 
                      color: 'white',
                      backgroundColor: getStatusColor(selectedBet.status),
                      padding: '6px 12px',
                      borderRadius: '20px',
                      textAlign: 'center'
                    }}
                  >
                    {selectedBet.status.toUpperCase()}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Fecha:</span>
                  <span className="info-value">{formatDate(selectedBet.placed_at)}</span>
                </div>
              </div>

              {/* Selecciones */}
              <div className="selections-section">
                <h4>🎮 Selecciones ({selectedBet.selections?.length || 0})</h4>
                <div className="selections-list">
                  {selectedBet.selections?.map((sel, idx) => {
                    const gameTime = sel.game_commence_time || sel.gameCommenceTime || sel.game_time || sel.commence_time || sel.commenceTime;
                    const selectionStatus = sel.selection_status || sel.selectionStatus;
                    
                    return (
                      <div key={idx} className="selection-detail-item">
                        <div className="selection-number">{idx + 1}</div>
                        <div className="selection-content">
                          <div className="matchup">
                            <strong>{sel.home_team} vs {sel.away_team}</strong>
                            <span className="market-badge">{sel.market.toUpperCase()}</span>
                          </div>
                          
                          {/* Fecha del evento */}
                          <div className="game-date">
                            🗓️ {gameTime
                              ? new Date(gameTime).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Fecha N/D'}
                          </div>
                          
                          <div className="selection-pick">
                            <span className="pick">Selección: <strong>{sel.selected_team}</strong></span>
                            <span className="odds">@ <strong>{parseFloat(sel.selected_odds).toFixed(2)}</strong></span>
                            {sel.point_spread !== null && (
                              <span className="spread">
                                Punto: {sel.point_spread > 0 ? '+' : ''}{sel.point_spread}
                              </span>
                            )}
                          </div>
                          
                          {/* Estado de la selección */}
                          {selectionStatus && selectionStatus !== 'pending' && (
                            <div className={`selection-status status-${selectionStatus}`}>
                              {selectionStatus === 'won' && '✓ Ganó'}
                              {selectionStatus === 'lost' && '✗ Perdió'}
                              {selectionStatus === 'void' && '⊘ Anulada'}
                            </div>
                          )}
                          
                          {sel.league && <div className="league">{sel.league}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Resumen Financiero */}
              <div className="financial-section">
                <h4>💰 Resumen</h4>
                <div className="financial-items">
                  <div className="financial-item">
                    <span>Monto Apostado:</span>
                    <span className="amount">{formatCurrency(selectedBet.total_stake)}</span>
                  </div>
                  <div className="financial-item">
                    <span>Cuota Total:</span>
                    <span className="amount">{parseFloat(selectedBet.total_odds).toFixed(2)}x</span>
                  </div>
                  <div className="financial-item highlight">
                    <span>Ganancia Potencial:</span>
                    <span className="amount" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                      {formatCurrency(selectedBet.potential_win)}
                    </span>
                  </div>
                  {selectedBet.status === 'won' && (
                    <div className="financial-item" style={{ borderTop: '2px solid #2ecc71', paddingTop: '10px' }}>
                      <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>✓ Ganancia Real:</span>
                      <span className="amount" style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                        {formatCurrency(selectedBet.actual_win)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="print-btn"
                onClick={handlePrintTicket}
              >
                🖨️ Imprimir Ticket
              </button>
              <button 
                className="close-btn"
                onClick={() => setSelectedBet(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
