import React from "react";
import BetTicket from "./BetTicket";

// Ticket de prueba con selecciones de todos los tipos: h2h, spread y totales
const testBet = {
  id: "BET-TEST-ALL-TYPES",
  createdAt: new Date().toISOString(),
  amount: 100,
  selections: [
    // H2H
    {
      home_team: "Real Madrid",
      away_team: "Barcelona",
      league: "La Liga",
      market: "h2h",
      selected_team: "Real Madrid",
      selected_odds: 2.10,
      game_commence_time: new Date().toISOString(),
      selection_status: "won"
    },
    // Spread
    {
      home_team: "Lakers",
      away_team: "Celtics",
      league: "NBA",
      market: "spreads",
      selected_team: "Lakers",
      selected_odds: 1.95,
      point_spread: -4.5,
      game_commence_time: new Date().toISOString(),
      selection_status: "lost"
    },
    // Totales (fútbol)
    {
      home_team: "Liverpool",
      away_team: "Chelsea",
      league: "Premier League",
      market: "total_goles",
      over_under_type: "over",
      over_under_value: 2.5,
      selected_team: "OVER",
      selected_odds: 1.85,
      game_commence_time: new Date().toISOString(),
      selection_status: "won"
    },
    // Totales (tenis)
    {
      home_team: "Djokovic",
      away_team: "Nadal",
      league: "ATP Finals",
      market: "total_juegos",
      over_under_type: "under",
      over_under_value: 21.5,
      selected_team: "UNDER",
      selected_odds: 2.00,
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
