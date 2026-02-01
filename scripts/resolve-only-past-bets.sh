#!/bin/bash

# Script correcto para resolver SOLO apuestas con partidos que ya han pasado
# No toca apuestas con partidos futuros o en curso

BACKEND="https://parlaybackend-production-b45e.up.railway.app"

echo "🔍 Analizando selecciones pendientes..."
echo ""

# Obtener selecciones pendientes con fecha de inicio del partido
PENDING=$(curl -s "${BACKEND}/api/bets-db/pending")

echo "$PENDING" | jq -r '.bets[] | .selections[] | select(.selection_status == "pending") | "\(.id)|\(.home_team)|\(.away_team)|\(.game_commence_time)"' | while IFS='|' read -r SEL_ID HOME AWAY GAME_TIME; do
  
  # Convertir la fecha del partido a timestamp
  GAME_TIMESTAMP=$(date -j -f "%Y-%m-%dT%H:%M:%SZ" "$GAME_TIME" +%s 2>/dev/null)
  NOW_TIMESTAMP=$(date +%s)
  
  if [ -z "$GAME_TIMESTAMP" ]; then
    echo "⚠️  No se pudo parsear fecha: $GAME_TIME para $HOME vs $AWAY"
    continue
  fi
  
  # Comparar: si el partido ya pasó (hace más de 6 horas), resolver como lost
  HOURS_AGO=$(( (NOW_TIMESTAMP - GAME_TIMESTAMP) / 3600 ))
  
  if [ $HOURS_AGO -gt 6 ]; then
    echo "✅ $HOME vs $AWAY (hace $HOURS_AGO horas) → RESOLVIENDO como LOST"
    curl -s -X POST "${BACKEND}/api/bets-db/resolve-selection" \
      -H "Content-Type: application/json" \
      -d "{\"selectionId\": $SEL_ID, \"status\": \"lost\"}" > /dev/null
  else
    HOURS_REMAINING=$(( 6 - HOURS_AGO ))
    echo "⏳ $HOME vs $AWAY (en $HOURS_REMAINING horas) → NO TOCAR"
  fi
done

echo ""
echo "✅ Resolución segura completada"
