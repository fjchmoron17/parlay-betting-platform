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
    return (
      <div className="filter-panel">
        <div className="filter-container" style={{ display: 'flex', gap: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {/* Selector de Deportes */}
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <label htmlFor="sport-select" className="filter-label" style={{ marginBottom: 6, fontWeight: 600, fontSize: 15, display: 'block' }}>
              🏆 Deporte/Liga
            </label>
            <select
              id="sport-select"
              value={selectedSport}
              onChange={handleSportChange}
              className="filter-select"
              disabled={loading}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}
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
          <div className="filter-group" style={{ display: 'flex', flexDirection: 'column', minWidth: 220 }}>
            <label htmlFor="region-select" className="filter-label" style={{ marginBottom: 6, fontWeight: 600, fontSize: 15, display: 'block' }}>
              🌍 Casas de Apuestas por Región
            </label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={handleRegionChange}
              className="filter-select"
              disabled={loading}
              style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 15 }}
            >
              {Object.entries(regions).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Descripción de región */}
        <div className="region-description" style={{ marginTop: 10, fontSize: 14, color: '#64748b' }}>
          {regionDescriptions[selectedRegion]}
        </div>
      </div>
    );
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
              onFilterChange({
                sport: undefined,
                region: selectedRegion
              });
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
