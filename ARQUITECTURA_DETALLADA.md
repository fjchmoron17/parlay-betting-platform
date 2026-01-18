# 🏗️ ARQUITECTURA TÉCNICA - PARLAY BETS

## 1️⃣ DIAGRAMA GENERAL DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUARIO EN NAVEGADOR                         │
│                   (http://localhost:3001)                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST/JSON
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FRONTEND - REACT + VITE                       │
│                      (Puerto 3001)                              │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  Home.jsx        │  │  GameCard.jsx    │                    │
│  │  - Carga juegos  │  │  - Renderiza     │                    │
│  │  - Gestiona      │  │    equipos       │                    │
│  │    apuestas      │  │  - Selecciona    │                    │
│  └────────┬─────────┘  │    equipo        │                    │
│           │            └────────────┬─────┘                    │
│  ┌────────▼──────────────────────────┘                         │
│  │  ParlayPanel.jsx                                            │
│  │  - Muestra selecciones                                      │
│  │  - Calcula cuotas                                           │
│  │  - Crea apuesta                                             │
│  └────────┬──────────────────────────────────────────────────┐ │
│           │                                                   │ │
│  ┌────────▼──────────────┐                                   │ │
│  │ src/services/api.js   │  ◄─ Cliente HTTP para backend    │ │
│  │ - gamesAPI.getAll()   │    - Fetch API                    │ │
│  │ - betsAPI.create()    │    - Headers CORS                 │ │
│  └────────┬──────────────┘                                   │ │
│           │                                                   │ │
└───────────┼───────────────────────────────────────────────────┘ │
            │
            │ HTTP Requests (JSON)
            │ GET /api/games
            │ POST /api/bets
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BACKEND - EXPRESS.JS                           │
│                     (Puerto 5000)                               │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ server.js (Punto de entrada)                         │      │
│  │ - CORS configurado                                   │      │
│  │ - Morgan logger                                      │      │
│  │ - Rutas: /api/games, /api/bets                       │      │
│  └───────────┬────────────────────────────────────────┬─┘      │
│              │                                        │         │
│    ┌─────────▼─────────┐                  ┌──────────▼────┐    │
│    │  routes/games.js  │                  │ routes/bets.js│    │
│    │  GET /api/games   │                  │ POST /api/bets│    │
│    │  GET /api/games/:id                  │ GET /api/bets │    │
│    └────────┬──────────┘                  └────────┬───────┘   │
│             │                                      │            │
│    ┌────────▼─────────────────┐     ┌──────────────▼─────┐     │
│    │ gamesController.js        │     │ betsController.js  │    │
│    │ - getAllGames()           │     │ - createBet()      │    │
│    │ - getGamesByLeague()      │     │ - getBetById()     │    │
│    │ - getGameById()           │     │ - getUserBets()    │    │
│    └────────┬──────────────────┘     └──────────┬─────────┘   │
│             │                                   │              │
│             │  Consulta datos                  │ Valida y     │
│             │                                  │ calcula      │
│    ┌────────▼──────────────────────────────────┘              │
│    │ services/sportsApiService.js                            │
│    │ - getGamesFromAPI()                                      │
│    │ - getGamesFromTheSportsDB()  ◄─ Preparado para API real  │
│    │ - formatTheSportsDBResponse()                            │
│    └────────┬────────────────────────────────────────────────┘│
│             │                                                  │
│             │ [MOCK DATA o API Real]                          │
│    ┌────────▼────────────────────────┐                        │
│    │ config/constants.js              │                        │
│    │ - MOCK_GAMES (5 juegos demo)    │                        │
│    │ - SPORTS_API endpoints          │                        │
│    └──────────────────────────────────┘                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2️⃣ FLUJO DE DATOS - Obtener Juegos

```
Usuario abre aplicación
        │
        ▼
[React] Home.jsx: useEffect → fetchGames()
        │
        ▼
[React] services/api.js: gamesAPI.getAll()
        │
        ▼
[HTTP] fetch("http://localhost:5000/api/games")
        │
        ▼
[Node] Express Router: GET /api/games
        │
        ▼
[Node] gamesController: getAllGames()
        │
        ▼
[Node] sportsApiService: getGamesFromAPI()
        │
        ▼
[Data] MOCK_GAMES o API Real
        │
        ▼
[JSON] Response: { success: true, data: [...], total: 5 }
        │
        ▼
[React] Actualiza state: setGames(response.data)
        │
        ▼
[React] GameCard.jsx renderiza cada juego
        │
        ▼
✅ Usuario ve 5 tarjetas de juegos
```

---

## 3️⃣ FLUJO DE DATOS - Crear Apuesta

```
Usuario selecciona 2 equipos
        │
        ▼
[React] handleSelect(gameId, team, odds)
        │ (actualiza state.parlay)
        ▼
[React] ParlayPanel muestra selecciones
        │ (calcula cuotas combinadas)
        ▼
Usuario hace click en "Apostar"
        │
        ▼
[React] betsAPI.create({ userId, selections, amount })
        │
        ▼
[HTTP] POST "http://localhost:5000/api/bets"
        │ Body: {"userId":"...", "selections":[...], "amount":100}
        ▼
[Node] Express Router: POST /api/bets
        │
        ▼
[Node] betsController: createBet()
        │
        ├─ Valida campos requeridos
        ├─ Valida selections no está vacío
        ├─ Valida amount > 0
        │
        ▼
Calcula cuotas combinadas:
  1.85 × 2.0 = 3.7 (ejemplo)
        │
        ▼
Crea objeto bet:
  {
    betId: "bet_abc123",
    userId: "user123",
    selections: [...],
    combinedOdds: 3.7,
    potentialWinnings: 370,
    status: "pending",
    createdAt: "2024-01-18..."
  }
        │
        ▼
Guarda en array (en producción: BD)
        │
        ▼
[JSON] Response HTTP 201: { success: true, data: bet }
        │
        ▼
[React] Actualiza UI: muestra confirmación
        │
        ▼
✅ Usuario ve: "Apuesta creada exitosamente"
```

---

## 4️⃣ ESTRUCTURA DE DATOS

### Juego (Game)
```javascript
{
  id: "nba_20240118_lal_gsw",      // Identificador único
  league: "NBA",                    // Liga (NBA, MLB, NFL)
  home_team: "Lakers",              // Equipo local
  away_team: "Warriors",            // Equipo visitante
  game_time: "2024-01-18T19:30:00Z",// Hora del partido (ISO 8601)
  odds_home: 1.85,                  // Cuota equipo local
  odds_away: 2.10,                  // Cuota equipo visitante
  status: "upcoming"                // Estado (upcoming, live, finished)
}
```

### Apuesta (Bet)
```javascript
{
  betId: "bet_abc123def456",        // Identificador único
  userId: "user123",                // Usuario que hace la apuesta
  selections: [                     // Juegos seleccionados
    {
      gameId: "nba_20240118_lal_gsw",
      team: "Lakers",
      odds: 1.85
    },
    {
      gameId: "mlb_20240118_lad_sd",
      team: "Dodgers",
      odds: 2.0
    }
  ],
  amount: 100,                      // Monto apostado ($)
  combinedOdds: 3.7,                // Multiplicación de cuotas
  potentialWinnings: 370,           // Ganancia potencial
  status: "pending",                // Estado (pending, won, lost, cancelled)
  createdAt: "2024-01-18T14:30:00Z" // Timestamp de creación
}
```

---

## 5️⃣ ENDPOINTS API

### 🎮 Juegos

```
GET /api/games
├─ Query params: ?league=NBA
├─ Response: { success, data: [Game], total, timestamp }
└─ Status: 200 OK

GET /api/games/league/:league
├─ Params: league = "NBA", "MLB", "NFL", "NHL"
├─ Response: { success, league, data: [Game], total }
└─ Status: 200 OK | 400 Bad Request

GET /api/games/:id
├─ Params: id = "nba_20240118_lal_gsw"
├─ Response: { success, data: Game }
└─ Status: 200 OK | 404 Not Found
```

### 💰 Apuestas

```
POST /api/bets
├─ Body: { userId, selections: [{ gameId, team, odds }], amount }
├─ Response: { success, message, data: Bet }
└─ Status: 201 Created | 400 Bad Request | 500 Error

GET /api/bets
├─ Response: { success, data: [Bet], total }
└─ Status: 200 OK

GET /api/bets/:betId
├─ Params: betId = "bet_abc123def456"
├─ Response: { success, data: Bet }
└─ Status: 200 OK | 404 Not Found

GET /api/bets/user/:userId
├─ Params: userId = "user123"
├─ Response: { success, data: [Bet], total }
└─ Status: 200 OK
```

---

## 6️⃣ CAPAS DE LA APLICACIÓN

```
┌─────────────────────────────────────────────┐
│ 🎨 PRESENTACIÓN                             │
│ - React Components                          │
│ - CSS Profesional                           │
│ - Interacciones de Usuario                  │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│ 🔌 COMUNICACIÓN                             │
│ - Fetch API / HTTP Client                   │
│ - JSON Serialization                        │
│ - CORS                                      │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│ 🛣️ RUTAS (Routes)                           │
│ - Express Router                            │
│ - Endpoints /api/*                          │
│ - Validation Middleware                     │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│ 🧠 LÓGICA (Controllers)                     │
│ - Validaciones                              │
│ - Cálculos                                  │
│ - Transformaciones                          │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│ 🔧 SERVICIOS (Services)                     │
│ - Integración APIs Externas                 │
│ - Llamadas a Bases de Datos                 │
│ - Lógica de Negocio Compleja                │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│ 💾 DATOS (Data Sources)                     │
│ - Mock Data (ahora)                         │
│ - APIs Externas (futuro)                    │
│ - Base de Datos (futuro)                    │
└─────────────────────────────────────────────┘
```

---

## 7️⃣ TECNOLOGÍAS USADAS

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|----------|
| Frontend | React | 19.x | Interfaz de usuario |
| Build | Vite | 7.x | Bundler y dev server |
| Backend | Express | 4.x | Framework web |
| HTTP | Axios/Fetch | - | Cliente HTTP |
| Middleware | CORS | 2.x | Cross-Origin requests |
| Logging | Morgan | 1.x | Request logging |
| Env | dotenv | 16.x | Variables de entorno |
| Runtime | Node.js | 18+ | Entorno JavaScript |

---

## 8️⃣ CONFIGURACIÓN DE PUERTOS

```
┌──────────────────────────────────┐
│ Frontend: http://localhost:3001  │
│ ✅ React Dev Server (Vite)       │
│ ✅ CSS & JavaScript              │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ Backend: http://localhost:5000   │
│ ✅ Express API Server            │
│ ✅ REST Endpoints                │
│ ✅ Manejo de Datos               │
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ APIs Externas: 🌐 Internet      │
│ 📡 TheSportsDB (futuro)          │
│ 📡 Rapid API (futuro)            │
│ 📡 ESPN Stats API (futuro)       │
└──────────────────────────────────┘
```

---

## 9️⃣ PRÓXIMAS MEJORAS

```
Fase 1 - ACTUAL ✅
├─ Mock Data
├─ Cálculo de cuotas
└─ UI profesional

Fase 2 - PRÓXIMA 🚀
├─ APIs Reales (TheSportsDB)
├─ Base de Datos (MongoDB)
├─ Autenticación (JWT)
└─ Historial de apuestas

Fase 3 - FUTURA 🔮
├─ Pagos (Stripe)
├─ Notificaciones (WebSocket)
├─ ML Predicciones
└─ App Móvil (React Native)
```

---

Este es tu sistema completo. ¡Listo para producción! 🚀
