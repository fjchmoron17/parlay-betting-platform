// src/components/CreateBettingHouse.jsx
import { useState } from 'react';
import { createBettingHouse } from '../services/b2bApi';
import './CreateBettingHouse.css';

export default function CreateBettingHouse({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    currency: 'USD'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currencies = [
    { code: 'USD', name: 'Dólar (USD)' },
    { code: 'MXN', name: 'Peso Mexicano (MXN)' },
    { code: 'COP', name: 'Peso Colombiano (COP)' },
    { code: 'ARS', name: 'Peso Argentino (ARS)' },
    { code: 'CLP', name: 'Peso Chileno (CLP)' },
    { code: 'EUR', name: 'Euro (EUR)' },
    { code: 'VES', name: 'Bolívar (VES)' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name || !formData.email || !formData.country) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email inválido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await createBettingHouse(formData);
      
      if (response.success) {
        onSuccess && onSuccess(response.data);
        // Reset form
        setFormData({ name: '', email: '', country: '', currency: 'USD' });
      }
    } catch (err) {
      setError(err.message || 'Error al crear la casa de apuestas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-house-container">
      <div className="create-house-header">
        <h2>Nueva Casa de Apuestas</h2>
        {onCancel && (
          <button onClick={onCancel} className="close-btn" type="button">
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="create-house-form">
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">
            Nombre de la Casa <span className="required">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Casa de Apuestas México"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contacto@ejemplo.com"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="country">
            País <span className="required">*</span>
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="Ej: México"
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="currency">
            Moneda <span className="required">*</span>
          </label>
          <select
            id="currency"
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            disabled={loading}
            required
          >
            {currencies.map(curr => (
              <option key={curr.code} value={curr.code}>
                {curr.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="cancel-btn"
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Creando...' : 'Crear Casa'}
          </button>
        </div>
      </form>
    </div>
  );
}
