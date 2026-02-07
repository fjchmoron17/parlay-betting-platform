import { useMemo, useState } from 'react';
import './ResetPassword.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api';

export default function ResetPassword() {
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }, []);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo solicitar el reset');
      }
      setSuccess('Si el email existe, recibirás un enlace para restablecer tu contraseña.');
    } catch (err) {
      setError(err.message || 'Error al solicitar el reset');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'No se pudo actualizar la contraseña');
      }
      setSuccess('Contraseña actualizada. Ya puedes iniciar sesión.');
    } catch (err) {
      setError(err.message || 'Error al actualizar contraseña');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="reset-page">
      <div className="reset-card">
        <header>
          <h1>Restablecer contraseña</h1>
          <p>{token ? 'Define una nueva contraseña para tu cuenta.' : 'Ingresa tu email para recibir el enlace de recuperación.'}</p>
        </header>

        {error && <div className="reset-alert error">⚠️ {error}</div>}
        {success && <div className="reset-alert success">✅ {success}</div>}

        {token ? (
          <form onSubmit={handleConfirm} className="reset-form">
            <label>
              Nueva contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </label>
            <label>
              Confirmar contraseña
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequest} className="reset-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@dominio.com"
                disabled={loading}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}

        <div className="reset-footer">
          <button type="button" onClick={handleBack} className="link-button">
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
