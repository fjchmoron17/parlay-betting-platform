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
  const [expandedGameKey, setExpandedGameKey] = useState(null);
  const [scoreInputs, setScoreInputs] = useState({});
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(() => localStorage.getItem('adminId') || '');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionResult, setActionResult] = useState(null);
  const [onlyOverdue, setOnlyOverdue] = useState(true);

  const hasPending = pendingGames.length > 0;

  useEffect(() => {
    loadPendingGames();
  }, [onlyOverdue]);

  const loadPendingGames = async () => {
    setLoading(true);
    setError(null);
    setActionResult(null);
    try {
      const res = await fetch(`${API_URL}/settlement/pending-manual-games?limit=50&onlyOverdue=${onlyOverdue}`);
      const data = await res.json();
      if (data.success) {
        setPendingGames(data.data || []);
      } else {
        setError(data.error || 'No se pudieron cargar las apuestas pendientes');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const toggleGame = (gameKey) => {
    setExpandedGameKey((prev) => (prev === gameKey ? null : gameKey));
  };

  const parseSets = (value) => {
    if (!value) return null;
    const sets = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (sets.length === 0) return null;
    let homeGames = 0;
    let awayGames = 0;
    let homeSets = 0;
    let awaySets = 0;
    for (const set of sets) {
      const parts = set.split(/[-:]/).map((p) => p.trim());
      if (parts.length !== 2) return null;
      const home = Number(parts[0]);
      const away = Number(parts[1]);
      if (Number.isNaN(home) || Number.isNaN(away)) return null;
      homeGames += home;
      awayGames += away;
      if (home > away) homeSets += 1;
      if (away > home) awaySets += 1;
    }
    return { homeGames, awayGames, homeSets, awaySets };
  };

  const handleScoreChange = (gameKey, value) => {
    setScoreInputs((prev) => {
      const current = prev[gameKey] || { homeScore: null, awayScore: null, setsScore: '' };
      const next = { ...current, setsScore: value };
      const parsed = parseSets(value);
      next.homeScore = parsed ? parsed.homeGames : null;
      next.awayScore = parsed ? parsed.awayGames : null;
      next.setsSummary = parsed ? `${parsed.homeSets}-${parsed.awaySets}` : null;
      next.totalGames = parsed ? parsed.homeGames + parsed.awayGames : null;
      return { ...prev, [gameKey]: next };
    });
  };

  const handleResolveGame = async (game) => {
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

    const scores = scoreInputs[game.game_key];
    if (!scores || !scores.setsScore) {
      setError('Debes ingresar el marcador por sets (ej: 6-4, 3-6, 7-6)');
      return;
    }

    const payload = {
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      gameCommenceTime: game.game_commence_time,
      homeScore: scores.homeScore,
      awayScore: scores.awayScore,
      setsScore: scores.setsScore,
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
        setExpandedGameKey(null);
        setScoreInputs((prev) => {
          const next = { ...prev };
          delete next[game.game_key];
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
          <h2>🛠️ Resolución Manual por Partido</h2>
          <p className="subtitle">
            El sistema agrupa cualquier jugada pendiente por partido cuando la API no resuelve.
          </p>
        </div>
        <div className="header-actions">
          <label className="toggle-filter">
            <input
              type="checkbox"
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
            />
            Solo &gt; 1h desde inicio
          </label>
          <button className="secondary-btn" onClick={loadPendingGames} disabled={loading}>
            🔄 Recargar
          </button>
        </div>
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
            <div key={game.game_key} className="pending-card">
              <div className="pending-header">
                <div>
                  <h3>{game.home_team} vs {game.away_team}</h3>
                  <p className="meta">
                    Inicio: {formatDateTime(game.game_commence_time)} • Jugadas pendientes: {game.pending_count} • Tickets afectados: {game.bet_count}
                  </p>
                </div>
                <button className="secondary-btn" onClick={() => toggleGame(game.game_key)}>
                  {expandedGameKey === game.game_key ? 'Cerrar' : 'Resolver'}
                </button>
              </div>

              {expandedGameKey === game.game_key && (
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
                      <label>Marcador por sets (tenis)</label>
                      <input
                        type="text"
                        placeholder="6-4, 3-6, 7-6"
                        value={scoreInputs[game.game_key]?.setsScore ?? ''}
                        onChange={(e) => handleScoreChange(game.game_key, e.target.value)}
                      />
                      <div className="score-hint">
                        Juegos totales: {scoreInputs[game.game_key]?.totalGames ?? '-'} • Sets: {scoreInputs[game.game_key]?.setsSummary ?? '-'}
                      </div>
                    </div>

                    <div className="selection-score">
                      <label>Marcador final (games)</label>
                      <div className="score-inputs">
                        <input
                          type="number"
                          placeholder={game.home_team}
                          value={scoreInputs[game.game_key]?.homeScore ?? ''}
                          readOnly
                        />
                        <span>-</span>
                        <input
                          type="number"
                          placeholder={game.away_team}
                          value={scoreInputs[game.game_key]?.awayScore ?? ''}
                          readOnly
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
