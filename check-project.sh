#!/bin/bash
# check-project.sh - Script para verificar que todo está correctamente configurado

echo "╔════════════════════════════════════════════════════╗"
echo "║   🔍 VERIFICACIÓN DEL PROYECTO PARLAY BETS       ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contadores
PASSED=0
FAILED=0

# Función para verificar archivos
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $1 (NO ENCONTRADO)"
        ((FAILED++))
    fi
}

# Función para verificar directorios
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
        ((PASSED++))
    else
        echo -e "${RED}❌${NC} $1/ (NO ENCONTRADO)"
        ((FAILED++))
    fi
}

echo "📦 Verificando estructura del Frontend..."
echo ""
check_file "package.json"
check_file "src/App.jsx"
check_file "src/index.jsx"
check_file "src/index.css"
check_file "src/services/api.js"
check_dir "src/components"
check_dir "src/pages"

echo ""
echo "📦 Verificando estructura del Backend..."
echo ""
check_file "backend/server.js"
check_file "backend/package.json"
check_file "backend/.env"
check_dir "backend/config"
check_dir "backend/controllers"
check_dir "backend/services"
check_dir "backend/routes"
check_dir "backend/middleware"

echo ""
echo "📚 Verificando documentación..."
echo ""
check_file "README_FULL.md"
check_file "ARCHITECTURE.md"
check_file "ARQUITECTURA_DETALLADA.md"
check_file "INSTRUCCIONES.md"
check_file "RESUMEN_FINAL.md"

echo ""
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "✅ Pasadas: ${GREEN}${PASSED}${NC}"
echo -e "❌ Fallidas: ${RED}${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ¡TODO ESTÁ CONFIGURADO CORRECTAMENTE!${NC}"
    echo ""
    echo "Próximo paso:"
    echo "1. Terminal 1: npm run dev        # Frontend"
    echo "2. Terminal 2: cd backend && npm run dev  # Backend"
    echo ""
else
    echo -e "${RED}⚠️  Hay archivos faltantes. Revisa la estructura.${NC}"
fi

echo "═══════════════════════════════════════════════════"
