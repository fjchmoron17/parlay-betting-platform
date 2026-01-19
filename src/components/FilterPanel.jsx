import React, { useState, useEffect } from 'react';
import { sportsAPI } from '../services/api';

const FilterPanel = ({ onFilterChange }) => {
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('us');
  const [loading, setLoading] = useState(true);

  const regions = {
    'us': '🇺🇸 Estados Unidos',
    'uk': '🇬🇧 Reino Unido',
    'eu': '🇪🇺 Europa',
    'au': '🇦🇺 Australia'
  };

  const regionDescriptions = {
    'us': 'Casas de apuestas: DraftKings, FanDuel, BetMGM, etc.',
    'uk': 'Casas de apuestas: Bet365, William Hill, Ladbrokes, etc.',
    'eu': 'Casas de apuestas europeas',
    'au': 'Casas de apuestas australianas'
  };

  // Cargar deportes disponibles
  useEffect(() => {
    loadSports();
  }, []);

  const loadSports = async () => {
    try {
      setLoading(true);
      const response = await sportsAPI.getAll();
      if (response.success) {
        // Agrupar deportes por grupo
        const grouped = {};
        response.data.forEach(sport => {
          if (!grouped[sport.group]) {
            grouped[sport.group] = [];
          }
          grouped[sport.group].push(sport);
        });
        setSports(Object.entries(grouped));
      }
    } catch (error) {
      console.error('Error loading sports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Notificar cambios de filtros
  const handleChange = (sport = selectedSport, region = selectedRegion) => {
    onFilterChange({
      sport: sport || undefined,
      region
    });
  };

  const handleSportChange = (e) => {
    const value = e.target.value;
    setSelectedSport(value);
    handleChange(value, selectedRegion);
  };

  const handleRegionChange = (e) => {
    const value = e.target.value;
    setSelectedRegion(value);
    handleChange(selectedSport, value);
  };

  return (
    <div className="filter-panel">
      <div className="filter-container">
        {/* Selector de Deportes */}
        <div className="filter-group">
          <label htmlFor="sport-select" className="filter-label">
            🏆 Deporte/Liga
          </label>
          <select
            id="sport-select"
            value={selectedSport}
            onChange={handleSportChange}
            className="filter-select"
            disabled={loading}
          >
            <option value="">Todos los Deportes</option>
            {sports.map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map(sport => (
                  <option key={sport.key} value={sport.key}>
                    {sport.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Selector de Región */}
        <div className="filter-group">
          <label htmlFor="region-select" className="filter-label">
            🌍 Casas de Apuestas por Región
          </label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={handleRegionChange}
            className="filter-select"
            title={regionDescriptions[selectedRegion]}
          >
            {Object.entries(regions).map(([key, label]) => (
              <option key={key} value={key} title={regionDescriptions[key]}>
                {label}
              </option>
            ))}
          </select>
          <small className="filter-hint">
            {regionDescriptions[selectedRegion]}
          </small>
        </div>

        {/* Botón de Limpiar Filtros */}
        {selectedSport && (
          <button
            onClick={() => {
              setSelectedSport('');
              handleChange('', selectedRegion);
            }}
            className="btn btn-secondary"
            title="Limpiar filtro de deporte"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Indicador de Carga */}
      {loading && (
        <div className="filter-loading">
          <p>Cargando deportes...</p>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
