import React from "react";

const GroupedGameCard = ({ gameGroup, onSelect, index, selectedGames = [] }) => {
  const isSelected = (market, team, gameId) => {
    return selectedGames.some(
      (sel) => sel.id === gameId && sel.market === market && sel.selectedTeam === team
    );
  };

  const selectOption = (market, team, odds, gameId, pointSpread = null) => {
    onSelect(gameId, team, odds, {
      homeTeam: firstGame.home_team,
      awayTeam: firstGame.away_team,
      league: firstGame.league,
      market: market,
      pointSpread,
      bookmaker: firstGame.bookmaker || firstGame.bookmakers?.[0]?.title || 'Desconocido',
      commenceTime: firstGame.commence_time
    });
  };

  const removeSelection = (e, market, team, gameId, odds, pointSpread = null) => {
    e.preventDefault();
    e.stopPropagation();
    // Llamar a selectOption para remover (toggle)
    selectOption(market, team, odds, gameId, pointSpread);
  };

  // Agrupar por mercado
  const marketGroups = {
    h2h: gameGroup.find(g => g.market === 'h2h'),
    spreads: gameGroup.find(g => g.market === 'spreads'),
    totals: gameGroup.find(g => g.market === 'totals')
  };

  const firstGame = gameGroup[0];
  const matchupTitle = `${firstGame.home_team} vs ${firstGame.away_team}`;

  return (
    <div className="match-group mb-6">
      {/* Header con equipos y info */}
      <div className="match-header mb-3">
        <div>
          <h3 className="text-lg font-bold">{matchupTitle}</h3>
          <p className="text-xs text-gray-600">
            {firstGame.league || 'OTHER'} • {firstGame.sportTitle || 'Desconocido'}
          </p>
        </div>
        {firstGame.status === 'live' && (
          <span className="badge badge-success pulse">🔴 VIVO</span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">
        ⏰ {new Date(firstGame.game_time).toLocaleString()}
      </p>

      {/* Grid de 3 columnas */}
      <div className="market-grid">
        {/* Columna H2H */}
        {marketGroups.h2h ? (
          <div className="market-column">
            <div className="market-title">🏆 Head to Head</div>
            <div className="market-options">
              <div className="market-btn-wrapper">
                <button
                  className={`market-btn ${
                    isSelected('h2h', marketGroups.h2h.home_team, marketGroups.h2h.id)
                      ? "market-btn-selected"
                      : ""
                  }`}
                  onClick={() => selectOption(
                    'h2h',
                    marketGroups.h2h.home_team,
                    marketGroups.h2h.odds_home,
                    marketGroups.h2h.id
                  )}
                >
                  <span className="team-name">{marketGroups.h2h.home_team}</span>
                  <span className="odds">@{marketGroups.h2h.odds_home}</span>
                </button>
                {isSelected('h2h', marketGroups.h2h.home_team, marketGroups.h2h.id) && (
                  <button 
                    className="remove-x"
                    onClick={(e) => removeSelection(e, 'h2h', marketGroups.h2h.home_team, marketGroups.h2h.id, marketGroups.h2h.odds_home)}
                  >
                    ✕
                  </button>
                )}
              </div>

              {marketGroups.h2h.odds_draw && (
                <div className="market-btn-wrapper">
                  <button
                    className={`market-btn market-btn-draw ${
                        isSelected('h2h', 'Draw', marketGroups.h2h.id) ? "market-btn-selected" : ""
                      }`}
                    onClick={() => selectOption(
                      'h2h',
                      'Draw',
                      marketGroups.h2h.odds_draw,
                      marketGroups.h2h.id
                    )}
                  >
                    <span className="team-name">Empate</span>
                    <span className="odds">@{marketGroups.h2h.odds_draw}</span>
                  </button>
                  {isSelected('h2h', 'Draw', marketGroups.h2h.id) && (
                    <button 
                      className="remove-x"
                      onClick={(e) => removeSelection(e, 'h2h', 'Draw', marketGroups.h2h.id, marketGroups.h2h.odds_draw)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <div className="market-btn-wrapper">
                <button
                  className={`market-btn ${
                    isSelected('h2h', marketGroups.h2h.away_team, marketGroups.h2h.id)
                      ? "market-btn-selected"
                      : ""
                  }`}
                  onClick={() => selectOption(
                    'h2h',
                    marketGroups.h2h.away_team,
                    marketGroups.h2h.odds_away,
                    marketGroups.h2h.id
                  )}
                >
                  <span className="team-name">{marketGroups.h2h.away_team}</span>
                  <span className="odds">@{marketGroups.h2h.odds_away}</span>
                </button>
                {isSelected('h2h', marketGroups.h2h.away_team, marketGroups.h2h.id) && (
                  <button 
                    className="remove-x"
                    onClick={(e) => removeSelection(e, 'h2h', marketGroups.h2h.away_team, marketGroups.h2h.id, marketGroups.h2h.odds_away)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="market-column market-column-empty">
            <div className="market-title">🏆 Head to Head</div>
            <div className="market-empty">No disponible</div>
          </div>
        )}

        {/* Columna Spreads */}
        {marketGroups.spreads ? (
          <div className="market-column">
            <div className="market-title">📊 Spreads</div>
            <div className="market-options">
              <div className="market-btn-wrapper">
                <button
                  className={`market-btn ${
                    isSelected('spreads', marketGroups.spreads.home_team, marketGroups.spreads.id)
                      ? "market-btn-selected"
                      : ""
                  }`}
                  onClick={() => selectOption(
                    'spreads',
                    marketGroups.spreads.home_team,
                    marketGroups.spreads.odds_home,
                    marketGroups.spreads.id,
                    marketGroups.spreads.point_home || null
                  )}
                >
                  <span className="team-name">
                    {marketGroups.spreads.home_team}
                    {marketGroups.spreads.point_home && (
                      <span className="reference-value">
                        {marketGroups.spreads.point_home > 0 ? '+' : ''}{marketGroups.spreads.point_home}
                      </span>
                    )}
                  </span>
                  <span className="odds">@{marketGroups.spreads.odds_home}</span>
                </button>
                {isSelected('spreads', marketGroups.spreads.home_team, marketGroups.spreads.id) && (
                  <button 
                    className="remove-x"
                    onClick={(e) => removeSelection(e, 'spreads', marketGroups.spreads.home_team, marketGroups.spreads.id, marketGroups.spreads.odds_home, marketGroups.spreads.point_home)}
                  >
                    ✕
                  </button>
                )}
              </div>

              {marketGroups.spreads.odds_draw && (
                <div className="market-btn-wrapper">
                  <button
                    className={`market-btn market-btn-draw ${
                        isSelected('spreads', 'Draw', marketGroups.spreads.id) ? "market-btn-selected" : ""
                      }`}
                    onClick={() => selectOption(
                      'spreads',
                      'Draw',
                      marketGroups.spreads.odds_draw,
                      marketGroups.spreads.id,
                      0
                    )}
                  >
                    <span className="team-name">Empate</span>
                    <span className="odds">@{marketGroups.spreads.odds_draw}</span>
                  </button>
                  {isSelected('spreads', 'Draw', marketGroups.spreads.id) && (
                    <button 
                      className="remove-x"
                      onClick={(e) => removeSelection(e, 'spreads', 'Draw', marketGroups.spreads.id, marketGroups.spreads.odds_draw, 0)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <div className="market-btn-wrapper">
                <button
                  className={`market-btn ${
                    isSelected('spreads', marketGroups.spreads.away_team, marketGroups.spreads.id)
                      ? "market-btn-selected"
                      : ""
                  }`}
                  onClick={() => selectOption(
                    'spreads',
                    marketGroups.spreads.away_team,
                    marketGroups.spreads.odds_away,
                    marketGroups.spreads.id,
                    marketGroups.spreads.point_away || null
                  )}
                >
                  <span className="team-name">
                    {marketGroups.spreads.away_team}
                    {marketGroups.spreads.point_away && (
                      <span className="reference-value">
                        {marketGroups.spreads.point_away > 0 ? '+' : ''}{marketGroups.spreads.point_away}
                      </span>
                    )}
                  </span>
                  <span className="odds">@{marketGroups.spreads.odds_away}</span>
                </button>
                {isSelected('spreads', marketGroups.spreads.away_team, marketGroups.spreads.id) && (
                  <button 
                    className="remove-x"
                    onClick={(e) => removeSelection(e, 'spreads', marketGroups.spreads.away_team, marketGroups.spreads.id, marketGroups.spreads.odds_away, marketGroups.spreads.point_away)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="market-column market-column-empty">
            <div className="market-title">📊 Spreads</div>
            <div className="market-empty">No disponible</div>
          </div>
        )}

        {/* Columna Totals */}
        {marketGroups.totals ? (
          <div className="market-column">
            <div className="market-title">➕ Totales</div>
            <div className="market-options">
              <div className="market-btn-wrapper">
                <button
                  className={`market-btn ${
                    isSelected('totals', marketGroups.totals.home_team, marketGroups.totals.id)
                      ? "market-btn-selected"
                      : ""
                  }`}
                  onClick={() => selectOption(
                    'totals',
                    marketGroups.totals.home_team,
                    marketGroups.totals.odds_home,
                    marketGroups.totals.id,
                    marketGroups.totals.point_home || null
                  )}
                >
                  <span className="team-name">
                    Over
                    {marketGroups.totals.point_home && (
                      <span className="reference-value">{marketGroups.totals.point_home}</span>
                    )}
                  </span>
                  <span className="odds">@{marketGroups.totals.odds_home}</span>
                </button>
                {isSelected('totals', marketGroups.totals.home_team, marketGroups.totals.id) && (
                  <button 
                    className="remove-x"
                    onClick={(e) => removeSelection(e, 'totals', marketGroups.totals.home_team, marketGroups.totals.id, marketGroups.totals.odds_home, marketGroups.totals.point_home)}
                  >
                    ✕
                  </button>
                )}
              </div>

              {marketGroups.totals.odds_draw && (
                <div className="market-btn-wrapper">
                  <button
                    className={`market-btn market-btn-draw ${
                        isSelected('totals', 'Draw', marketGroups.totals.id) ? "market-btn-selected" : ""
                      }`}
                    onClick={() => selectOption(
                      'totals',
                      'Draw',
                      marketGroups.totals.odds_draw,
                      marketGroups.totals.id,
                      0
                    )}
                  >
                    <span className="team-name">Empate</span>
                    <span className="odds">@{marketGroups.totals.odds_draw}</span>
                  </button>
                  {isSelected('totals', 'Draw', marketGroups.totals.id) && (
                    <button 
                      className="remove-x"
                      onClick={(e) => removeSelection(e, 'totals', 'Draw', marketGroups.totals.id, marketGroups.totals.odds_draw, 0)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}

              <div className="market-btn-wrapper">
                <button
                  className={`market-btn ${
                    isSelected('totals', marketGroups.totals.away_team, marketGroups.totals.id)
                      ? "market-btn-selected"
                      : ""
                  }`}
                  onClick={() => selectOption(
                    'totals',
                    marketGroups.totals.away_team,
                    marketGroups.totals.odds_away,
                    marketGroups.totals.id,
                    marketGroups.totals.point_away || null
                  )}
                >
                  <span className="team-name">
                    Under
                    {marketGroups.totals.point_away && (
                      <span className="reference-value">{marketGroups.totals.point_away}</span>
                    )}
                  </span>
                  <span className="odds">@{marketGroups.totals.odds_away}</span>
                </button>
                {isSelected('totals', marketGroups.totals.away_team, marketGroups.totals.id) && (
                  <button 
                    className="remove-x"
                    onClick={(e) => removeSelection(e, 'totals', marketGroups.totals.away_team, marketGroups.totals.id, marketGroups.totals.odds_away, marketGroups.totals.point_away || null)}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="market-column market-column-empty">
            <div className="market-title">➕ Totales</div>
            <div className="market-empty">No disponible</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupedGameCard;
