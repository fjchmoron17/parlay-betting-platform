// src/components/BettingHousesList.jsx
import { useState, useEffect } from 'react';
import { getAllBettingHouses, deleteBettingHouse } from '../services/b2bApi';
import './BettingHousesList.css';

export default function BettingHousesList({ onSelectHouse }) {
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      setLoading(true);
      const response = await getAllBettingHouses();
      setHouses(response.data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar casas de apuestas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHouse = async (houseId, houseName) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${houseName}" y todos sus datos? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteBettingHouse(houseId);
      setHouses(houses.filter(h => h.id !== houseId));
      alert(`Casa de apuestas "${houseName}" eliminada exitosamente`);
    } catch (err) {
      alert('Error al eliminar casa de apuestas: ' + err.message);
      console.error(err);
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading-container">Cargando casas de apuestas...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={loadHouses} className="retry-btn">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="betting-houses-list">
      <div className="list-header">
        <h2>Casas de Apuestas</h2>
        <span className="houses-count">{houses.length} casas activas</span>
      </div>

      {houses.length === 0 ? (
        <div className="empty-state">
          <p>No hay casas de apuestas registradas</p>
        </div>
      ) : (
        <div className="houses-grid">
          {houses.map((house) => (
            <div 
              key={house.id} 
              className="house-card"
            >
              <div className="house-header">
                <div onClick={() => onSelectHouse && onSelectHouse(house)} className="house-header-content">
                  <h3>{house.name}</h3>
                  <span className={`status-badge status-${house.status}`}>
                    {house.status}
                  </span>
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => handleDeleteHouse(house.id, house.name)}
                  title="Eliminar casa"
                >
                  🗑️
                </button>
              </div>

              <div className="house-info" onClick={() => onSelectHouse && onSelectHouse(house)}>
                <div className="info-row">
                  <span className="info-label">ID:</span>
                  <span className="info-value">#{house.id}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">País:</span>
                  <span className="info-value">{house.country}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{house.email}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Balance:</span>
                  <span className="info-value balance">
                    {formatCurrency(house.account_balance, house.currency)}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Comisión:</span>
                  <span className="info-value">{house.commission_percentage}%</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Creada:</span>
                  <span className="info-value">{formatDate(house.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
