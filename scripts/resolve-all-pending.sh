#!/bin/bash

# Script para resolver automáticamente todas las selecciones pendientes
# En un sistema de apuestas real, TODAS las apuestas deben estar resueltas 100%

PORT="${1:-3333}"
BACKEND_URL="https://parlaybackend-production-b45e.up.railway.app"

echo "🎯 Resolución Masiva de Selecciones Pendientes"
echo "================================================"
echo "🔍 Buscando selecciones pendientes..."
echo ""

# Obtener todas las selecciones pendientes
PENDING=$(curl -s "${BACKEND_URL}/api/bets-db/pending")

TOTAL_BETS=$(echo "$PENDING" | jq -r '.total_bets_with_pending // 0')
TOTAL_PENDING=$(echo "$PENDING" | jq -r '.total_pending_selections // 0')

echo "📊 Estadísticas:"
echo "   • Apuestas con pendientes: $TOTAL_BETS"
echo "   • Total de selecciones pendientes: $TOTAL_PENDING"
echo ""

if [ "$TOTAL_PENDING" = "0" ] || [ "$TOTAL_PENDING" = "null" ]; then
  echo "✅ ¡Sin selecciones pendientes! Sistema 100% resuelto."
  exit 0
fi

echo "⚠️  IMPORTANTE: Este script resuelve selecciones pendientes como 'lost'"
echo "   Esto es porque los partidos ya pasaron y no se resolvieron"
echo "   Si necesitas resolver como 'won', usa el endpoint manualmente"
echo ""

read -p "¿Continuar? (s/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "Cancelado."
  exit 1
fi

echo ""
echo "🔄 Resolviendo selecciones..."
echo ""

# Extraer IDs de selecciones pendientes
SELECTION_IDS=$(echo "$PENDING" | jq -r '.bets[] | .selections[] | select(.selection_status == "pending") | .id')

RESOLVED=0
FAILED=0

for SEL_ID in $SELECTION_IDS; do
  echo -n "   Resolviendo selección $SEL_ID... "
  
  RESPONSE=$(curl -s -X POST "${BACKEND_URL}/api/bets-db/resolve-selection" \
    -H "Content-Type: application/json" \
    -d "{\"selectionId\": $SEL_ID, \"status\": \"lost\"}")
  
  SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
  
  if [ "$SUCCESS" = "true" ]; then
    BET_ID=$(echo "$RESPONSE" | jq -r '.bet.id')
    NEW_STATUS=$(echo "$RESPONSE" | jq -r '.bet.new_status')
    echo "✅ (Apuesta $BET_ID → $NEW_STATUS)"
    RESOLVED=$((RESOLVED + 1))
  else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "Error desconocido"')
    echo "❌ Error: $ERROR"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "📈 Resultados:"
echo "   ✅ Resolvidas: $RESOLVED"
echo "   ❌ Errores: $FAILED"
echo ""

# Verificar estado final
echo "🔍 Verificando estado final..."
FINAL=$(curl -s "${BACKEND_URL}/api/bets-db/pending")
REMAINING=$(echo "$FINAL" | jq -r '.total_pending_selections // 0')

if [ "$REMAINING" = "0" ] || [ "$REMAINING" = "null" ]; then
  echo "✅ ¡ÉXITO! Sistema 100% resuelto. No hay selecciones pendientes."
else
  echo "⚠️  Aún hay $REMAINING selecciones pendientes"
fi
