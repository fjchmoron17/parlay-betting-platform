// src/pages/HousePortal.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import BetsList from '../components/BetsList';
import DailyReports from '../components/DailyReports';
import Home from './Home';
import PlaceBetForm from '../components/PlaceBetForm';
import './HousePortal.css';

export default function HousePortal() {
  const { user, house, logout } = useAuth();
  const [activeView, setActiveView] = useState('betting'); // betting, bets, reports
  const [selectedGames, setSelectedGames] = useState([]);
  const [showBetForm, setShowBetForm] = useState(false);

  const handleGameSelection = (game) => {
    // Agregar/remover juego de la selección
    setSelectedGames(prev => {
      const exists = prev.find(g => 
        g.id === game.id && g.selectedTeam === game.selectedTeam && g.market === game.market
      );
      
      if (exists) {
        return prev.filter(g => 
          !(g.id === game.id && g.selectedTeam === game.selectedTeam && g.market === game.market)
        );
      } else {
        return [...prev, game];
      }
    });
  };

  const handlePlaceBet = () => {
    if (selectedGames.length === 0) {
      alert('Selecciona al menos un juego para apostar');
      return;
    }
    setShowBetForm(true);
  };

  const handleBetSuccess = (bet) => {
    setShowBetForm(false);
    setSelectedGames([]);
    alert(`Apuesta creada: ${bet.bet_ticket_number}`);
    setActiveView('bets');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: house?.currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="house-portal">
      {/* Header */}
      <div className="portal-header">
        <div className="header-left">
          <h1>🎰 {house?.name}</h1>
          <div className="house-info-chips">
            <span className="info-chip">
              💰 Balance: {formatCurrency(house?.account_balance)}
            </span>
            <span className="info-chip">
              🌍 {house?.country}
            </span>
            <span className="info-chip">
              👤 {user?.username}
            </span>
          </div>
        </div>
        <button onClick={logout} className="logout-btn">
          Cerrar Sesión
        </button>
      </div>

      {/* Navigation */}
      <div className="portal-nav">
        <button
          className={activeView === 'betting' ? 'active' : ''}
          onClick={() => setActiveView('betting')}
        >
          🎲 Apostar
        </button>
        <button
          className={activeView === 'bets' ? 'active' : ''}
          onClick={() => setActiveView('bets')}
        >
          📋 Mis Apuestas
        </button>
        <button
          className={activeView === 'reports' ? 'active' : ''}
          onClick={() => setActiveView('reports')}
        >
          📊 Reportes
        </button>
      </div>

      {/* Content */}
      <div className="portal-content">
        {activeView === 'betting' && (
          <div className="betting-view">
            {showBetForm ? (
              <PlaceBetForm
                selectedGames={selectedGames}
                onSuccess={handleBetSuccess}
                onCancel={() => setShowBetForm(false)}
              />
            ) : (
              <>
                {selectedGames.length > 0 && (
                  <div className="selection-bar">
                    <div className="selection-info">
                      <span className="selection-count">
                        {selectedGames.length} selección(es)
                      </span>
                      <button 
                        onClick={() => setSelectedGames([])}
                        className="clear-btn"
                      >
                        Limpiar
                      </button>
                    </div>
                    <button onClick={handlePlaceBet} className="create-bet-btn">
                      Crear Apuesta
                    </button>
                  </div>
                )}
                <Home 
                  onGameSelect={handleGameSelection}
                  selectedGames={selectedGames}
                  bettingMode={true}
                />
              </>
            )}
          </div>
        )}

        {activeView === 'bets' && (
          <div className="bets-view">
            <BetsList bettingHouseId={house?.id} />
          </div>
        )}

        {activeView === 'reports' && (
          <div className="reports-view">
            <DailyReports 
              bettingHouseId={house?.id}
              houseName={house?.name}
            />
          </div>
        )}
      </div>
    </div>
  );
}
