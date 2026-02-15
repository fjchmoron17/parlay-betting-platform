// src/components/PlaceBetForm.jsx
import { useState } from 'react';
import { placeBet } from '../services/b2bApi';
import { useAuth } from '../context/AuthContext';
import './PlaceBetForm.css';

export default function PlaceBetForm({ selectedGames, onSuccess, onCancel }) {
  const { house, refreshHouseData } = useAuth();
  const [formData, setFormData] = useState({
    stake: '',
    betType: selectedGames.length > 1 ? 'parlay' : 'single'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculateTotalOdds = () => {
    return selectedGames.reduce((total, game) => total * game.selectedOdds, 1);
  };

  const calculatePotentialWin = () => {
    const stake = parseFloat(formData.stake) || 0;
    const totalOdds = calculateTotalOdds();
    return stake * totalOdds;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!formData.stake || parseFloat(formData.stake) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }

    if (selectedGames.length === 0) {
      setError('Selecciona al menos un juego');
      return;
    }

    // Validar que todas las selecciones tengan sport_key
    const missingSportKey = selectedGames.some(game => !game.sport_key && !game.sportKey);
    if (missingSportKey) {
      setError('Error: Uno o más juegos seleccionados no tienen sport_key. No se puede crear la apuesta.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const totalOdds = calculateTotalOdds();
      const potentialWin = calculatePotentialWin();
      const ticketNumber = `BET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const betData = {
        betting_house_id: house.id,
        bet_ticket_number: ticketNumber,
        bet_type: formData.betType,
        total_stake: parseFloat(formData.stake),
        total_odds: totalOdds,
        potential_win: potentialWin,
        selections: selectedGames.map(game => ({
          game_id: game.id,
          sport_key: game.sport_key || game.sportKey || game.sport_key_original || game.sportKeyOriginal || 'unknown',
          home_team: game.home_team,
          away_team: game.away_team,
          league: game.league || game.sport_title || game.sportTitle || game.sport_key || game.sportKey || 'OTHER',
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
        onSuccess && onSuccess(response.data);
      } else {
        setError(response.error || 'Error al crear apuesta');
      }
    } catch (err) {
      setError(err.message || 'Error al crear apuesta');
    } finally {
      setLoading(false);
    }
  };

  const totalOdds = calculateTotalOdds();
  const potentialWin = calculatePotentialWin();

  return (
    <div className="place-bet-form">
      <div className="bet-form-header">
        <h3>Crear Apuesta</h3>
        <button onClick={onCancel} className="close-btn" type="button">✕</button>
      </div>

      {error && (
        <div className="bet-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="selections-summary">
        <h4>Selecciones ({selectedGames.length})</h4>
        <div className="selections-list">
          {selectedGames.map((game, index) => (
            <div key={index} className="selection-item">
              <div className="selection-info">
                <span className="selection-teams">
                  {game.home_team} vs {game.away_team}
                </span>
                <span className="selection-pick">
                  {game.selectedTeam} {game.pointSpread ? `(${game.pointSpread})` : ''}
                </span>
              </div>
              <span className="selection-odds">{game.selectedOdds.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bet-inputs">
        <div className="form-group">
          <label htmlFor="betType">Tipo de Apuesta</label>
          <select
            id="betType"
            name="betType"
            value={formData.betType}
            onChange={handleChange}
            disabled={loading || selectedGames.length === 1}
          >
            <option value="single">Simple</option>
            <option value="parlay">Parlay</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="stake">Monto a Apostar</label>
          <input
            type="number"
            id="stake"
            name="stake"
            value={formData.stake}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            disabled={loading}
          />
        </div>

        <div className="bet-calculations">
          <div className="calc-row">
            <span>Cuota Total:</span>
            <span className="calc-value">{totalOdds.toFixed(2)}</span>
          </div>
          <div className="calc-row highlight">
            <span>Ganancia Potencial:</span>
            <span className="calc-value">
              {new Intl.NumberFormat('es-ES', {
                style: 'currency',
                currency: house?.currency || 'USD'
              }).format(potentialWin)}
            </span>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn" disabled={loading}>
            Cancelar
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Apuesta'}
          </button>
        </div>
      </form>
    </div>
  );
}
