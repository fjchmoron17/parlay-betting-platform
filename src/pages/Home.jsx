import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet";
import GroupedGameCard from "../components/GroupedGameCard";
import ParlayPanel from "../components/ParlayPanel";
import { gamesAPI } from "../services/api";

const Home = ({ onGameSelect, selectedGames = [], bettingMode = false, filters = { sport: undefined, region: 'us' } }) => {
  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState({});
  const parlayRef = useRef({}); // Mantener sincrónico para validaciones inmediatas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Widget refs (ya no usados)

  // Sincronizar ref cuando cambia parlay (para remociones)
  useEffect(() => {
    parlayRef.current = parlay;
    console.log('🔄 parlayRef sincronizado:', parlayRef.current);
  }, [parlay]);

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

  const handleSelect = (gameId, team, odds, gameData = {}) => {
    // Permitir toggle: si ya existe, quitar; si no, agregar
    if (bettingMode && onGameSelect) {
      onGameSelect({
        id: gameId,
        home_team: gameData.homeTeam,
        away_team: gameData.awayTeam,
        league: gameData.league || gameData.sportTitle || gameData.sport_key || 'OTHER',
        market: gameData.market,
        selectedTeam: team,
        selectedOdds: odds,
        pointSpread: gameData.pointSpread,
        bookmaker: gameData.bookmaker,
        game_commence_time: gameData.game_commence_time || gameData.game_time || gameData.commence_time || gameData.commenceTime
      });
      return;
    }

    setParlay((prev) => {
      const exists = prev[gameId] && prev[gameId].team === team && prev[gameId].market === gameData.market;
      if (exists) {
        const copy = { ...prev };
        delete copy[gameId];
        return copy;
      } else {
        return {
          ...prev,
          [gameId]: {
            team,
            odds,
            homeTeam: gameData.homeTeam,
            awayTeam: gameData.awayTeam,
            league: gameData.league,
            market: gameData.market,
          },
        };
      }
    });
  };

  const handleRemove = (gameId) => {
    const copy = { ...parlayRef.current };
    delete copy[gameId];
    parlayRef.current = copy; // Actualizar ref primero
    setParlay(copy); // Luego actualizar state
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

  // Eliminado: integración dinámica, ahora scripts van en JSX

  return (
    <div className="flex flex-col p-6 gap-6">
      {/* Header */}
      {!bettingMode && (
        <div>
          <h1 className="heading-primary">🎰 Parlay Bets (En vivo)</h1>
          <p className="text-gray-600 text-sm mt-1">
            {games.length} juegos disponibles • {Object.keys(parlay).length} seleccionados
          </p>
        </div>
      )}

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
                  selectedGames={bettingMode ? selectedGames : Object.values(parlay)}
                />
              ))}
            </div>
          )}
        </div>
        {/* Panel de Parlay: solo mostrar si hay selecciones */}
        {!bettingMode && Object.keys(parlay).length > 0 && (
          <ParlayPanel parlay={parlay} onRemove={handleRemove} />
        )}
      </div>
      {/* Widgets de monetización al final */}
      <Helmet>
        <script async id="elem459d7e6db30947da86fa1bcc07340452" src="https://bwasrv.com/tags/display.js?p=%2Fregistration%2F&trk_id=2JTA&media_id=8e046c37-25b2-4994-a9c2-ee9fc3aacc40&width=120&height=600&b=elem459d7e6db30947da86fa1bcc07340452"></script>
        <script async id="elem88f738fe94004752b1cbf599c40c14d1" src="https://bwasrv.com/tags/display.js?trk_id=2JTA&media_id=42fb2b61-a45d-435b-8b71-f138360dfd44&width=120&height=600&b=elem88f738fe94004752b1cbf599c40c14d1"></script>
        <script async id="elembc8a16db80cb4c468a5ff37f1db49c4b" src="https://bwasrv.com/tags/display.js?p=%2Fpoker%2F&trk_id=2JTA&media_id=e0960b81-2729-4b05-9f1b-b6520992faf4&width=120&height=600&b=elembc8a16db80cb4c468a5ff37f1db49c4b"></script>
      </Helmet>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '32px', flexWrap: 'wrap' }}>
        {/* Los widgets se mostrarán en los contenedores por el script externo */}
        <div id="elem459d7e6db30947da86fa1bcc07340452"></div>
        <div id="elem88f738fe94004752b1cbf599c40c14d1"></div>
        <div id="elembc8a16db80cb4c468a5ff37f1db49c4b"></div>
      </div>
    </div>
  );
};

export default Home;
