# 🎯 GUÍA DE INSTALACIÓN Y EJECUCIÓN - PARLAY BETS

## ⚠️ Problema de Permisos (Solución)

Si encuentras este error:
```
npm error code EACCES
npm error Your cache folder contains root-owned files
```

Ejecuta en terminal:
```bash
sudo chown -R 501:20 "/Users/fjchmoron/.npm"
```

Después intenta nuevamente:
```bash
cd backend
npm install
```

---

## 📋 PASOS PARA EJECUTAR EL PROYECTO

### Paso 1: Abre TERMINAL 1 (Frontend)

```bash
# Ve a la carpeta principal del proyecto
cd /Users/fjchmoron/Documents/PARLAY_SITE

# Ejecuta el frontend
npm run dev
```

**Resultado esperado:**
```
✓ [vite] ready in 157 ms

➜  Local:   http://localhost:3001/
```

---

### Paso 2: Abre TERMINAL 2 (Backend)

```bash
# Ve a la carpeta del backend
cd /Users/fjchmoron/Documents/PARLAY_SITE/backend

# Instala dependencias (solo primera vez)
npm install

# Ejecuta el servidor backend
npm run dev
```

**Resultado esperado:**
```
╔════════════════════════════════════╗
║   🎰 PARLAY BETS BACKEND RUNNING   ║
║   🌐 http://localhost:5000         ║
╚════════════════════════════════════╝
```

---

## ✅ VERIFICACIÓN

### Desde Terminal 3 o Postman, prueba:

```bash
# Health check
curl http://localhost:5000/health

# Obtener todos los juegos
curl http://localhost:5000/api/games

# Obtener juegos de NBA
curl http://localhost:5000/api/games?league=NBA

# Crear una apuesta
curl -X POST http://localhost:5000/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "selections": [
      {"gameId": "nba_20240118_lal_gsw", "team": "Lakers", "odds": 1.85}
    ],
    "amount": 100
  }'
```

---

## 🌐 ACCESO

- **Frontend**: http://localhost:3001 ← Abre esto en el navegador
- **Backend**: http://localhost:5000/api/games

---

## 🐛 TROUBLESHOOTING

| Error | Solución |
|-------|----------|
| Port 5000 in use | `lsof -i :5000` y mata el proceso |
| CORS Error | Verifica que frontend es 3001 y backend es 5000 |
| Cannot find module | Ejecuta `npm install` en la carpeta backend |
| API no responde | Reinicia el backend (Ctrl+C y npm run dev) |

---

## 📚 ESTRUCTURA DE CARPETAS

```
PARLAY_SITE/
├── src/                    # Frontend React
│   ├── components/
│   ├── pages/
│   ├── services/api.js     # ← Cliente HTTP para backend
│   └── index.css
├── backend/                # Backend Express ← Carpeta que instalaste
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── routes/
│   ├── server.js           # ← Punto de entrada
│   └── package.json
└── README_FULL.md          # Documentación completa
```

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Frontend corriendo en 3001
2. ✅ Backend corriendo en 5000
3. ✅ Prueba crear apuestas desde la interfaz
4. 🔄 Integra APIs reales (TheSportsDB)
5. 💾 Agrega base de datos (MongoDB/PostgreSQL)
6. 🚢 Despliega en Heroku/Vercel

---

**¡Tu plataforma de apuestas está lista! 🎰**
