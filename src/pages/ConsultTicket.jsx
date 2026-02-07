import { useEffect, useMemo, useState } from "react";
import "./ConsultTicket.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api";

const formatDateTime = (value) => {
  if (!value) return "Fecha N/D";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha N/D";
  return date.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const statusLabels = {
  pending: "Pendiente",
  won: "Ganada",
  lost: "Perdida",
  void: "Empate/VOID",
};

export default function ConsultTicket() {
  const [ticket, setTicket] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bet, setBet] = useState(null);

  const queryTicket = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("ticket") || "";
  }, []);

  const fetchTicket = async (ticketNumber) => {
    if (!ticketNumber) return;

    try {
      setLoading(true);
      setError(null);
      setBet(null);

      const response = await fetch(
        `${API_BASE_URL}/bets-db/ticket/${encodeURIComponent(ticketNumber)}`
      );
      const data = await response.json();

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "No se encontró el ticket");
      }

      setBet(data.data);
    } catch (err) {
      setError(err.message || "No se pudo consultar el ticket");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryTicket) {
      setTicket(queryTicket);
      fetchTicket(queryTicket);
    }
  }, [queryTicket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = ticket.trim();
    if (!value) {
      setError("Ingresa un número de ticket");
      return;
    }
    window.history.replaceState({}, "", `/consulta-ticket?ticket=${encodeURIComponent(value)}`);
    fetchTicket(value);
  };

  return (
    <div className="ticket-page">
      <header className="ticket-header">
        <div>
          <h1>Consulta tu ticket</h1>
          <p>Revisa el estado de tus selecciones en tiempo real.</p>
        </div>
        <a className="ticket-home" href="/">Volver al inicio</a>
      </header>

      <section className="ticket-card">
        <form onSubmit={handleSubmit} className="ticket-form">
          <input
            type="text"
            placeholder="Ej: BET-1769..."
            value={ticket}
            onChange={(e) => setTicket(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Buscando..." : "Consultar"}
          </button>
        </form>

        {error && <div className="ticket-error">⚠️ {error}</div>}

        {bet && (
          <div className="ticket-result">
            <div className="ticket-summary">
              <div>
                <span>Ticket</span>
                <strong>{bet.bet_ticket_number}</strong>
              </div>
              <div>
                <span>Estado</span>
                <strong className={`status ${bet.status}`}>{statusLabels[bet.status] || bet.status}</strong>
              </div>
              <div>
                <span>Fecha</span>
                <strong>{formatDateTime(bet.placed_at)}</strong>
              </div>
              <div>
                <span>Potencial</span>
                <strong>${Number(bet.potential_win || 0).toFixed(2)}</strong>
              </div>
            </div>

            <div className="ticket-selections">
              <h3>Selecciones</h3>
              <div className="selection-list">
                {(bet.selections || []).map((selection) => (
                  <div className="selection-item" key={selection.id}>
                    <div>
                      <p className="teams">
                        {selection.home_team} vs {selection.away_team}
                      </p>
                      <p className="meta">
                        {selection.league} • {selection.market}
                      </p>
                      <p className="pick">Selección: {selection.selected_team}</p>
                      <p className="date">{formatDateTime(selection.game_commence_time)}</p>
                    </div>
                    <span className={`status ${selection.selection_status}`}>
                      {statusLabels[selection.selection_status] || selection.selection_status || "Pendiente"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
