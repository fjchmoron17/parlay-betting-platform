// src/pages/HousePortal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { placeBet } from '../services/b2bApi';
import BetsList from '../components/BetsList';
import DailyReports from '../components/DailyReports';
import Home from './Home';
import FilterPanel from '../components/FilterPanel';
import './HousePortal.css';

export default function HousePortal() {
  const { user, house, logout, refreshHouseData } = useAuth();
  const [activeView, setActiveView] = useState('betting'); // betting, bets, reports
  const [selectedGames, setSelectedGames] = useState([]);
  const [stakeAmount, setStakeAmount] = useState('');
  const [potentialWin, setPotentialWin] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para filtros (movidos desde Home.jsx)
  const [filters, setFilters] = useState({
    sport: '',
    region: 'us'
  });

  // Recalcular ganancia potencial automáticamente cuando cambien selecciones o monto
  useEffect(() => {
    const stake = parseFloat(stakeAmount) || 0;
    const totalOdds = calculateTotalOdds();
    const potential = stake * totalOdds;
    setPotentialWin(potential);
  }, [selectedGames, stakeAmount]);

  // Auto-cerrar mensajes de error después de 5 segundos
  useEffect(() => {
    if (!error) return;
    const timeoutId = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeoutId);
  }, [error]);

  // Validar si se puede agregar una selección según las reglas de combinación de mercados
  const canAddSelection = (newGame, currentSelections) => {
    // Buscar si ya hay selecciones del mismo juego
    const sameGameSelections = currentSelections.filter(g => g.id === newGame.id);
    
    if (sameGameSelections.length === 0) {
      // No hay selecciones del mismo juego, se puede agregar
      return { allowed: true, message: '' };
    }

    // Si ya hay una selección idéntica (mismo juego, equipo y mercado), es para removerla
    const exactMatch = sameGameSelections.find(g => 
      g.selectedTeam === newGame.selectedTeam && g.market === newGame.market
    );
    if (exactMatch) {
      return { allowed: true, message: '' };
    }

    // Verificar combinaciones permitidas
    const existingMarkets = sameGameSelections.map(g => g.market);
    const newMarket = newGame.market;

    // Reglas permitidas:
    // 1. h2h + totals
    // 2. spreads + totals
    const allowedCombinations = [
      ['h2h', 'totals'],
      ['spreads', 'totals']
    ];

    // Verificar si la combinación es válida
    for (const combo of allowedCombinations) {
      if (combo.includes(newMarket)) {
        const otherMarket = combo.find(m => m !== newMarket);
        if (existingMarkets.includes(otherMarket)) {
          // Si solo hay una selección y es del mercado compatible
          if (sameGameSelections.length === 1 && existingMarkets[0] === otherMarket) {
            return { allowed: true, message: '' };
          }
        }
      }
    }

    // Si llegamos aquí, la combinación no está permitida
    const marketNames = {
      'h2h': 'Ganador',
      'spreads': 'Spread',
      'totals': 'Totales'
    };
    return { 
      allowed: false, 
      message: `No puedes combinar ${marketNames[newMarket] || newMarket} con ${existingMarkets.map(m => marketNames[m] || m).join(', ')} del mismo juego.\n\nCombinaciones permitidas:\n• Ganador + Totales\n• Spread + Totales` 
    };
  };

  const handleGameSelection = (game) => {
    // Verificar si se puede agregar la selección
    const validation = canAddSelection(game, selectedGames);
    
    if (!validation.allowed) {
      setError(validation.message);
      return;
    }

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
        setError(null); // Limpiar error al agregar exitosamente
        return [...prev, game];
      }
    });
  };

  const handleRemoveSelection = (selection) => {
    setSelectedGames(prev => prev.filter(g => 
      !(g.id === selection.id && g.selectedTeam === selection.selectedTeam && g.market === selection.market)
    ));
  };

  const calculateTotalOdds = () => {
    if (selectedGames.length === 0) return 0;
    return selectedGames.reduce((total, game) => total * game.selectedOdds, 1);
  };

  const handleStakeChange = (e) => {
    const value = e.target.value;
    setStakeAmount(value);
    setError(null);
  };

  const handlePlaceBet = async () => {
    if (selectedGames.length === 0) {
      setError('Selecciona al menos un juego para apostar');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Ingresa un monto válido para apostar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const totalOdds = calculateTotalOdds();
      const potentialWinAmount = parseFloat(stakeAmount) * totalOdds;
      const ticketNumber = `BET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const betType = selectedGames.length > 1 ? 'parlay' : 'single';

      const betData = {
        betting_house_id: house.id,
        bet_ticket_number: ticketNumber,
        bet_type: betType,
        total_stake: parseFloat(stakeAmount),
        total_odds: totalOdds,
        potential_win: potentialWinAmount,
        selections: selectedGames.map(game => ({
          game_id: game.id,
          home_team: game.home_team,
          away_team: game.away_team,
          league: game.sport_key || game.sport_title || game.sportTitle || game.league || 'OTHER',
          market: game.market,
          selected_team: game.selectedTeam,
          selected_odds: game.selectedOdds,
          point_spread: game.pointSpread || null,
          bookmaker: game.bookmaker,
          game_commence_time: game.game_commence_time || game.game_time
        }))
      };

      const response = await placeBet(betData);

      if (response.success) {
        await refreshHouseData(); // Actualizar balance
        alert(`✅ Apuesta creada exitosamente!\n\nTicket: ${ticketNumber}\nMonto: ${formatCurrency(parseFloat(stakeAmount))}\nGanancia Potencial: ${formatCurrency(potentialWinAmount)}`);
        
        // Limpiar formulario
        setSelectedGames([]);
        setStakeAmount('');
        setPotentialWin(0);
        setActiveView('bets'); // Ir a ver las apuestas
      } else {
        setError(response.error || 'Error al crear apuesta');
      }
    } catch (err) {
      setError(err.message || 'Error al crear apuesta');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
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

      {/* Sticky Filters and Error Banner */}
      {activeView === 'betting' && (
        <div className="sticky-top-bar">
          <FilterPanel 
            filters={filters}
            onFilterChange={handleFilterChange}
          />
          {error && (
            <div className="bet-error-top" role="alert">
              <div className="bet-error__content">⚠️ {error}</div>
              <button
                type="button"
                className="bet-error__close"
                onClick={() => setError(null)}
                aria-label="Cerrar mensaje"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="portal-content">
        {activeView === 'betting' && (
          <div className="betting-view">
            <div className="betting-layout">
              <div className="games-section">
                <Home 
                  onGameSelect={handleGameSelection}
                  selectedGames={selectedGames}
                  bettingMode={true}
                  filters={filters}
                />
              </div>
              {selectedGames.length > 0 && (
                <div className="selection-sidebar">
                  <div className="selection-panel">
                <div className="selection-header">
                  <div>
                    <p className="selection-title">Selecciones actuales</p>
                    <p className="selection-subtitle">{selectedGames.length} selección(es) • {selectedGames.length > 1 ? 'Parlay' : 'Apuesta Simple'}</p>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedGames([]);
                      setStakeAmount('');
                      setPotentialWin(0);
                      setError(null);
                    }}
                    className="clear-btn"
                  >
                    Vaciar Todo
                  </button>
                </div>

                <div className="selection-list">
                  {selectedGames.map((sel, idx) => (
                    <div key={`${sel.id}-${sel.market}-${sel.selectedTeam}-${idx}`} className="selection-item">
                      <div className="selection-main">
                        <div className="selection-matchup">
                          <span className="selection-teams">{sel.home_team} vs {sel.away_team}</span>
                          <span className="selection-market">{sel.market.toUpperCase()}</span>
                        </div>
                        <div className="selection-date">
                          🗓️ {(() => {
                            const gameTime = sel.game_commence_time || sel.game_time || sel.commence_time || sel.commenceTime;
                            return gameTime
                              ? new Date(gameTime).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Fecha N/D';
                          })()}
                        </div>
                        <div className="selection-pick">
                          <span className="selection-team">{sel.selectedTeam}</span>
                          {sel.pointSpread !== null && sel.pointSpread !== undefined && (
                            <span className="selection-spread">{sel.pointSpread > 0 ? '+' : ''}{sel.pointSpread}</span>
                          )}
                          <span className="selection-odds">@{sel.selectedOdds?.toFixed ? sel.selectedOdds.toFixed(2) : sel.selectedOdds}</span>
                        </div>
                      </div>
                      <button
                        className="remove-selection"
                        onClick={() => handleRemoveSelection(sel)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Sección de monto y crear apuesta */}
                <div className="bet-input-section" style={{
                  marginTop: '20px',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <label style={{ fontWeight: '600', fontSize: '14px' }}>
                        💰 Monto a Apostar
                      </label>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#666',
                        backgroundColor: '#fff',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}>
                        Cuota Total: {calculateTotalOdds().toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={handleStakeChange}
                      placeholder="Ingresa el monto..."
                      min="0"
                      step="0.01"
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid #ddd',
                        borderRadius: '8px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                      disabled={loading}
                    />
                  </div>

                  {potentialWin > 0 && (
                    <div style={{
                      padding: '16px',
                      backgroundColor: '#e8f5e9',
                      borderRadius: '8px',
                      marginBottom: '16px',
                      border: '2px solid #4CAF50'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <span style={{ fontWeight: '600', color: '#2e7d32' }}>
                          🎯 Ganancia Potencial:
                        </span>
                        <span style={{ 
                          fontSize: '24px', 
                          fontWeight: 'bold',
                          color: '#2e7d32'
                        }}>
                          {formatCurrency(potentialWin)}
                        </span>
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#558b2f',
                        marginTop: '8px',
                        textAlign: 'right'
                      }}>
                        Ganancia neta: {formatCurrency(potentialWin - parseFloat(stakeAmount || 0))}
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handlePlaceBet}
                    disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}
                    className="create-bet-btn"
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      backgroundColor: loading ? '#ccc' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: (!stakeAmount || parseFloat(stakeAmount) <= 0) ? 0.5 : 1
                    }}
                  >
                    {loading ? '⏳ Creando apuesta...' : '✅ Crear Apuesta'}
                  </button>
                </div>
              </div>
                </div>
              )}
            </div>
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
