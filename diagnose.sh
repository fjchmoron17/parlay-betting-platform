#!/bin/bash

# Script de diagnóstico para acceso internacional y móvil

echo "🔍 DIAGNÓSTICO DE CONECTIVIDAD"
echo "================================"
echo ""

# 1. Verificar backend local
echo "1️⃣ Verificando backend LOCAL..."
LOCAL_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3333/health 2>/dev/null)
if [[ $LOCAL_RESPONSE == *"HTTP_CODE:200"* ]]; then
    echo "✅ Backend local funciona"
    echo "$LOCAL_RESPONSE" | grep -v "HTTP_CODE"
else
    echo "❌ Backend local no responde"
fi
echo ""

# 2. Verificar variable de entorno del frontend
echo "2️⃣ Variables de entorno del FRONTEND..."
if [ -f ".env" ]; then
    echo "📄 .env (desarrollo):"
    cat .env
fi
echo ""
if [ -f ".env.production" ]; then
    echo "📄 .env.production:"
    cat .env.production
fi
echo ""

# 3. URL del backend en Railway
echo "3️⃣ ¿Cuál es tu URL de backend en Railway?"
echo "   Ve a: https://railway.app/dashboard"
echo "   Copia la URL del backend (debería ser algo como:"
echo "   https://parlay-betting-backend-production.up.railway.app"
echo ""

# 4. Instrucciones
echo "📋 PASOS A SEGUIR:"
echo ""
echo "1. Encuentra tu URL de Railway backend:"
echo "   - Abre Railway Dashboard"
echo "   - Selecciona tu proyecto backend"
echo "   - Ve a Settings → Domains"
echo "   - Copia la URL (ej: https://tu-backend.up.railway.app)"
echo ""
echo "2. Actualiza .env.production con la URL correcta:"
echo "   VITE_API_URL=https://TU-BACKEND-URL.up.railway.app/api"
echo ""
echo "3. En Railway Dashboard → Backend:"
echo "   Asegúrate de tener estas variables:"
echo "   - NODE_ENV=production"
echo "   - ODDS_API_KEY=b033453051de38d16886716c23e1c609"
echo ""
echo "4. Redeploy:"
echo "   git add .env.production"
echo "   git commit -m 'Update backend URL'"
echo "   git push origin main"
echo ""
echo "================================"
