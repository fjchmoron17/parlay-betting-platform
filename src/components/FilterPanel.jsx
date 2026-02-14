import React, { useState, useEffect } from 'react';
import { sportsAPI } from '../services/api';

const FilterPanel = ({ filters, onFilterChange }) => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Usar los filtros del padre
  const selectedSport = filters?.sport || '';
  const selectedRegion = filters?.region || 'us';

  const regions = {
    'us': '🇺🇸 Estados Unidos',
    'uk': '🇬🇧 Reino Unido',
    // Agrega más regiones si es necesario
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
            onChange={e => onFilterChange({ ...filters, region: e.target.value })}
            className="filter-select"
            disabled={loading}
          >
            {Object.entries(regions).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
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

