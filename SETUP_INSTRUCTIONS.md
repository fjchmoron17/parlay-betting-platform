# 🎰 PARLAY BETS - Instrucciones de Ejecución Final

## ✅ Status del Proyecto
- **Frontend**: React 19 + Vite 7 ✓
- **Backend**: Express.js 4 ✓
- **CSS**: Profesional con variables y animaciones ✓
- **API**: 7 endpoints REST implementados ✓
- **Datos**: 5 juegos de demo disponibles ✓

## 🚀 Cómo ejecutar el proyecto

### Terminal 1 - Ejecutar el Backend (Express)
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE/backend

# El servidor se ejecutará en Puerto 3333
node server.js
```

**Output esperado:**
```
╔════════════════════════════════════╗
║   🎰 PARLAY BETS BACKEND RUNNING   ║
║   🌐 http://localhost:3333            ║
║   📦 API: /api/games               ║
║   📦 API: /api/bets                ║
╚════════════════════════════════════╝
```

### Terminal 2 - Ejecutar el Frontend (Vite)
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE

npm run dev
```

**Output esperado:**
```
VITE v7.3.1  ready in 196 ms
➜  Local:   http://localhost:3000/
```

## 📌 Puertos
- **Frontend (Vite)**: http://localhost:3000
- **Backend (Express)**: http://localhost:3333

## 🧪 Probar Endpoints

### 1. Obtener todos los juegos
```bash
curl http://localhost:3333/api/games
```

### 2. Crear una apuesta
```bash
curl -X POST http://localhost:3333/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "selections": [
      {
        "gameId": "nba_20240118_lal_gsw",
        "team": "home",
        "odds": 1.85
      }
    ],
    "amount": 100
  }'
```

### 3. Obtener apuesta por ID
```bash
curl http://localhost:3333/api/bets/bet_id_aqui
```

## 📂 Estructura del Proyecto

```
PARLAY_SITE/
├── frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameCard.jsx
│   │   │   └── ParlayPanel.jsx
│   │   ├── pages/
│   │   │   └── Home.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── index.css (profesional)
│   ├── index.html
│   └── package.json
│
└── backend (Express)
    ├── server.js
    ├── .env (puerto 3333)
    ├── controllers/
    │   ├── gamesController.js
    │   └── betsController.js
    ├── services/
    │   └── sportsApiService.js
    ├── routes/
    │   ├── games.js
    │   └── bets.js
    ├── middleware/
    │   └── errorHandler.js
    ├── config/
    │   └── constants.js
    ├── node_modules/
    └── package.json
```

## 🎮 Características

### Frontend
- ✅ Interfaz profesional con CSS personalizado
- ✅ Tarjetas de juegos con alternancia de colores (azul/verde)
- ✅ Panel de apuestas parlay
- ✅ Cálculo de odds combinadas
- ✅ Estados de carga y error
- ✅ Conexión con backend en tiempo real

### Backend
- ✅ API REST con 7 endpoints
- ✅ Controladores para juegos y apuestas
- ✅ Validación de datos
- ✅ Manejo de errores centralizado
- ✅ CORS habilitado para frontend
- ✅ Logging con Morgan
- ✅ Datos de demo (5 juegos)

## 📊 Datos de Demo

El backend proporciona 5 juegos de demo:
1. **Lakers vs Warriors** (NBA) - Odds: 1.85/2.10
2. **Yankees vs Red Sox** (MLB) - Odds: 1.70/2.30
3. **Dodgers vs Padres** (MLB) - Odds: 2.00/4.00
4. **Celtics vs Heat** (NBA) - Odds: 1.95/1.90
5. **Chiefs vs Bills** (NFL) - Odds: 1.75/2.20

## 🔧 Troubleshooting

### Puerto ya está en uso
```bash
# Matar procesos existentes
pkill -9 node
```

### node_modules no existe
```bash
cd backend
npm install --cache=/tmp/npm-cache
```

### Errores de CORS
- Asegúrate de que CORS_ORIGIN en .env sea `http://localhost:3000`

## 📝 Próximos Pasos
- [ ] Integrar APIs reales (TheSportsDB, RapidAPI)
- [ ] Implementar base de datos (MongoDB)
- [ ] Autenticación de usuarios (JWT)
- [ ] Dashboard de resultados
- [ ] Sistema de historial de apuestas
- [ ] Despliegue en producción

---

**✅ Estado**: Backend + Frontend funcionando correctamente
**🎯 Versión**: 1.0.0 Beta
