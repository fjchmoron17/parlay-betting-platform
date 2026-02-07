// src/components/CreateBettingHouse.jsx
import { useState } from 'react';
import { createBettingHouse, createBettingHousePublic } from '../services/b2bApi';
import './CreateBettingHouse.css';

export default function CreateBettingHouse({ onSuccess, onCancel, publicMode = false }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: '',
    currency: 'USD',
    username: '',
    password: ''
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

  const countries = [
    'México',
    'Colombia',
    'Argentina',
    'Chile',
    'Perú',
    'Ecuador',
    'Uruguay',
    'Panamá',
    'España',
    'Estados Unidos',
    'Venezuela'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.name || !formData.email || !formData.country || !formData.username || !formData.password) {
      setError('Todos los campos son obligatorios');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Email inválido');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = publicMode
        ? await createBettingHousePublic(formData)
        : await createBettingHouse(formData);
      
      if (response.success) {
        onSuccess && onSuccess(response.data);
        // Reset form
        setFormData({ name: '', email: '', country: '', currency: 'USD', username: '', password: '' });
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
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            disabled={loading}
            required
          >
            <option value="" disabled>Seleccione un país</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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

        <div className="form-divider">
          <h3>Datos de Acceso</h3>
        </div>

        <div className="form-group">
          <label htmlFor="username">
            Nombre de Usuario <span className="required">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="usuario_casa"
            disabled={loading}
            required
            minLength={3}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            Contraseña <span className="required">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="••••••••"
            disabled={loading}
            required
            minLength={6}
          />
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
