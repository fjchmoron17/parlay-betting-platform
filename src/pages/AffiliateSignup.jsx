import { useState } from 'react';
import CreateBettingHouse from '../components/CreateBettingHouse';
import './AffiliateSignup.css';

export default function AffiliateSignup() {
  const [success, setSuccess] = useState(null);

  const handleSuccess = (data) => {
    setSuccess({
      name: data?.name || 'Casa de Apuestas',
      username: data?.admin_username || data?.username || 'usuario'
    });
  };

  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="affiliate-page">
      <header className="affiliate-header">
        <div>
          <h1>Afiliar Agencia</h1>
          <p>Registra tu casa de apuestas y comienza a operar en minutos.</p>
        </div>
        <button className="affiliate-back" onClick={handleBack} type="button">
          Volver al inicio
        </button>
      </header>

      {success ? (
        <div className="affiliate-success">
          <h2>¡Registro exitoso!</h2>
          <p>
            Tu casa <strong>{success.name}</strong> fue creada correctamente.
          </p>
          <p>
            Usuario administrador: <strong>{success.username}</strong>
          </p>
          <div className="affiliate-actions">
            <button onClick={handleBack} type="button">
              Ir al inicio de sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="affiliate-form-wrapper">
          <CreateBettingHouse publicMode onSuccess={handleSuccess} onCancel={handleBack} />
        </div>
      )}
    </div>
  );
}
