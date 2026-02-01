// src/components/ManualResolutionPanel.jsx
import { useEffect, useMemo, useState } from 'react';
import './ManualResolutionPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

const marketLabel = (market) => {
  if (market === 'h2h') return 'Head to Head';
  if (market === 'totals') return 'Over/Under';
  if (market === 'spreads') return 'Spread';
  return market || 'Market';
};

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
  const [pendingBets, setPendingBets] = useState([]);
  const [error, setError] = useState(null);
  const [expandedBetId, setExpandedBetId] = useState(null);
  const [betDetails, setBetDetails] = useState({});
  const [resolutions, setResolutions] = useState({});
  const [scoreInputs, setScoreInputs] = useState({});
  const [auditLoaded, setAuditLoaded] = useState({});
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(() => localStorage.getItem('adminId') || '');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionResult, setActionResult] = useState(null);

  const hasPending = pendingBets.length > 0;

  useEffect(() => {
    loadPendingBets();
  }, []);

  const loadPendingBets = async () => {
    setLoading(true);
    setError(null);
    setActionResult(null);
    try {
      const res = await fetch(`${API_URL}/settlement/pending-manual?limit=50`);
      const data = await res.json();
      if (data.success) {
        setPendingBets(data.data || []);
      } else {
        setError(data.error || 'No se pudieron cargar las apuestas pendientes');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadBetDetails = async (betId) => {
    if (betDetails[betId]) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/bets-db/detail/${betId}`);
      const data = await res.json();
      if (data.success) {
        setBetDetails((prev) => ({ ...prev, [betId]: data.data }));
        setResolutions((prev) => {
          const next = { ...prev };
          data.data?.selections?.forEach((sel) => {
            if (!next[sel.id] && sel.selection_status && sel.selection_status !== 'pending') {
              next[sel.id] = sel.selection_status;
            }
          });
          return next;
        });
        setScoreInputs((prev) => {
          const next = { ...prev };
          data.data?.selections?.forEach((sel) => {
            if (!next[sel.id] && (sel.home_score != null || sel.away_score != null || sel.final_score)) {
              next[sel.id] = {
                homeScore: sel.home_score ?? null,
                awayScore: sel.away_score ?? null,
                finalScore: sel.final_score ?? null,
              };
            }
          });
          return next;
        });
      } else {
        setError(data.error || 'No se pudo cargar el detalle de la apuesta');
      }
    } catch (err) {
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogScores = async (betId) => {
    if (auditLoaded[betId]) return;
    try {
      const res = await fetch(`${API_URL}/settlement/audit-log?betId=${betId}&limit=200`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const latestScores = {};
        data.data.forEach((entry) => {
          if (!entry.selection_id) return;
          const hasScore = entry.home_score != null || entry.away_score != null || entry.final_score;
          if (!hasScore) return;
          if (!latestScores[entry.selection_id]) {
            latestScores[entry.selection_id] = {
              homeScore: entry.home_score ?? null,
              awayScore: entry.away_score ?? null,
              finalScore: entry.final_score ?? null,
            };
          }
        });
        if (Object.keys(latestScores).length > 0) {
          setScoreInputs((prev) => ({ ...prev, ...latestScores }));
        }
      }
      setAuditLoaded((prev) => ({ ...prev, [betId]: true }));
    } catch (err) {
      console.error('Error loading audit log scores:', err);
    }
  };

  const toggleBet = async (betId) => {
    const nextId = expandedBetId === betId ? null : betId;
    setExpandedBetId(nextId);
    if (nextId) {
      await loadBetDetails(betId);
      await loadAuditLogScores(betId);
    }
  };

  const handleResolutionChange = (selectionId, result) => {
    setResolutions((prev) => ({
      ...prev,
      [selectionId]: result,
    }));
  };

  const handleScoreChange = (selectionId, field, value) => {
    const numericValue = value === '' ? null : Number(value);
    setScoreInputs((prev) => {
      const current = prev[selectionId] || { homeScore: null, awayScore: null, finalScore: null };
      const next = { ...current, [field]: Number.isNaN(numericValue) ? null : numericValue };
      const hasBoth = next.homeScore != null && next.awayScore != null;
      next.finalScore = hasBoth ? `${next.homeScore}-${next.awayScore}` : next.finalScore;
      return { ...prev, [selectionId]: next };
    });
  };

  const isBetFullyResolved = (betId) => {
    const details = betDetails[betId];
    if (!details?.selections?.length) return false;
    return details.selections.every((sel) => !!resolutions[sel.id]);
  };

  const buildSelectionsPayload = (betId) => {
    const details = betDetails[betId];
    if (!details?.selections?.length) return [];
    return details.selections.map((sel) => ({
      selectionId: sel.id,
      result: resolutions[sel.id],
      homeScore: scoreInputs[sel.id]?.homeScore ?? null,
      awayScore: scoreInputs[sel.id]?.awayScore ?? null,
      finalScore: scoreInputs[sel.id]?.finalScore ?? null,
    }));
  };

  const groupSelectionsByGame = (selections = []) => {
    const groups = new Map();
    selections.forEach((sel) => {
      const key = sel.game_id || `${sel.home_team}_${sel.away_team}`;
      if (!groups.has(key)) {
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

    const details = betDetails[betId];
    if (!details?.selections?.length) {
      setError('No hay selecciones para resolver');
      return;
    }

    if (!isBetFullyResolved(betId)) {
      setError('Debes resolver todas las selecciones antes de enviar');
      return;
    }

    const payload = {
      betId,
      selections: buildSelectionsPayload(betId),
      adminId,
      adminNotes: adminNotes || '',
    };

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/settlement/resolve-manual`, {
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
        setExpandedBetId(null);
        setResolutions((prev) => {
          const next = { ...prev };
          details.selections.forEach((sel) => {
            delete next[sel.id];
          });
          return next;
        });
        await loadPendingBets();
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

  const selectedBet = useMemo(() => betDetails[expandedBetId], [betDetails, expandedBetId]);

  return (
    <div className="manual-resolution">
      <div className="content-header">
        <div>
          <h2>🛠️ Resolución Manual (1h post-partido)</h2>
          <p className="subtitle">
            El sistema muestra automáticamente apuestas pendientes 1 hora después del inicio del partido.
          </p>
        </div>
        <button className="secondary-btn" onClick={loadPendingBets} disabled={loading}>
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
          {pendingBets.map((bet) => (
            <div key={bet.id} className="pending-card">
              <div className="pending-header">
                <div>
                  <h3>{bet.bet_ticket_number}</h3>
                  <p className="meta">
                    Colocada: {formatDateTime(bet.placed_at)} • Selecciones: {bet.selection_count} • Pendientes: {bet.pending_count}
                  </p>
                </div>
                <button className="secondary-btn" onClick={() => toggleBet(bet.id)}>
                  {expandedBetId === bet.id ? 'Cerrar' : 'Resolver'}
                </button>
              </div>

              {expandedBetId === bet.id && selectedBet && (
                <div className="pending-body">
                  <div className="notes">
                    <label>Notas del admin</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Ej: Resultado confirmado en ATP/ESPN"
                    />
                  </div>

                  <div className="selections">
                    {groupSelectionsByGame(selectedBet.selections).map((group) => (
                      <div key={group.key} className="game-group">
                        <div className="game-group-header">
                          <div>
                            <strong>{group.homeTeam} vs {group.awayTeam}</strong>
                            <div className="selection-time">Inicio: {formatDateTime(group.commenceTime)}</div>
                          </div>
                          <span className="market-badge">H2H / Over / Spread</span>
                        </div>

                        <div className="game-group-markets">
                          {group.markets.map((sel) => (
                            <div key={sel.id} className="selection-card">
                              <div className="selection-info">
                                <div className="selection-market">
                                  {marketLabel(sel.market)} • {sel.selected_team}
                                  {sel.point_spread && <span> • Línea {sel.point_spread}</span>}
                                </div>
                                {sel.selection_status && sel.selection_status !== 'pending' && (
                                  <div className="selection-suggested">
                                    Sugerido: {sel.selection_status === 'won' ? 'Ganó' : sel.selection_status === 'lost' ? 'Perdió' : 'Void'}
                                  </div>
                                )}
                                {(scoreInputs[sel.id]?.homeScore != null || scoreInputs[sel.id]?.awayScore != null || scoreInputs[sel.id]?.finalScore) && (
                                  <div className="selection-score-display">
                                    Marcador: {scoreInputs[sel.id]?.finalScore || `${scoreInputs[sel.id]?.homeScore ?? '-'}-${scoreInputs[sel.id]?.awayScore ?? '-'}`}
                                  </div>
                                )}
                              </div>
                              <div className="selection-actions">
                                <button
                                  className={`status-btn ${resolutions[sel.id] === 'won' ? 'active won' : ''}`}
                                  onClick={() => handleResolutionChange(sel.id, 'won')}
                                >
                                  ✅ Ganó
                                </button>
                                <button
                                  className={`status-btn ${resolutions[sel.id] === 'lost' ? 'active lost' : ''}`}
                                  onClick={() => handleResolutionChange(sel.id, 'lost')}
                                >
                                  ❌ Perdió
                                </button>
                                <button
                                  className={`status-btn ${resolutions[sel.id] === 'void' ? 'active void' : ''}`}
                                  onClick={() => handleResolutionChange(sel.id, 'void')}
                                >
                                  ⊘ Void
                                </button>
                              </div>
                              <div className="selection-score">
                                <label>Marcador final (opcional)</label>
                                <div className="score-inputs">
                                  <input
                                    type="number"
                                    placeholder={sel.home_team}
                                    value={scoreInputs[sel.id]?.homeScore ?? ''}
                                    onChange={(e) => handleScoreChange(sel.id, 'homeScore', e.target.value)}
                                  />
                                  <span>-</span>
                                  <input
                                    type="number"
                                    placeholder={sel.away_team}
                                    value={scoreInputs[sel.id]?.awayScore ?? ''}
                                    onChange={(e) => handleScoreChange(sel.id, 'awayScore', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="resolve-actions">
                    <button
                      className="primary-btn"
                      onClick={() => handleResolve(bet.id)}
                      disabled={loading || !isBetFullyResolved(bet.id)}
                    >
                      ✅ Resolver apuesta
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
