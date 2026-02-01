#!/bin/bash

# Script para verificar y actualizar Railway
# Ejecutar: bash check-railway.sh

echo "🔍 Verificando Railway Backend..."
echo ""

# 1. Verificar salud del backend
echo "1️⃣ Health Check:"
HEALTH=$(curl -s 'https://parlaybackend-production-b45e.up.railway.app/health')
echo "$HEALTH" | jq '.'
echo ""

# 2. Verificar si la API key está configurada
API_KEY_LENGTH=$(echo "$HEALTH" | jq -r '.apiKeyLength')
if [ "$API_KEY_LENGTH" != "32" ]; then
  echo "❌ ERROR: API key no tiene 32 caracteres"
  echo "   Longitud actual: $API_KEY_LENGTH"
else
  echo "✅ API key tiene la longitud correcta (32 caracteres)"
fi
echo ""

# 3. Probar endpoint de juegos
echo "2️⃣ Probando endpoint de juegos (NBA):"
GAMES=$(curl -s 'https://parlaybackend-production-b45e.up.railway.app/api/games?region=us&sport=basketball_nba')
GAME_COUNT=$(echo "$GAMES" | jq '.data | length')
echo "   Juegos encontrados: $GAME_COUNT"

if [ "$GAME_COUNT" == "0" ]; then
  echo "   ❌ No se encontraron juegos"
  echo ""
  echo "3️⃣ Verificando API key directamente:"
  
  # Probar con la nueva key
  DIRECT_TEST=$(curl -s 'https://api.the-odds-api.com/v4/sports/basketball_nba/odds?apiKey=b033453051de38d16886716c23e1c609&regions=us&markets=h2h&oddsFormat=decimal')
  DIRECT_COUNT=$(echo "$DIRECT_TEST" | jq '. | length')
  
  echo "   Juegos con nueva key (b033...): $DIRECT_COUNT"
  
  if [ "$DIRECT_COUNT" -gt "0" ]; then
    echo ""
    echo "🎯 SOLUCIÓN:"
    echo "   La nueva API key funciona, pero Railway no la tiene actualizada."
    echo ""
    echo "   Pasos para corregir:"
    echo "   1. Ve a https://railway.app"
    echo "   2. Selecciona 'parlaybackend-production-b45e'"
    echo "   3. Variables → Busca ODDS_API_KEY"
    echo "   4. Actualiza a: b033453051de38d16886716c23e1c609"
    echo "   5. Railway redeploy automáticamente (espera 2-3 min)"
    echo ""
  fi
else
  echo "   ✅ Backend funcionando correctamente"
  echo ""
  echo "   Muestra de juegos:"
  echo "$GAMES" | jq '.data[0] | {home: .home_team, away: .away_team, league}'
fi

echo ""
echo "4️⃣ Verificar lista de deportes:"
SPORTS=$(curl -s 'https://parlaybackend-production-b45e.up.railway.app/api/games/sports')
SPORTS_COUNT=$(echo "$SPORTS" | jq '.data | length')
echo "   Deportes disponibles: $SPORTS_COUNT"

if [ "$SPORTS_COUNT" -gt "0" ]; then
  echo "   ✅ API key funciona parcialmente (puede leer deportes)"
else
  echo "   ❌ No se pueden leer deportes (API key incorrecta)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Variables que deben estar en Railway Backend:"
echo ""
echo "ODDS_API_KEY=b033453051de38d16886716c23e1c609"
echo "ODDS_API_BASE_URL=https://api.the-odds-api.com/v4"
echo "NODE_ENV=production"
echo "DATABASE_URL=postgresql://..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
