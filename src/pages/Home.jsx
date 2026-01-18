import React, { useEffect, useState } from "react";
import GroupedGameCard from "../components/GroupedGameCard";
import ParlayPanel from "../components/ParlayPanel";
import FilterPanel from "../components/FilterPanel";
import { gamesAPI } from "../services/api";

const Home = () => {
  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    sport: undefined,
    region: 'us'
  });

  // Cargar juegos cuando cambian los filtros
  useEffect(() => {
    fetchGames();
  }, [filters]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await gamesAPI.getAll(
        filters.sport,
        filters.region
      );
      
      if (response.success) {
        setGames(response.data);
      } else {
        setError('No se pudieron cargar los juegos');
      }
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Error al conectar con el servidor. Asegúrate que el backend está corriendo en puerto 3333');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSelect = (gameId, team, odds, gameData = {}) => {
    setParlay((prev) => ({
      ...prev,
      [gameId]: {
        team,
        odds,
        homeTeam: gameData.homeTeam,
        awayTeam: gameData.awayTeam,
        league: gameData.league,
        market: gameData.market,
      },
    }));
  };

  const handleRemove = (gameId) => {
    setParlay((prev) => {
      const copy = { ...prev };
      delete copy[gameId];
      return copy;
    });
  };

  // Agrupar juegos por serie (home_team vs away_team)
  const groupedGames = () => {
    const groups = {};
    games.forEach(game => {
      const key = `${game.home_team}_${game.away_team}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(game);
    });
    return Object.values(groups);
  };

  return (
    <div className="flex flex-col p-6 gap-6">
      {/* Header */}
      <div>
        <h1 className="heading-primary">🎰 Parlay Bets (En vivo)</h1>
        <p className="text-gray-600 text-sm mt-1">
          {games.length} juegos disponibles • {Object.keys(parlay).length} seleccionados
        </p>
      </div>

      {/* Filtros */}
      <FilterPanel onFilterChange={handleFilterChange} />

      {/* Contenido Principal */}
      <div className="flex gap-6">
        <div className="flex-1">
          {loading && (
            <div className="card mt-4">
              <p className="text-center text-gray-600">⏳ Cargando partidos...</p>
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger mt-4">
              ⚠️ {error}
              <button 
                onClick={fetchGames}
                className="btn btn-small btn-secondary mt-2"
              >
                🔄 Reintentar
              </button>
            </div>
          )}

          {!loading && games.length === 0 && !error && (
            <div className="card mt-4">
              <p className="text-center text-gray-600">
                📭 No hay partidos disponibles para estos filtros
              </p>
            </div>
          )}

          {!loading && games.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                📊 Mostrando {games.length} juegos
              </p>
              {groupedGames().map((gameGroup, index) => (
                <GroupedGameCard
                  key={`${gameGroup[0].home_team}_${gameGroup[0].away_team}`}
                  gameGroup={gameGroup}
                  onSelect={handleSelect}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel de Parlay */}
        <ParlayPanel parlay={parlay} onRemove={handleRemove} />
      </div>
    </div>
  );
};

export default Home;
