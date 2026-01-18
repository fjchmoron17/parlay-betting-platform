import React, { useState } from "react";
import BetTicket from "./BetTicket";
import { betsAPI } from "../services/api";

const ParlayPanel = ({ parlay, onRemove }) => {
  const [betTicket, setBetTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [betAmount, setBetAmount] = useState(100);

  const entries = Object.entries(parlay);

  const combinedOdds =
    entries.length === 0
      ? 0
      : entries.reduce((acc, [, g]) => acc * g.odds, 1).toFixed(2);

  const potentialWinnings = betAmount * combinedOdds - betAmount;

  const handlePlaceBet = async () => {
    if (entries.length === 0) {
      alert("Selecciona al menos un partido");
      return;
    }

    setLoading(true);
    try {
      // Crear datos de la apuesta
      const betData = {
        selections: entries.map(([gameId, selection]) => ({
          gameId,
          team: selection.team,
          odds: selection.odds,
          homeTeam: selection.homeTeam,
          awayTeam: selection.awayTeam,
          league: selection.league,
          market: selection.market,
        })),
        amount: betAmount,
        combinedOdds: parseFloat(combinedOdds),
        potentialWinnings: parseFloat(potentialWinnings.toFixed(2)),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Enviar al backend
      const response = await betsAPI.create(betData);

      if (response.success) {
        // Crear ticket con datos de respuesta
        setBetTicket({
          id: response.data.id || `TICKET-${Date.now()}`,
          ...betData,
        });
      }
    } catch (error) {
      console.error("Error creating bet:", error);
      alert("Error al crear la apuesta. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseTicket = () => {
    setBetTicket(null);
  };

  return (
    <>
      <div className="w-80 bg-white rounded-lg shadow p-4 sticky top-6 h-fit">
        <h2 className="text-xl font-bold mb-3">Tu Parlay</h2>

        {entries.length === 0 ? (
          <p className="text-gray-500">Selecciona partidos</p>
        ) : (
          <>
            {entries.map(([id, g], index) => (
              <div
                key={id}
                className={`flex justify-between items-center mb-2 p-2 rounded parlay-item-${
                  index % 2 === 0 ? "blue" : "green"
                }`}
              >
                <div>
                  <p className="font-medium">{g.team}</p>
                  <p className="text-sm">Cuota: {g.odds}</p>
                </div>
                <button
                  onClick={() => onRemove(id)}
                  className="parlay-close-btn"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="mt-4 border-t pt-3">
              {/* Monto de Apuesta */}
              <div className="mb-3">
                <label className="text-sm font-semibold">Monto ($)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                  min="1"
                  max="10000"
                  className="w-full mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Resumen */}
              <div className="mb-3 bg-blue-50 p-2 rounded">
                <p className="text-sm">
                  <strong>Cuota Combinada:</strong> {combinedOdds}x
                </p>
                <p className="text-sm">
                  <strong>Ganancia Potencial:</strong> $
                  {potentialWinnings.toFixed(2)}
                </p>
              </div>

              {/* Botón Apostar */}
              <button
                onClick={handlePlaceBet}
                disabled={loading || entries.length === 0}
                className="w-full mt-3 bg-green-600 text-white p-3 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition"
              >
                {loading ? "⏳ Creando..." : "🎰 APOSTAR"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mostrar Ticket */}
      {betTicket && <BetTicket bet={betTicket} onClose={handleCloseTicket} />}
    </>
  );
};

export default ParlayPanel;

