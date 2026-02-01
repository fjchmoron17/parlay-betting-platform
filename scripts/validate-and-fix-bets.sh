#!/bin/bash

# Script para validar y corregir inconsistencias en apuestas
# Llama al endpoint POST /api/bets-db/validate-all
# Este script reconcilia el estado de todas las apuestas con el estado de sus selecciones

PORT="${1:-3333}"
HOST="localhost"
URL="http://${HOST}:${PORT}/api/bets-db/validate-all"

echo "🔍 Validando y corrigiendo apuestas..."
echo "📍 URL: $URL"
echo "⏱️  Timestamp: $(date)"
echo ""

# Ejecutar validación
RESPONSE=$(curl -s -X POST "$URL" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}" \
  -d '{}')

# Separar respuesta y código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Mostrar respuesta
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Validación completada exitosamente"
  echo ""
  echo "$BODY" | jq '.'
  
  # Extraer estadísticas
  TOTAL=$(echo "$BODY" | jq -r '.total_bets // 0')
  FIXED=$(echo "$BODY" | jq -r '.fixed_count // 0')
  ERRORS=$(echo "$BODY" | jq -r '.errors_count // 0')
  
  echo ""
  echo "📊 Estadísticas:"
  echo "   Total de apuestas: $TOTAL"
  echo "   Apuestas corregidas: $FIXED"
  echo "   Errores encontrados: $ERRORS"
  
  if [ "$FIXED" -gt 0 ]; then
    echo ""
    echo "✏️  Apuestas corregidas:"
    echo "$BODY" | jq '.results[] | select(.action == "FIXED") | {bet_id, old_status, new_status, selection_statuses}'
  fi
  
else
  echo "❌ Error en validación (HTTP $HTTP_CODE)"
  echo ""
  echo "$BODY" | jq '.' || echo "$BODY"
fi
