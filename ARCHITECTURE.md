# Arquitectura: Parlay Bets con Backend Express + APIs Deportivas

## 📋 Descripción General

```
┌─────────────────────┐
│   React Frontend    │  (Puerto 3001)
│   (Vite)           │
└──────────┬──────────┘
           │
           │ HTTP/REST
           │
┌──────────▼──────────┐
│  Express Backend    │  (Puerto 5000)
│  (Node.js)         │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐  ┌────▼────┐
│ ESPN   │  │ SportsDB│
│ API    │  │ API     │
└────────┘  └─────────┘
```

## 🎯 Estructura de Carpetas (Backend)

```
backend/
├── server.js              # Punto de entrada
├── package.json
├── .env                   # Variables de entorno
├── config/
│   └── constants.js       # URLs de APIs
├── routes/
│   ├── games.js           # Rutas para obtener partidos
│   └── bets.js            # Rutas para gestionar apuestas
├── controllers/
│   ├── gamesController.js # Lógica de juegos
│   └── betsController.js  # Lógica de apuestas
├── services/
│   └── sportsApiService.js # Integración con APIs
└── middleware/
    └── errorHandler.js    # Manejo de errores
```

## 🔑 APIs Deportivas Gratuitas

### Opción 1: ESPN/TheSportsDB (Recomendado - Gratis)
- **URL**: https://www.thesportsdb.com/api.php
- **Ventajas**: Gratis, sin autenticación, muchos deportes
- **Datos**: Partidos, equipos, odds, resultados

### Opción 2: Rapid API (Freemium)
- **URL**: https://rapidapi.com/
- **APIs disponibles**: NBA-API, MLB-API, Sports-API
- **Ventajas**: Datos en tiempo real

### Opción 3: ESPN Stats API (No oficial)
- **URL**: https://site.api.espn.com/
- **Ventajas**: Completa y gratuita

## 🚀 Endpoints del Backend

### GET `/api/games`
```json
Respuesta:
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
    },
    {
      "id": "mlb_20240118_lad_sd",
      "league": "MLB",
      "home_team": "Dodgers",
      "away_team": "Padres",
      "game_time": "2024-01-18T19:05:00Z",
      "odds_home": 2.0,
      "odds_away": 4.0,
      "status": "upcoming"
    }
  ]
}
```

### GET `/api/games/:league`
Filtrar por liga (NBA, MLB, NFL)

### POST `/api/bets`
```json
Request:
{
  "userId": "user123",
  "selections": [
    {"gameId": "nba_20240118_lal_gsw", "team": "Lakers", "odds": 1.85},
    {"gameId": "mlb_20240118_lad_sd", "team": "Dodgers", "odds": 2.0}
  ],
  "amount": 100
}

Respuesta:
{
  "success": true,
  "betId": "bet_12345",
  "combinedOdds": 3.7,
  "potentialWinnings": 370
}
```

### GET `/api/bets/:betId`
Obtener detalles de una apuesta

## 📦 Dependencias del Backend

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## 🔄 Flujo de Datos

1. **Frontend solicita partidos**: GET `/api/games`
2. **Backend consulta API deportiva**
3. **Backend procesa y cachea datos**
4. **Backend devuelve datos formateados**
5. **Frontend renderiza tarjetas de partidos**
6. **Usuario selecciona equipos**
7. **Frontend valida y envía apuesta**: POST `/api/bets`
8. **Backend calcula cuotas combinadas**
9. **Backend almacena apuesta (BD)**
10. **Backend retorna confirmación**

## 🔐 Variables de Entorno (.env)

```
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3001

# APIs
SPORTS_DB_API_URL=https://www.thesportsdb.com/api/v1/json/
ESPN_API_URL=https://site.api.espn.com/

# Base de datos (opcional)
DATABASE_URL=mongodb://localhost:27017/parlay_bets
```

## ✅ Checklist de Implementación

- [ ] Crear carpeta backend/
- [ ] Instalar dependencias con npm
- [ ] Crear server.js con Express
- [ ] Implementar CORS
- [ ] Crear servicio para consumir APIs
- [ ] Implementar ruta GET `/api/games`
- [ ] Implementar ruta POST `/api/bets`
- [ ] Agregar manejo de errores
- [ ] Agregar logging con Morgan
- [ ] Testear endpoints con Postman/Insomnia
- [ ] Conectar frontend a backend
- [ ] Agregar base de datos (opcional)
- [ ] Desplegar en Heroku/Vercel/Railway

## 🧪 Testing

```bash
# Backend
npm run dev

# En otra terminal, prueba:
curl http://localhost:5000/api/games
curl -X POST http://localhost:5000/api/bets \
  -H "Content-Type: application/json" \
  -d '{"userId":"user123","selections":[...],"amount":100}'
```

## 🚢 Deployment

1. **Backend**: Heroku, Railway, Render
2. **Frontend**: Vercel, Netlify, GitHub Pages
3. **Base de datos**: MongoDB Atlas, PostgreSQL

---

**Siguiente paso**: Ejecutar el script `setup-backend.sh` para crear toda la estructura automáticamente.
