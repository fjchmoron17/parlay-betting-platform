// src/pages/HousePortal.jsx
import { useState, useEffect } from 'react';
import ToastNotification from '../components/ToastNotification';
import { useAuth } from '../context/AuthContext';
import { placeBet } from '../services/b2bApi';
import BetsList from '../components/BetsList';
import DailyReports from '../components/DailyReports';
import Home from './Home';
import ParlayPanel from '../components/ParlayPanel';
import FilterPanel from '../components/FilterPanel';
import './HousePortal.css';
import '../components/PlaceBetForm.css';

export default function HousePortal() {
    // Cambio de contraste y despliegue forzado - 2026-02-08
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

  // Log para depurar el estado actualizado de selectedGames
  useEffect(() => {
    console.log('[LOG] selectedGames actualizado:', selectedGames);
  }, [selectedGames]);

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

    // Mensaje de error original del branch estable
    const marketNames = {
      'h2h': 'Ganador',
      'spreads': 'Spread',
      'totals': 'Totales'
    };
    // Si la combinación es h2h + spreads (no permitida)
    if ((existingMarkets.includes('h2h') && newMarket === 'spreads') || (existingMarkets.includes('spreads') && newMarket === 'h2h')) {
      return {
        allowed: false,
        message: 'No puedes combinar Ganador y Spread del mismo partido.\n\nSolo puedes combinar:\n• Ganador + Totales\n• Spread + Totales'
      };
    }
    // Mensaje genérico para otras combinaciones no permitidas
    return {
      allowed: false,
      message: `No puedes combinar ${marketNames[newMarket] || newMarket} con ${existingMarkets.map(m => marketNames[m] || m).join(', ')} del mismo juego.\n\nCombinaciones permitidas:\n• Ganador + Totales\n• Spread + Totales`
    };
  };

  const handleGameSelection = (game) => {
    console.log('[LOG] Selección recibida:', game);
    // Verificar si se puede agregar la selección
    const validation = canAddSelection(game, selectedGames);
    if (!validation.allowed) {
      console.log('[LOG] Selección bloqueada por validación:', validation.message);
      setError(validation.message);
      return;
    }
    setSelectedGames(prev => {
      const exists = prev.find(g => 
        g.id === game.id && g.selectedTeam === game.selectedTeam && g.market === game.market
      );
      if (exists) {
        const filtered = prev.filter(g => 
          !(g.id === game.id && g.selectedTeam === game.selectedTeam && g.market === game.market)
        );
        console.log('[LOG] Jugada removida. Estado actual:', filtered);
        return filtered;
      } else {
        setError(null);
        const added = [...prev, game];
        console.log('[LOG] Jugada agregada. Estado actual:', added);
        return added;
      }
    });
    setTimeout(() => {
      console.log('[LOG] Estado final selectedGames:', selectedGames);
    }, 100);
  };

  const handleRemoveSelection = (selection) => {
    setSelectedGames(prev => {
      const filtered = prev.filter(g => 
        !(g.id === selection.id && g.selectedTeam === selection.selectedTeam && g.market === selection.market)
      );
      console.log('[LOG] Jugada removida desde panel. Estado actual:', filtered);
      return filtered;
    });
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
          game_commence_time: game.game_commence_time || game.game_time || game.commence_time || game.commenceTime
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
      {/* Toast Notification for errors */}
      <ToastNotification message={error} onClose={() => setError(null)} />
      {/* Header */}
      <div className="portal-header">
        <div className="header-left">
          <h1>🎰 {house?.name}</h1>
          <div className="house-info-chips">
            <span className="info-chip">💰 Balance: {formatCurrency(house?.account_balance)}</span>
            <span className="info-chip">🌍 {house?.country}</span>
            <span className="info-chip">👤 {user?.username}</span>
          </div>
        </div>
        <button onClick={logout} className="logout-btn">Cerrar Sesión</button>
      </div>

      {/* Menú de navegación restaurado */}
      <nav className="portal-nav">
        <button
          className={activeView === 'betting' ? 'active' : ''}
          onClick={() => setActiveView('betting')}
        >🎯 Apostar</button>
        <button
          className={activeView === 'bets' ? 'active' : ''}
          onClick={() => setActiveView('bets')}
        >📄 Mis Jugadas</button>
        <button
          className={activeView === 'reports' ? 'active' : ''}
          onClick={() => setActiveView('reports')}
        >📊 Reportes</button>
      </nav>

      <div className="main-content">
        {activeView === 'betting' && (
          <div className="betting-view">
            <div className="betting-columns" style={{ display: 'flex', alignItems: 'flex-start', gap: '32px' }}>
              <div className="games-column" style={{ flex: 2 }}>
                <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
                <Home
                  filters={filters}
                  bettingMode={true}
                  selectedGames={selectedGames}
                  onGameSelect={handleGameSelection}
                />
              </div>
              <div className="selection-sidebar" style={{ flex: 1, minWidth: 340 }}>
                {/* Panel de apuestas original eliminado */}
                {/* ParlayPanel eliminado, todo queda en Selecciones actuales */}
                {/* Sidebar de selecciones y formulario de apuesta */}
                {selectedGames.length > 0 && (
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
                      >Vaciar Todo</button>
                    </div>
                    <div className="selection-list">
                      {selectedGames.map((sel, idx) => (
                        <div key={`${sel.id}-${sel.market}-${sel.selectedTeam}-${idx}`} className="selection-item">
                          <div className="selection-info">
                            <span className="selection-teams">
                              {sel.home_team} vs {sel.away_team}
                            </span>
                            <span className="selection-pick">
                              {sel.selectedTeam} {sel.pointSpread ? `(${sel.pointSpread})` : ''}
                            </span>
                            <span className="selection-pick">
                              {sel.league || sel.sportTitle || 'N/A'} • {sel.market ? sel.market.toUpperCase() : ''}
                            </span>
                            {sel.game_commence_time && (
                              <span className="selection-pick">
                                🗓️ {new Date(sel.game_commence_time).toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <span className="selection-odds">{sel.selectedOdds?.toFixed ? sel.selectedOdds.toFixed(2) : sel.selectedOdds}</span>
                          <button onClick={() => handleRemoveSelection(sel)} className="remove-selection" type="button">✖</button>
                        </div>
                      ))}
                    </div>
                    <div className="bet-inputs">
                      <div className="form-group">
                        <label htmlFor="stake">Monto a Apostar</label>
                        <input
                          type="number"
                          id="stake"
                          name="stake"
                          value={stakeAmount}
                          onChange={handleStakeChange}
                          placeholder="0.00"
                          step="0.01"
                          min="0.01"
                          disabled={loading}
                        />
                      </div>
                      <div className="bet-calculations">
                        <div className="calc-row">
                          <span>Cuota Total:</span>
                          <span className="calc-value">{calculateTotalOdds().toFixed(2)}</span>
                        </div>
                        <div className="calc-row highlight">
                          <span>Ganancia Potencial:</span>
                          <span className="calc-value">{formatCurrency(potentialWin)}</span>
                        </div>
                      </div>
                      <div className="form-actions">
                        <button type="button" onClick={() => {
                          setSelectedGames([]);
                          setStakeAmount('');
                          setPotentialWin(0);
                          setError(null);
                        }} className="cancel-btn" disabled={loading}>
                          Cancelar
                        </button>
                        <button onClick={handlePlaceBet} className="submit-btn" disabled={loading || !stakeAmount || parseFloat(stakeAmount) <= 0}>
                          {loading ? 'Creando...' : 'Crear Apuesta'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
            <DailyReports bettingHouseId={house?.id} houseName={house?.name} />
          </div>
        )}
      </div>
    </div>
  );
}
