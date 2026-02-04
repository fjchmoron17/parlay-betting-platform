import React from "react";

const BetTicket = ({ bet, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    onClose();
  };

  if (!bet) return null;

  const totalOdds = bet.selections.reduce((acc, sel) => acc * sel.odds, 1).toFixed(2);
  const betAmount = bet.amount || 100;
  const potentialWinnings = (betAmount * totalOdds - betAmount).toFixed(2);
  const totalReturn = (betAmount * totalOdds).toFixed(2);

  return (
    <div className="bet-ticket-overlay" onClick={handleClose}>
      <div className="bet-ticket-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ticket-header">
          <h2 className="ticket-title">🎰 PARLAY BETS</h2>
          <button className="ticket-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Ticket Info */}
        <div className="ticket-info">
          <div className="ticket-row">
            <span className="ticket-label">Ticket #:</span>
            <span className="ticket-value">{bet.id}</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-label">Fecha:</span>
            <span className="ticket-value">{new Date(bet.createdAt).toLocaleString()}</span>
          </div>
          <div className="ticket-row">
            <span className="ticket-label">Estado:</span>
            <span className="ticket-value badge badge-info">✓ Confirmado</span>
          </div>
        </div>

        {/* Selections */}
        <div className="ticket-selections">
          <h3 className="ticket-section-title">Selecciones ({bet.selections.length})</h3>
          
          {bet.selections.map((selection, index) => {
            // Determinar el estado de la selección si está disponible
            const selectionStatus = selection.selection_status || selection.selectionStatus;
            const gameTime = selection.game_commence_time || selection.gameCommenceTime || selection.game_time || selection.commence_time || selection.commenceTime;
            
            return (
              <div key={index} className={`ticket-selection-item ${selectionStatus ? `status-${selectionStatus}` : ''}`}>
                <div className="selection-number">#{index + 1}</div>
                <div className="selection-details">
                  <p className="selection-match">
                    {selection.homeTeam || selection.home_team} vs {selection.awayTeam || selection.away_team}
                  </p>
                  <p className="selection-meta">
                    {selection.league} • {selection.market}
                    <span className="game-time"> • {gameTime
                      ? new Date(gameTime).toLocaleDateString('es-ES', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Fecha N/D'}
                    </span>
                  </p>
                  {selectionStatus && selectionStatus !== 'pending' && (
                    <p className="selection-result">
                      {selectionStatus === 'won' && <span className="result-won">✓ Ganó</span>}
                      {selectionStatus === 'lost' && <span className="result-lost">✗ Perdió</span>}
                      {selectionStatus === 'void' && <span className="result-void">⊘ Anulada</span>}
                    </p>
                  )}
                </div>
                <div className="selection-bet">
                  <p className="selection-team">{selection.team || selection.selected_team}</p>
                  <p className="selection-odds">@{selection.odds || selection.selected_odds}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="ticket-summary">
          <div className="summary-row">
            <span>Monto de Apuesta:</span>
            <span className="summary-value">${betAmount.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Cuota Combinada:</span>
            <span className="summary-value">{totalOdds}x</span>
          </div>
          <div className="summary-row">
            <span>Ganancia Potencial:</span>
            <span className="summary-value highlight">${potentialWinnings}</span>
          </div>
          <div className="summary-row total">
            <span>Retorno Total:</span>
            <span className="summary-value">${totalReturn}</span>
          </div>
        </div>

        {/* Terms */}
        <div className="ticket-terms">
          <p className="terms-text">
            ✓ Esta apuesta es válida solo para hoy<br />
            ✓ Sujeto a términos y condiciones<br />
            ✓ Conserve este boleto para canjear premios
          </p>
        </div>

        {/* Actions */}
        <div className="ticket-actions">
          <button onClick={handlePrint} className="btn btn-primary">
            🖨️ Imprimir Ticket
          </button>
          <button onClick={handleClose} className="btn btn-secondary">
            ✕ Cerrar
          </button>
        </div>

        {/* Footer */}
        <div className="ticket-footer">
          <p>© 2026 Parlay Bets | Todos los derechos reservados</p>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .bet-ticket-container,
          .bet-ticket-container * {
            visibility: visible;
          }
          .bet-ticket-overlay {
            position: static;
            background: white;
          }
          .bet-ticket-container {
            position: static;
            box-shadow: none;
            max-width: 100%;
            padding: 0;
          }
          .ticket-close-btn,
          .ticket-actions {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default BetTicket;
