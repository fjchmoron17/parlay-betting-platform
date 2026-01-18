# 🎰 PARLAY BETS - Full Stack Sports Betting Platform

Una plataforma de apuestas tipo parlay con React frontend y Express backend, integrando APIs reales de deportes (NBA, MLB, NFL).

## 🚀 Características

- ✅ Frontend React moderno con Vite
- ✅ Backend Express con APIs deportivas
- ✅ Datos en tiempo real (NBA, MLB, NFL)
- ✅ Sistema de cálculo de cuotas combinadas
- ✅ Interfaz profesional con CSS puro
- ✅ Tarjetas intercaladas por colores
- ✅ Gestión de apuestas
- ✅ Validaciones en frontend y backend

## 📁 Estructura del Proyecto

```
PARLAY_SITE/
├── src/                          # Frontend React
│   ├── components/
│   │   ├── GameCard.jsx         # Tarjeta de juego
│   │   └── ParlayPanel.jsx      # Panel de apuestas
│   ├── pages/
│   │   └── Home.jsx             # Página principal
│   ├── services/
│   │   └── api.js               # Cliente HTTP para backend
│   ├── App.jsx
│   ├── index.jsx
│   ├── index.css                # Estilos profesionales
│   └── vite.config.js
│
├── backend/                      # Backend Express
│   ├── config/
│   │   └── constants.js         # Constantes y datos mock
│   ├── controllers/
│   │   ├── gamesController.js   # Lógica de juegos
│   │   └── betsController.js    # Lógica de apuestas
│   ├── services/
│   │   └── sportsApiService.js  # Integración con APIs
│   ├── routes/
│   │   ├── games.js             # Rutas de juegos
│   │   └── bets.js              # Rutas de apuestas
│   ├── middleware/
│   │   └── errorHandler.js      # Manejo de errores
│   ├── server.js                # Punto de entrada
│   ├── package.json
│   └── .env
│
├── ARCHITECTURE.md              # Documentación técnica
├── setup.sh                      # Script de instalación
├── package.json                  # Frontend deps
└── README.md                     # Este archivo
```

## 🛠️ Instalación Rápida

### Opción 1: Automática (Recomendado)

```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE
bash setup.sh
```

### Opción 2: Manual

**1. Instalar dependencias del Frontend:**
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE
npm install
```

**2. Instalar dependencias del Backend:**
```bash
cd backend
npm install
cd ..
```

## ▶️ Ejecución

**Terminal 1 - Frontend (Puerto 3001):**
```bash
npm run dev
```

**Terminal 2 - Backend (Puerto 5000):**
```bash
cd backend
npm run dev
```

## 🌐 URLs Disponibles

- **Frontend**: http://localhost:3001
- **Backend Health**: http://localhost:5000/health
- **API Juegos**: http://localhost:5000/api/games
- **API Apuestas**: http://localhost:5000/api/bets

## 📡 API Endpoints

### Juegos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/games` | Obtener todos los juegos |
| GET | `/api/games?league=NBA` | Filtrar por liga |
| GET | `/api/games/league/NBA` | Obtener juegos de NBA |
| GET | `/api/games/:id` | Obtener juego específico |

**Respuesta Ejemplo:**
```json
{
  "success": true,
  "data": [
    {
      "id": "nba_20240118_lal_gsw",
      "league": "NBA",
      "home_team": "Lakers",
      "away_team": "Warriors",
      "game_time": "2024-01-18T19:30:00Z",
      "odds_home": 1.85,
      "odds_away": 2.10,
      "status": "upcoming"
    }
  ],
  "total": 5,
  "timestamp": "2024-01-18T12:00:00Z"
}
```

### Apuestas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/bets` | Crear nueva apuesta |
| GET | `/api/bets` | Obtener todas las apuestas |
| GET | `/api/bets/:betId` | Obtener apuesta específica |
| GET | `/api/bets/user/:userId` | Obtener apuestas del usuario |

**Crear Apuesta:**
```bash
curl -X POST http://localhost:5000/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "selections": [
      {"gameId": "nba_20240118_lal_gsw", "team": "Lakers", "odds": 1.85},
      {"gameId": "mlb_20240118_lad_sd", "team": "Dodgers", "odds": 2.0}
    ],
    "amount": 100
  }'
```

## 🧪 Testear con cURL

```bash
# Obtener todos los juegos
curl http://localhost:5000/api/games

# Obtener juegos por liga
curl http://localhost:5000/api/games?league=NBA

# Crear una apuesta
curl -X POST http://localhost:5000/api/bets \
  -H "Content-Type: application/json" \
  -d '{"userId":"user1","selections":[{"gameId":"nba_20240118_lal_gsw","team":"Lakers","odds":1.85}],"amount":100}'

# Obtener apuestas del usuario
curl http://localhost:5000/api/bets/user/user1
```

## 🎨 Características del Frontend

- **Diseño Responsivo**: Adaptado a móvil, tablet y desktop
- **Tarjetas Intercaladas**: Colores azul y verde alternados
- **CSS Profesional**: Variables, animaciones, transiciones
- **Validaciones**: Campos requeridos y cálculos automáticos
- **Carga en Tiempo Real**: Datos del backend

## 🔌 Integración con APIs Reales

El proyecto está preparado para integrar APIs reales:

### TheSportsDB (Recomendado)
- URL: https://www.thesportsdb.com/api.php
- Datos: NBA, MLB, NFL en tiempo real
- Actualizar en: `backend/services/sportsApiService.js`

### Rapid API
- URL: https://rapidapi.com/
- APIs: NBA-API, MLB-API, Sports-API
- Requiere: API Key de Rapid API

**Cómo activar API real:**
```javascript
// En backend/services/sportsApiService.js
// Descomentar código de getGamesFromTheSportsDB()
// Agregar API_KEY en .env
```

## 📊 Flujo de Datos

```
User (Frontend)
    ↓ [Selecciona equipos]
React Component
    ↓ fetch /api/games
Express Backend
    ↓ consulta Sports API (mock o real)
Respuesta con juegos
    ↓ [renderiza]
User selecciona y crea apuesta
    ↓ POST /api/bets
Backend calcula cuotas
    ↓ [respuesta con betId]
Confirmación en frontend
```

## 🚀 Deployment

### Frontend - Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Desplegar
vercel
```

### Backend - Heroku
```bash
# Instalar Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Crear app y desplegar
heroku create parlay-bets-api
git push heroku main
```

## 📝 Variables de Entorno

**.env (Backend)**
```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001
SPORTS_DB_API_KEY=3
```

## 🐛 Troubleshooting

### Error: "Cannot find module 'express'"
```bash
cd backend
npm install
```

### Error: CORS
Asegurate que frontend y backend tienen los puertos correctos (3001 y 5000)

### Error: API no responde
1. Verifica que backend está corriendo: `curl http://localhost:5000/health`
2. Verifica conexión a internet para APIs reales
3. Revisa logs del backend

## 📚 Recursos

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [TheSportsDB API](https://www.thesportsdb.com/api.php)
- [Fetch API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)

## 🤝 Contribuciones

¿Ideas para mejorar? Créalas localmente y testa.

## 📄 Licencia

MIT

---

**¡Disfruta creando tu plataforma de apuestas! 🎰**
