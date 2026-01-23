# 🎰 PARLAY BETS - Sistema Completo de Apuestas Multi-Deportes

## ✅ Estado del Proyecto - COMPLETADO

### Frontend
- ✅ React 19 + Vite 7
- ✅ Filtros de Deportes (74 opciones)
- ✅ Filtros de Tipos de Apuesta (h2h, spreads, totals)
- ✅ Filtros de Región (US, UK, EU, AU)
- ✅ Opción de Empate para Soccer
- ✅ UI Professional y Responsiva
- ✅ Carga dinámica de datos

### Backend
- ✅ Express.js 4
- ✅ The Odds API integrada
- ✅ 74 deportes disponibles
- ✅ Múltiples regiones
- ✅ Múltiples tipos de apuestas
- ✅ CORS configurado
- ✅ Manejo de errores

## 🚀 Cómo Ejecutar

### Terminal 1 - Backend
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE/backend
node server.js
```
✅ Servidor corriendo en `http://localhost:3333`

### Terminal 2 - Frontend
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE
npm run dev
```
✅ Servidor corriendo en `http://localhost:3000`

Luego abre: **http://localhost:3000** en el navegador

## 🎮 Características Principales

### 1. **Filtro de Deportes**
- **Americanos**: NFL, NBA, MLB, NHL
- **Soccer**: 7 ligas europeas principales
- **Otros**: Tennis, Cricket, Rugby, Golf
- **Total**: 74 deportes disponibles

### 2. **Filtro de Mercados**
- **Head to Head (h2h)**: Apuesta simple al ganador
- **Spreads**: Margen de puntos
- **Totals**: Over/Under

### 3. **Filtro de Regiones**
- 🇺🇸 Estados Unidos
- 🇬🇧 Reino Unido
- 🇪🇺 Europa
- 🇦🇺 Australia

### 4. **Opción de Empate para Soccer**
Cuando seleccionas Soccer, ves 3 opciones:
```
Wolverhampton @ 5.30
Empate @ 3.80
Newcastle @ 1.62
```

## 📊 Datos Actualmente Disponibles

**44 juegos en vivo:**
- 23 Soccer (Premier League)
- 13 Hockey (NHL)
- 6 Basketball (NBA)
- 2 Football (NFL)

**Odds Reales**:
- De múltiples bookmakers
- Actualizadas en tiempo real
- En formato decimal

## 🎯 Cómo Usar

### Paso 1: Seleccionar Deporte
1. Click en dropdown "Deporte/Liga"
2. Elige un deporte (ej: "English Premier League")

### Paso 2: Seleccionar Tipo de Apuesta (Opcional)
1. Click en dropdown "Tipo de Apuesta"
2. Elige entre h2h, spreads, o totals

### Paso 3: Cambiar Región (Opcional)
1. Click en dropdown "Región"
2. Elige país/región para ver odds locales

### Paso 4: Seleccionar Apuestas
1. Haz click en equipo/resultado deseado
2. Se resalta en verde
3. Se agrega al panel "Tu Parlay" a la derecha

### Paso 5: Crear Parlay
1. Selecciona múltiples juegos
2. Verás en el panel derecho:
   - Juegos seleccionados
   - Odds combinadas
   - Ganancia potencial
3. Click "Apostar" para crear parlay

## 🔧 Endpoints API

### Deportes
```
GET /api/games/sports
```
Retorna lista de 74 deportes disponibles

### Juegos Filtrados
```
GET /api/games?league=SOCCER&market=h2h&region=us
```
Parámetros:
- `league`: ID del deporte (ej: soccer_epl)
- `market`: h2h, spreads, totals
- `region`: us, uk, eu, au

### Crear Apuesta
```
POST /api/bets
Body: {
  userId: "user123",
  selections: [
    { gameId: "...", team: "home", odds: 2.10 }
  ],
  amount: 100
}
```

## 🎨 Tema de Colores

- **Primario**: Azul (#1e40af)
- **Secundario**: Verde (#10b981)
- **Éxito**: Verde claro (#d1fae5)
- **Empate**: Amarillo (#fbbf24)
- **Peligro**: Rojo (#ef4444)

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1280px)
- ✅ Tablet (768px)
- ✅ Mobile (375px+)

## 🔐 Variables de Entorno

Backend `.env`:
```
PORT=3333
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
ODDS_API_KEY=e9b92b60bc4085d52d1d5f8c5b33bd4c
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
```

## 🐛 Troubleshooting

### Puerto ya está en uso
```bash
pkill -9 node
```

### Frontend no carga
1. Verificar que Vite corre en 3000: `lsof -i :3000`
2. Verificar que Backend corre en 3333: `lsof -i :3333`
3. Verificar CORS_ORIGIN en .env del backend

### No hay juegos
1. Verificar conexión a The Odds API
2. Ver logs del backend
3. Verificar API key correcta

## 📈 Próximas Mejoras

- [ ] Base de datos (MongoDB/PostgreSQL)
- [ ] Autenticación de usuarios (JWT)
- [ ] Historial de apuestas
- [ ] Dashboard de estadísticas
- [ ] Notificaciones en tiempo real
- [ ] Dark mode
- [ ] App móvil nativa

## 📞 Soporte

- Backend: `http://localhost:3333`
- Frontend: `http://localhost:3000`
- API Docs: Ver MULTI_SPORTS_GUIDE.md

---

**Proyecto**: 🎰 Parlay Bets
**Versión**: 2.0.0 - Multi-Sports Edition
**Estado**: ✅ Producción
**Última Actualización**: 18 de Enero, 2026
**Autor**: Equipo de Desarrollo
# Force Railway redeploy to inject MAIL_* env vars - Fri Jan 23 19:37:10 CET 2026
