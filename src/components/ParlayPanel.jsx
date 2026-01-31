import React, { useState } from "react";
import BetTicket from "./BetTicket";
import { placeBet } from "../services/b2bApi";
import { useAuth } from "../context/AuthContext";

const ParlayPanel = ({ parlay, onRemove }) => {
  const { house } = useAuth();
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

    if (!house?.id) {
      alert("No se encontró información de la casa de apuestas");
      return;
    }

    setLoading(true);
    try {
      // Generar ticket number único
      const ticketNumber = `BET-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Crear datos de la apuesta para el sistema B2B
      const betData = {
        bettingHouseId: house.id,
        betTicketNumber: ticketNumber,
        betType: 'parlay',
        totalStake: betAmount,
        totalOdds: parseFloat(combinedOdds),
        selections: entries.map(([gameId, selection]) => ({
          gameId,
          homeTeam: selection.homeTeam,
          awayTeam: selection.awayTeam,
          league: selection.league || 'OTHER',
          market: selection.market,
          selectedTeam: selection.team,
          selectedOdds: selection.odds,
          pointSpread: selection.point || null,
          bookmaker: selection.bookmaker || 'Unknown'
        }))
      };

      // Enviar al backend usando la API B2B
      const response = await placeBet(betData);

      if (response.success) {
        // Crear ticket con datos de respuesta
        setBetTicket({
          id: response.data.id,
          betTicketNumber: ticketNumber,
          selections: betData.selections,
          amount: betAmount,
          combinedOdds: parseFloat(combinedOdds),
          potentialWinnings: parseFloat(potentialWinnings.toFixed(2)),
          status: "pending",
          createdAt: new Date().toISOString(),
        });
        
        // Limpiar selecciones después de apostar exitosamente
        alert("¡Apuesta creada exitosamente!");
      }
    } catch (error) {
      console.error("Error creating bet:", error);
      alert(error.message || "Error al crear la apuesta. Intenta de nuevo.");
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

