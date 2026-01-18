#!/bin/bash

# Script para configurar la URL del backend en producción

echo "🔧 CONFIGURACIÓN DE BACKEND URL"
echo "================================"
echo ""
echo "Este script te ayudará a configurar la URL correcta del backend"
echo ""

# Preguntar por la URL del backend
echo "🎯 PASO 1: Obtén la URL de tu backend en Railway"
echo ""
echo "   1. Ve a: https://railway.app/dashboard"
echo "   2. Selecciona tu proyecto BACKEND"
echo "   3. Copia la URL (Settings → Domains)"
echo ""
read -p "Ingresa la URL del backend (sin /api al final): " BACKEND_URL

# Validar que no esté vacío
if [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: Debes ingresar una URL"
    exit 1
fi

# Remover trailing slash si existe
BACKEND_URL=${BACKEND_URL%/}

# Agregar /api
FULL_URL="${BACKEND_URL}/api"

echo ""
echo "📝 URL completa que se usará:"
echo "   $FULL_URL"
echo ""

# Confirmar
read -p "¿Es correcta esta URL? (s/n): " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

# Actualizar .env.production
echo "VITE_API_URL=$FULL_URL" > .env.production

echo ""
echo "✅ Archivo .env.production actualizado!"
echo ""
echo "📄 Contenido:"
cat .env.production
echo ""
echo "🚀 PRÓXIMOS PASOS:"
echo ""
echo "1. Hacer commit:"
echo "   git add .env.production"
echo "   git commit -m 'Update production backend URL'"
echo "   git push origin main"
echo ""
echo "2. En Railway → Frontend → Variables:"
echo "   Agrega: VITE_API_URL=$FULL_URL"
echo ""
echo "3. Espera el deployment (2-5 minutos)"
echo ""
echo "4. Prueba desde móvil"
echo ""
echo "================================"
