// src/components/ManualResolutionPanel.jsx
import { useEffect, useState } from 'react';
import './ManualResolutionPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ManualResolutionPanel() {
  const [loading, setLoading] = useState(false);
  const [pendingGames, setPendingGames] = useState([]);
  const [error, setError] = useState(null);
  const [expandedGameId, setExpandedGameId] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({});
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(() => localStorage.getItem('adminId') || '');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionResult, setActionResult] = useState(null);

  const hasPending = pendingGames.length > 0;

  useEffect(() => {
    loadPendingBets();
  }, []);

  const loadPendingBets = async () => {
    loadPendingGames();
    setError(null);
    setActionResult(null);
  const loadPendingGames = async () => {
      const res = await fetch(`${API_URL}/settlement/pending-manual?limit=50`);
      const data = await res.json();
      if (data.success) {
        setPendingBets(data.data || []);
      const res = await fetch(`${API_URL}/settlement/pending-manual-games?limit=50`);
        setError(data.error || 'No se pudieron cargar las apuestas pendientes');
      }
        setPendingGames(data.data || []);
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadBetDetails = async (betId) => {
    if (betDetails[betId]) return;
    setLoading(true);
  const toggleGame = (gameId) => {
    setExpandedGameId((prev) => (prev === gameId ? null : gameId));
  };

  const handleScoreChange = (gameId, field, value) => {
    const numericValue = value === '' ? null : Number(value);
    setScoreInputs((prev) => {
      const current = prev[gameId] || { homeScore: null, awayScore: null };
      const next = { ...current, [field]: Number.isNaN(numericValue) ? null : numericValue };
      return { ...prev, [gameId]: next };
    });
  };

  const handleResolveGame = async (game) => {
        groups.set(key, {
          key,
          homeTeam: sel.home_team,
          awayTeam: sel.away_team,
          commenceTime: sel.game_commence_time,
          markets: [],
        });
      }
      groups.get(key).markets.push(sel);
    });
    return Array.from(groups.values());
  };

  const handleResolve = async (betId) => {
    setActionResult(null);
    setError(null);

    if (!adminToken) {
      setError('Token de admin requerido');
      return;
    }
    if (!adminId) {
      setError('Admin ID requerido');
      return;
    }

    const scores = scoreInputs[game.game_id];
    if (!scores || scores.homeScore == null || scores.awayScore == null) {
      setError('Debes ingresar el marcador final');
      return;
    }

    const payload = {
      gameId: game.game_id,
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      adminId,
      adminNotes: adminNotes || '',
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/settlement/resolve-manual-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setActionResult(data.message || 'Apuesta resuelta manualmente');
        setAdminNotes('');
        setExpandedGameId(null);
        setScoreInputs((prev) => {
          const next = { ...prev };
          delete next[game.game_id];
          return next;
        });
        await loadPendingGames();
      } else {
        setError(data.error || 'No se pudo resolver la apuesta');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAdmin = () => {
    localStorage.setItem('adminToken', adminToken);
    localStorage.setItem('adminId', adminId);
    setActionResult('Credenciales guardadas');
  };

  return (
    <div className="manual-resolution">
      <div className="content-header">
        <div>
          <h2>🛠️ Resolución Manual por Partido (1h post-partido)</h2>
          <p className="subtitle">
            El sistema agrupa jugadas pendientes por partido 1 hora después del inicio del juego.
          </p>
        </div>
        <button className="secondary-btn" onClick={loadPendingGames} disabled={loading}>
          🔄 Recargar
        </button>
      </div>

      <div className="admin-credentials">
        <div className="credential-field">
          <label>Admin ID</label>
          <input
            type="text"
            value={adminId}
            onChange={(e) => setAdminId(e.target.value)}
            placeholder="admin_user"
          />
        </div>
        <div className="credential-field">
          <label>Admin Token</label>
          <input
            type="password"
            value={adminToken}
            onChange={(e) => setAdminToken(e.target.value)}
            placeholder="Token de admin"
          />
        </div>
        <button className="primary-btn" onClick={handleSaveAdmin}>Guardar</button>
      </div>

      {loading && (
        <div className="alert alert-info">⏳ Cargando...</div>
      )}

      {error && (
        <div className="alert alert-danger">❌ {error}</div>
      )}

      {actionResult && (
        <div className="alert alert-success">✅ {actionResult}</div>
      )}

      {!loading && !hasPending && (
        <div className="empty-state">
          <p>✅ No hay apuestas pendientes para resolución manual</p>
        </div>
      )}

      {hasPending && (
        <div className="pending-list">
          {pendingGames.map((game) => (
            <div key={game.game_id} className="pending-card">
              <div className="pending-header">
                <div>
                  <h3>{game.home_team} vs {game.away_team}</h3>
                  <p className="meta">
                    Inicio: {formatDateTime(game.game_commence_time)} • Jugadas pendientes: {game.pending_count} • Tickets afectados: {game.bet_count}
                  </p>
                </div>
                <button className="secondary-btn" onClick={() => toggleGame(game.game_id)}>
                  {expandedGameId === game.game_id ? 'Cerrar' : 'Resolver'}
                </button>
              </div>

              {expandedGameId === game.game_id && (
                <div className="pending-body">
                  <div className="notes">
                    <label>Notas del admin</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ej: Resultado confirmado en ATP/ESPN"
                    />
                  </div>

                  <div className="game-group">
                    <div className="game-group-header">
                      <div>
                        <strong>Mercados detectados</strong>
                        <div className="selection-time">H2H: {game.h2h_count} • Over/Under: {game.totals_count} • Spread: {game.spreads_count}</div>
                      </div>
                      <span className="market-badge">H2H / Over / Spread</span>
                    </div>

                    <div className="selection-score">
                      <label>Marcador final</label>
                      <div className="score-inputs">
                        <input
                          type="number"
                          placeholder={game.home_team}
                          value={scoreInputs[game.game_id]?.homeScore ?? ''}
                          onChange={(e) => handleScoreChange(game.game_id, 'homeScore', e.target.value)}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          placeholder={game.away_team}
                          value={scoreInputs[game.game_id]?.awayScore ?? ''}
                          onChange={(e) => handleScoreChange(game.game_id, 'awayScore', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="resolve-actions">
                    <button
                      className="primary-btn"
                      onClick={() => handleResolveGame(game)}
                      disabled={loading}
                    >
                      ✅ Resolver partido
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
