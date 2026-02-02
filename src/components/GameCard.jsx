import React, { useState } from "react";

const GameCard = ({ game, onSelect, index }) => {
  const [selected, setSelected] = useState(null);

  const selectTeam = (team, odds) => {
    setSelected(team);
    onSelect(game.id, team, odds, {
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      league: game.league,
      sportTitle: game.sportTitle,
      sportKey: game.sportKey,
      market: game.market,
      pointSpread: null,
      bookmaker: 'Desconocido',
      commenceTime: game.game_time
    });
  };

  // Alternar colores: índice par = azul claro, índice impar = verde claro
  const bgClass = index % 2 === 0 ? "game-card-blue" : "game-card-green";

  // Determinar si mostrar opción de empate (para soccer)
  const showDraw = game.odds_draw && game.league === 'SOCCER';

  return (
    <div className={`rounded-lg shadow p-4 mb-4 ${bgClass}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-lg">
            {game.home_team} vs {game.away_team}
          </p>
          <p className="text-xs text-gray-600 badge badge-info">
            {game.league || 'OTHER'} • {game.sportTitle || 'Desconocido'}
          </p>
        </div>
        {game.status === 'live' && (
          <span className="badge badge-success pulse">🔴 VIVO</span>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-3">
        ⏰ {new Date(game.game_time).toLocaleString()}
      </p>

      {game.market && (
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className={`badge ${
            game.market === 'h2h' ? 'badge-primary' :
            game.market === 'spreads' ? 'badge-info' :
            'badge-warning'
          }`}>
            {game.market === 'h2h' ? '🏆 Head to Head' :
             game.market === 'spreads' ? '📊 Spreads' :
             game.market === 'totals' ? '➕ Totales' :
             game.market}
          </span>
        </div>
      )}

      <div className={`flex gap-2 ${showDraw ? 'gap-2' : 'gap-3'}`}>
        <button
          className={`flex-1 p-2 rounded text-sm font-semibold transition ${
            selected === game.home_team
              ? "bg-green-500 text-white shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => selectTeam(game.home_team, game.odds_home)}
        >
          {game.home_team} <br />
          <span className="text-xs opacity-80">@{game.odds_home}</span>
        </button>

        {showDraw && (
          <button
            className={`flex-1 p-2 rounded text-sm font-semibold transition ${
              selected === 'Draw'
                ? "bg-yellow-500 text-white shadow-lg"
                : "bg-yellow-100 hover:bg-yellow-200"
            }`}
            onClick={() => selectTeam('Draw', game.odds_draw)}
          >
            Empate <br />
            <span className="text-xs opacity-80">@{game.odds_draw}</span>
          </button>
        )}

        <button
          className={`flex-1 p-2 rounded text-sm font-semibold transition ${
            selected === game.away_team
              ? "bg-green-500 text-white shadow-lg"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
          onClick={() => selectTeam(game.away_team, game.odds_away)}
        >
          {game.away_team} <br />
          <span className="text-xs opacity-80">@{game.odds_away}</span>
        </button>
      </div>
    </div>
  );
};

export default GameCard;
