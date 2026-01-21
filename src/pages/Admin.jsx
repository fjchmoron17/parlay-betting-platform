// src/pages/Admin.jsx
import { useState } from 'react';
import BettingHousesList from '../components/BettingHousesList';
import CreateBettingHouse from '../components/CreateBettingHouse';
import BetsList from '../components/BetsList';
import DailyReports from '../components/DailyReports';
import ApiQuotaMonitor from '../components/ApiQuotaMonitor';
import './Admin.css';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('houses'); // houses, create, bets, reports, quota
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleSelectHouse = (house) => {
    setSelectedHouse(house);
    setActiveTab('bets');
  };

  const handleCreateSuccess = (newHouse) => {
    setShowCreateForm(false);
    setActiveTab('houses');
    alert(`Casa "${newHouse.name}" creada exitosamente`);
  };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="header-content">
          <h1>Panel B2B - Administración</h1>
          <p className="subtitle">Gestión de Casas de Apuestas y Jugadas</p>
        </div>
      </div>

      <div className="admin-nav">
        <button
          className={activeTab === 'houses' ? 'active' : ''}
          onClick={() => setActiveTab('houses')}
        >
          🏠 Casas de Apuestas
        </button>
        <button
          className={activeTab === 'create' ? 'active' : ''}
          onClick={() => setActiveTab('create')}
        >
          ➕ Nueva Casa
        </button>
        <button
          className={activeTab === 'bets' ? 'active' : ''}
          onClick={() => setActiveTab('bets')}
          disabled={!selectedHouse}
        >
          🎲 Apuestas {selectedHouse && `- ${selectedHouse.name}`}
        </button>
        <button
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
          disabled={!selectedHouse}
        >
          📊 Reportes {selectedHouse && `- ${selectedHouse.name}`}
        </button>
        <button
          className={activeTab === 'quota' ? 'active' : ''}
          onClick={() => setActiveTab('quota')}
        >
          ⚡ Cuota API
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'houses' && (
          <div className="tab-content">
            <div className="content-header">
              <h2>Casas de Apuestas Registradas</h2>
              <button 
                className="primary-btn"
                onClick={() => setActiveTab('create')}
              >
                + Nueva Casa
              </button>
            </div>
            <BettingHousesList onSelectHouse={handleSelectHouse} />
          </div>
        )}

        {activeTab === 'create' && (
          <div className="tab-content">
            <CreateBettingHouse
              onSuccess={handleCreateSuccess}
              onCancel={() => setActiveTab('houses')}
            />
          </div>
        )}

        {activeTab === 'bets' && (
          <div className="tab-content">
            {selectedHouse ? (
              <>
                <div className="content-header">
                  <div>
                    <h2>Apuestas de {selectedHouse.name}</h2>
                    <p className="house-info">
                      Balance: {new Intl.NumberFormat('es-ES', {
                        style: 'currency',
                        currency: selectedHouse.currency
                      }).format(selectedHouse.account_balance)}
                    </p>
                  </div>
                  <button 
                    className="secondary-btn"
                    onClick={() => setActiveTab('houses')}
                  >
                    ← Volver a Casas
                  </button>
                </div>
                <BetsList bettingHouseId={selectedHouse.id} />
              </>
            ) : (
              <div className="empty-selection">
                <p>Selecciona una casa de apuestas para ver sus jugadas</p>
                <button onClick={() => setActiveTab('houses')} className="primary-btn">
                  Ver Casas
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="tab-content">
            {selectedHouse ? (
              <DailyReports 
                bettingHouseId={selectedHouse.id}
                houseName={selectedHouse.name}
              />
            ) : (
              <div className="empty-selection">
                <p>Selecciona una casa de apuestas para ver reportes</p>
                <button onClick={() => setActiveTab('houses')} className="primary-btn">
                  Ver Casas
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quota' && (
          <div className="tab-content">
            <ApiQuotaMonitor />
          </div>
        )}
      </div>
    </div>
  );
}
