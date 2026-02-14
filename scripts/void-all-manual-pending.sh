#!/bin/bash
# Marca todas las selecciones pendientes de cada juego en resolución manual como void

API_URL=${VITE_API_URL:-http://localhost:3333/api}
ADMIN_ID="admin_user" # Cambia por tu admin real
ADMIN_TOKEN="" # Agrega tu token real aquí

# Obtener todos los juegos pendientes
pending_games=$(curl -s "$API_URL/settlement/pending-manual-games?limit=1000&onlyOverdue=false" | jq -c '.data[]')

for game in $pending_games; do
  home_team=$(echo $game | jq -r '.home_team')
  away_team=$(echo $game | jq -r '.away_team')
  game_commence_time=$(echo $game | jq -r '.game_commence_time')

  # Obtener todas las selecciones pendientes para este juego
  selections=$(curl -s "$API_URL/settlement/pending-manual-resolution?homeTeam=$home_team&awayTeam=$away_team&gameCommenceTime=$game_commence_time" | jq -c '.data[]')

  # Agrupar selecciones por apuesta (bet_id)
  bet_ids=$(echo "$selections" | jq -r '.bet_id' | sort -u)

  for bet_id in $bet_ids; do
    # Construir el array de selecciones a void
    selection_array=$(echo "$selections" | jq -c --arg bid "$bet_id" '[select(.bet_id == ($bid|tonumber)) | {selectionId: .id, result: "void"}]')
    if [ "$selection_array" = "[]" ]; then
      continue
    fi
    echo "Marcando como void: $home_team vs $away_team ($game_commence_time) - Bet $bet_id"
    curl -s -X POST "$API_URL/settlement/resolve-manual" \
      -H "Content-Type: application/json" \
      -H "x-admin-token: $ADMIN_TOKEN" \
      -d '{
        "betId": '$bet_id',
        "selections": '$selection_array',
        "adminNotes": "Marcado como void por script masivo",
        "adminId": "'$ADMIN_ID'"
      }'
  done
done
