import React, { useState, useEffect } from 'react';
import { sportsAPI } from '../services/api';

const FilterPanel = ({ filters, onFilterChange }) => {
    useEffect(() => {
      let mounted = true;
      setLoading(true);
      sportsAPI.getAll()
        .then(data => {
          // Agrupar deportes por grupo/league si es necesario
          let grouped = [];
          if (Array.isArray(data?.data)) {
            // Si la API ya devuelve agrupados
            grouped = data.data;
          } else if (Array.isArray(data)) {
            // Si es un array plano, agrupar por league_group o similar
            const byGroup = {};
            data.forEach(sport => {
              const group = sport.league_group || sport.group || 'Otros';
              if (!byGroup[group]) byGroup[group] = [];
              byGroup[group].push(sport);
            });
            grouped = Object.entries(byGroup);
          }
          if (mounted) setSports(grouped);
        })
        .catch(() => { if (mounted) setSports([]); })
        .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
    }, []);
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

  // Handler faltante para el selector de deportes
  const handleSportChange = (e) => {
    onFilterChange({ ...filters, sport: e.target.value });
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

