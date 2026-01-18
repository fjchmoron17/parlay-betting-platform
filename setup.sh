#!/bin/bash
# setup.sh - Script para configurar y ejecutar el proyecto completo

echo "
╔════════════════════════════════════════════╗
║  🎰 PARLAY BETS - SETUP COMPLETO          ║
╚════════════════════════════════════════════╝
"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

echo "✅ Node.js instalado: $(node --version)"
echo ""

# Instalar dependencias del backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install
cd ..

echo ""
echo "╔════════════════════════════════════════════╗
║  ✅ INSTALACIÓN COMPLETADA                 ║
╚════════════════════════════════════════════╝
"

echo ""
echo "📋 PRÓXIMOS PASOS:"
echo ""
echo "1️⃣  Abre DOS terminales:"
echo ""
echo "   Terminal 1 - Frontend:"
echo "   $ npm run dev"
echo ""
echo "   Terminal 2 - Backend:"
echo "   $ cd backend && npm run dev"
echo ""
echo "2️⃣  Accede a:"
echo "   🌐 Frontend: http://localhost:3001"
echo "   🔧 Backend:  http://localhost:5000"
echo ""
echo "3️⃣  Testa los endpoints:"
echo "   curl http://localhost:5000/api/games"
echo ""
