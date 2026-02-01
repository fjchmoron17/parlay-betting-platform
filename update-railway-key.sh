#!/bin/bash

# Script para actualizar la API key en Railway usando CLI
echo "🚀 Actualizando ODDS_API_KEY en Railway..."
echo ""

# Verificar si Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI no está instalado"
    echo ""
    echo "Para instalar:"
    echo "npm install -g @railway/cli"
    echo ""
    echo "O usa el dashboard web: https://railway.app"
    exit 1
fi

# Verificar login
echo "1️⃣ Verificando sesión de Railway..."
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ No estás logueado en Railway"
    echo "Ejecuta: railway login"
    exit 1
fi

echo "✅ Sesión activa"
echo ""

# Listar proyectos
echo "2️⃣ Proyectos disponibles:"
railway list
echo ""

# Preguntar por confirmación
echo "3️⃣ Actualizar variable ODDS_API_KEY"
echo "   Nueva key: b033453051de38d16886716c23e1c609"
echo ""
read -p "¿Continuar? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# Actualizar variable
echo ""
echo "⏳ Actualizando variable..."
railway variables --set ODDS_API_KEY=b033453051de38d16886716c23e1c609

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Variable actualizada exitosamente"
    echo ""
    echo "⏳ Railway está haciendo redeploy automático..."
    echo "   Espera 2-3 minutos y ejecuta:"
    echo ""
    echo "   bash check-railway.sh"
    echo ""
else
    echo ""
    echo "❌ Error al actualizar la variable"
    echo ""
    echo "Usa el dashboard web: https://railway.app"
fi
