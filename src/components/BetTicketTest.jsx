import React from "react";
import BetTicket from "./BetTicket";

// Ticket de prueba con selecciones de diferentes tipos de totales
const testBet = {
  id: "BET-TEST-12345",
  createdAt: new Date().toISOString(),
  amount: 100,
  selections: [
    {
      home_team: "Real Madrid",
      away_team: "Barcelona",
      league: "La Liga",
      market: "total_goles",
      over_under_type: "over",
      over_under_value: 2.5,
      selected_team: "OVER",
      selected_odds: 1.95,
      game_commence_time: new Date().toISOString(),
      selection_status: "won"
    },
    {
      home_team: "Lakers",
      away_team: "Celtics",
      league: "NBA",
      market: "total_puntos",
      over_under_type: "under",
      over_under_value: 210.5,
      selected_team: "UNDER",
      selected_odds: 1.85,
      game_commence_time: new Date().toISOString(),
      selection_status: "lost"
    },
    {
      home_team: "Djokovic",
      away_team: "Nadal",
      league: "ATP Finals",
      market: "total_juegos",
      over_under_type: "over",
      over_under_value: 22.5,
      selected_team: "OVER",
      selected_odds: 1.90,
      game_commence_time: new Date().toISOString(),
      selection_status: "won"
    },
    {
      home_team: "Alcaraz",
      away_team: "Sinner",
      league: "ATP Masters",
      market: "total_sets",
      over_under_type: "under",
      over_under_value: 3.5,
      selected_team: "UNDER",
      selected_odds: 2.10,
      game_commence_time: new Date().toISOString(),
      selection_status: "void"
    }
  ]
};

export default function BetTicketTest() {
  return (
    <div style={{ background: '#222', minHeight: '100vh', padding: 40 }}>
      <BetTicket bet={testBet} onClose={() => {}} />
    </div>
  );
}
