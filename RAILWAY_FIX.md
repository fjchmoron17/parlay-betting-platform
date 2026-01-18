# 🔧 FIX RAILWAY - Variable de Entorno

## Problema Detectado
El frontend en Railway está usando `http://localhost:3333/api` en lugar del backend correcto.

## Solución: Configurar Variable en Railway

1. **Ir al Dashboard de Railway**: https://railway.app/dashboard
2. **Seleccionar el proyecto**: `parlay-betting-platform-production`
3. **Ir a la pestaña "Variables"**
4. **Agregar nueva variable**:
   - Name: `VITE_API_URL`
   - Value: `https://parlaybackend-production-b45e.up.railway.app/api`
5. **Guardar** - Railway redesplegará automáticamente

## Verificación
Después del redespliegue (2-3 minutos), el frontend debería conectarse al backend correcto.

## Backend Verificado ✅
- Health: https://parlaybackend-production-b45e.up.railway.app/health
- Deportes: https://parlaybackend-production-b45e.up.railway.app/api/games/sports
- Juegos: https://parlaybackend-production-b45e.up.railway.app/api/games
