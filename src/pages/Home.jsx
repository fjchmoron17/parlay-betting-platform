import React, { useEffect, useState, useRef } from "react";
import GroupedGameCard from "../components/GroupedGameCard";
import ParlayPanel from "../components/ParlayPanel";
import { gamesAPI } from "../services/api";

const Home = ({ onGameSelect, selectedGames = [], bettingMode = false, filters = { sport: undefined, region: 'us' } }) => {
  const [games, setGames] = useState([]);
  const [parlay, setParlay] = useState({});
  const parlayRef = useRef({}); // Mantener sincrónico para validaciones inmediatas
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    console.log('🎯 handleSelect called:', { gameId, team, odds, gameData });
    console.log('🔍 bettingMode:', bettingMode, 'selectedGames:', selectedGames);
    
    // Validar que gameData tenga la información necesaria
    if (!gameData.homeTeam || !gameData.awayTeam) {
      console.error('❌ ERROR: gameData incompleto', gameData);
      alert('Error: Datos del juego incompletos. Intenta de nuevo.');
      return;
    }

    // Crear un identificador único del juego basado en home_team + away_team
    const gameMatchId = `${gameData.homeTeam}_vs_${gameData.awayTeam}`;
    console.log('📌 gameMatchId:', gameMatchId);

    // VALIDACIÓN DE DUPLICADOS Y TOGGLE
    let isDuplicate = false;
    let existingSelection = null;
    
    if (bettingMode) {
      // En modo betting, verificar en selectedGames
      existingSelection = selectedGames.find(game => 
        `${game.home_team}_vs_${game.away_team}` === gameMatchId
      );
      isDuplicate = !!existingSelection;
      console.log('📋 Checking selectedGames for duplicate:', isDuplicate);
    } else {
      // En modo normal, verificar en parlayRef
      existingSelection = parlayRef.current[gameMatchId];
      isDuplicate = !!existingSelection;
      console.log('📋 Checking parlayRef for duplicate:', isDuplicate, parlayRef.current);
    }

    if (isDuplicate) {
      console.log('⚠️ DUPLICATE DETECTED - TOGGLING OFF:', gameMatchId);
      // Si es duplicado, hacer toggle (eliminar)
      if (bettingMode && onGameSelect) {
        // En modo betting, enviar la misma selección al padre para que haga toggle
        onGameSelect({
          id: gameId,
          home_team: gameData.homeTeam,
          away_team: gameData.awayTeam,
          sport_title: gameData.sportTitle || gameData.league,
          sport_key: gameData.sportKey,
          market: gameData.market,
          selectedTeam: team,
          selectedOdds: odds,
          pointSpread: gameData.pointSpread,
          bookmaker: gameData.bookmaker,
          commence_time: gameData.commenceTime
        });
      } else {
        // En modo normal, remover de parlayRef
        handleRemove(gameMatchId);
      }
      return;
    }

    console.log('✅ Adding selection:', gameMatchId);

    // Si está en modo betting, usar el callback externo
    if (bettingMode && onGameSelect) {
      onGameSelect({
        id: gameId,
        home_team: gameData.homeTeam,
        away_team: gameData.awayTeam,
        sport_title: gameData.sportTitle || gameData.league,
        sport_key: gameData.sportKey,
        market: gameData.market,
        selectedTeam: team,
        selectedOdds: odds,
        pointSpread: gameData.pointSpread,
        bookmaker: gameData.bookmaker,
        commence_time: gameData.commenceTime
      });
      return;
    }

    // Agregar la nueva selección (modo normal)
    const newParlay = {
      ...parlayRef.current,
      [gameMatchId]: {
        team,
        odds,
        homeTeam: gameData.homeTeam,
        awayTeam: gameData.awayTeam,
        league: gameData.league,
        market: gameData.market,
        gameId
      },
    };
    
    console.log('📝 newParlay object:', newParlay);
    parlayRef.current = newParlay; // Actualizar ref inmediatamente
    console.log('✅ parlayRef.current updated:', parlayRef.current);
    setParlay(newParlay); // Actualizar state para re-render
    console.log('✅ setParlay called with:', newParlay);
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
                  selectedGames={bettingMode ? selectedGames : []}
                />
              ))}
            </div>
          )}
        </div>

        {/* Panel de Parlay */}
        {!bettingMode && <ParlayPanel parlay={parlay} onRemove={handleRemove} />}
      </div>
    </div>
  );
};

export default Home;
