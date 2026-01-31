# 🚀 Configuración Final de Railway

## ✅ Cambios Implementados

### 1. API Key Actualizada
- **Nueva API Key**: `b033453051de38d16886716c23e1c609`
- Archivos actualizados localmente:
  - `backend/.env`
  - `backend/.env.production`
  - Todos los archivos de documentación

### 2. Sistema de Apuestas Migrado a B2B
- `ParlayPanel.jsx` ahora usa `placeBet` de `b2bApi.js`
- Sistema integrado con PostgreSQL en Railway
- Endpoints actualizados a `/api/bets-db`

### 3. Autonomous Bet Settlement
- Scheduler configurado (cada 2 horas)
- Auto-inicio en servidor
- UI de control en SuperAdmin

---

## 🔧 Variables de Entorno en Railway

### Backend (parlaybackend-production-b45e)
**CRÍTICO - Actualizar estas variables:**

```env
# API Key de The Odds API (ACTUALIZAR ESTA)
ODDS_API_KEY=b033453051de38d16886716c23e1c609

# Base de datos PostgreSQL (Railway ya la configuró)
DATABASE_URL=postgresql://...

# Configuración del servidor
NODE_ENV=production
PORT=3333

# CORS (URL del frontend)
CORS_ORIGIN=https://parlay-betting-platform-production.up.railway.app

# Odds API
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4

# Auto-settlement (opcional)
AUTO_SETTLE_ENABLED=true
AUTO_SETTLE_CRON=0 */2 * * *
AUTO_SETTLE_ON_STARTUP=false
```

### Frontend (parlay-betting-platform-production)
```env
# URL del backend
VITE_API_URL=https://parlaybackend-production-b45e.up.railway.app/api
```

---

## 📝 Pasos para Actualizar Railway

### 1. Actualizar Backend
1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona el servicio **parlaybackend-production-b45e**
3. Ve a **Variables** tab
4. Actualiza o agrega:
   ```
   ODDS_API_KEY=b033453051de38d16886716c23e1c609
   ```
5. Railway hará **redeploy automáticamente** (espera 2-3 minutos)

### 2. Verificar Frontend
1. El frontend ya está apuntando al backend correcto
2. La variable `VITE_API_URL` debe estar en:
   ```
   https://parlaybackend-production-b45e.up.railway.app/api
   ```
3. Si no existe, agrégala en las Variables del servicio frontend

### 3. Verificar Deployment
Una vez que Railway redeploy:

#### Backend Health Check
```bash
curl https://parlaybackend-production-b45e.up.railway.app/health
```

Debe responder:
```json
{
  "status": "healthy",
  "database": "connected",
  "apiKeyConfigured": true
}
```

#### Probar Endpoint de Juegos
```bash
curl 'https://parlaybackend-production-b45e.up.railway.app/api/games?region=us'
```

Debe retornar juegos sin errores 401.

#### Probar Endpoint de Apuestas
```bash
curl 'https://parlaybackend-production-b45e.up.railway.app/api/bets-db?betting_house_id=1'
```

Debe retornar apuestas existentes.

---

## 🎯 Funcionalidades Verificadas

### ✅ Sistema de Apuestas B2B
- Crear apuestas: `POST /api/bets-db`
- Listar apuestas: `GET /api/bets-db?betting_house_id=X`
- Resolver apuestas: `PUT /api/bets-db/:id/settle`

### ✅ Auto-Resolución
- Scheduler activo (cada 2 horas)
- Usa The Odds API scores endpoint
- Evalúa mercados: h2h, spreads, totals
- Actualiza balance automáticamente

### ✅ Reportes Diarios
- Comisión: 5% sobre total_wagered
- Ganancias netas calculadas
- Dashboard en portal de casas

---

## 🐛 Troubleshooting

### Error 401 en The Odds API
**Causa**: API key no actualizada en Railway
**Solución**: Verificar que `ODDS_API_KEY` en Variables sea la nueva

### Apuestas no se muestran
**Causa**: Frontend usando endpoint antiguo `/api/bets`
**Solución**: Ya corregido en último commit (usa `/api/bets-db`)

### Database connection failed
**Causa**: Railway no ha configurado PostgreSQL
**Solución**: Agregar PostgreSQL plugin en Railway y copiar DATABASE_URL

### CORS errors
**Causa**: `CORS_ORIGIN` mal configurado
**Solución**: Debe ser la URL exacta del frontend en Railway (sin trailing slash)

---

## 📊 Monitoreo

### Logs de Railway
```bash
# Backend logs
railway logs --service parlaybackend-production-b45e

# Frontend logs  
railway logs --service parlay-betting-platform-production
```

### Verificar Scheduler
Desde SuperAdmin panel:
1. Login como superadmin
2. Ve a pestaña "🎯 Resolución Auto"
3. Verifica que el scheduler esté "Activo"
4. Próxima ejecución debe mostrarse

### Verificar Cuota de API
En SuperAdmin panel:
1. Ve a pestaña "📊 Cuota API"
2. Verifica remaining requests
3. Monitorea uso diario

---

## 🔐 Credenciales Actualizadas

### The Odds API
- **API Key**: `b033453051de38d16886716c23e1c609`
- **Plan**: Free tier (500 requests/mes)
- **Endpoint**: https://api.the-odds-api.com/v4

### Base de Datos
- **Proveedor**: Railway PostgreSQL
- **Conexión**: Via DATABASE_URL (auto-configurada)

---

## ✨ Próximos Pasos

1. ✅ Actualizar `ODDS_API_KEY` en Railway backend
2. ✅ Esperar redeploy automático
3. ✅ Verificar que `/api/games` retorne datos
4. ✅ Probar crear apuesta desde frontend
5. ✅ Verificar que apuestas se listen correctamente
6. ✅ Confirmar que scheduler esté activo

---

## 📞 Soporte

Si hay problemas:
1. Revisar logs de Railway
2. Verificar variables de entorno
3. Probar endpoints con curl
4. Revisar consola del navegador (F12) para errores del frontend

---

**Última actualización**: 31 de enero de 2026
**Versión**: 2.0.0 (Sistema B2B con Auto-Settlement)
