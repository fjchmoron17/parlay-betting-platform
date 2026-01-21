# 🚀 Guía: Conectar PostgreSQL en Railway

## ✅ Lo que ya está listo

✓ Backend deployado en Railway: https://parlaybackend-production-b45e.up.railway.app
✓ Esquema PostgreSQL completo (DATABASE_SCHEMA.sql)
✓ Configuración de conexión (dbConfig.js)
✓ Modelos B2B listos (betting_houses, bets, reports)
✓ API endpoints implementados (13 endpoints)
✓ Scripts de migración y verificación

---

## 📋 Paso 1: Crear PostgreSQL en Railway (3 min)

1. Ve a https://railway.app/dashboard
2. Haz clic en **New** → **Database** → **PostgreSQL**
3. Railway crea y inicializa automáticamente
4. **IMPORTANTE**: Espera **2-3 minutos** a que esté lista

---

## 🔑 Paso 2: Obtener DATABASE_URL (2 min)

1. En tu dashboard de Railway, abre el **servicio PostgreSQL** recién creado
2. Haz clic en la pestaña **Connect**
3. **Copia la DATABASE_URL** completa (se verá así):
   ```
   postgresql://postgres:xyz123@containers-us-west-123.railway.app:5432/railway
   ```

---

## ⚙️ Paso 3: Configurar en tu Backend de Railway (2 min)

1. En Railway dashboard, abre tu **servicio Backend**
2. Haz clic en **Variables** (pestaña en el panel izquierdo)
3. **Agrega estas variables:**

   | Variable | Valor |
   |----------|-------|
   | `DATABASE_URL` | (pega la URL del Paso 2) |
   | `NODE_ENV` | `production` |
   | `ODDS_API_KEY` | `3709555baab96669fb03ff0afbe6c873` |

4. Haz clic en **Deploy** o espera a que redeploy automático termine

---

## 🗄️ Paso 4: Ejecutar la Migración (2 min)

Tienes **3 opciones** (elige una):

### Opción A: Usar Railway CLI (Recomendado)
```bash
# Si no tienes Railway CLI instalado
brew install railway

# Loguéate
railway login

# Ve al proyecto
cd /Users/fjchmoron/Documents/PARLAY_SITE

# Ejecuta la migración
railway run npm run db:migrate
```

### Opción B: Usar psql (terminal PostgreSQL)
```bash
# Instalar psql si no lo tienes
brew install postgresql

# Conectar a tu BD (reemplaza con tu DATABASE_URL)
psql "postgresql://postgres:PASSWORD@host:5432/railway"

# Ejecutar el script
\i DATABASE_SCHEMA.sql
```

### Opción C: Node.js local (sin Railway CLI)
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE/backend

# Actualiza .env con tu DATABASE_URL
# DATABASE_URL=postgresql://...

npm run db:migrate
```

---

## ✔️ Paso 5: Verificar la Conexión (1 min)

```bash
# Opción A: Con Railway CLI
railway run npm run db:verify

# Opción B: Local (con .env actualizado)
cd /Users/fjchmoron/Documents/PARLAY_SITE/backend
npm run db:verify
```

**Deberías ver:**
```
✅ Conectado
📋 Se encontraron 7 tablas:
   ✓ betting_houses
   ✓ betting_house_users
   ✓ bets
   ✓ bet_selections
   ✓ daily_reports
   ✓ account_transactions
   ✓ user_activity_log
✅ Base de datos completamente operativa
```

---

## 🧪 Paso 6: Probar Endpoints (1 min)

Una vez que la migración esté completa:

```bash
# Crear una casa de apuestas
curl -X POST https://parlaybackend-production-b45e.up.railway.app/api/betting-houses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi Casa de Apuestas",
    "email": "admin@mihouse.com",
    "country": "Mexico",
    "currency": "MXN"
  }'

# Ver todas las casas
curl https://parlaybackend-production-b45e.up.railway.app/api/betting-houses

# Ver resumen
curl https://parlaybackend-production-b45e.up.railway.app/api/betting-houses/summary
```

---

## 🆘 Troubleshooting

| Error | Solución |
|-------|----------|
| **DATABASE_URL no está configurada** | Agrega la variable en Railway dashboard → Backend → Variables |
| **Connection refused** | Espera 2-3 min a que PostgreSQL inicie, verifica DATABASE_URL |
| **Relation 'betting_houses' does not exist** | Ejecuta `npm run db:migrate` nuevamente |
| **SSL certificate problem** | Railway usa SSL automático, ya está manejado en dbConfig.js |
| **psql: command not found** | `brew install postgresql` |

---

## 📊 Datos de Ejemplo

El script incluye 3 casas de apuestas de prueba:

- **Casa del Juego México** (MXN)
- **Apuestas Latinas** (COP)
- **BetsCentral** (ARS)

Puedes consultarlas después de migrar:

```bash
curl https://parlaybackend-production-b45e.up.railway.app/api/betting-houses
```

---

## 📁 Archivos Creados/Actualizados

```
✓ RAILWAY_DATABASE_SETUP.md          # Esta guía
✓ backend/.env.production            # Variables de producción
✓ backend/scripts/verify-db.js       # Script de verificación
✓ backend/db/dbConfig.js             # Configuración (ya existía)
✓ backend/scripts/migrate.js         # Migración (ya existía)
```

---

## ✨ Resumen de Componentes

| Componente | Estado | URL |
|-----------|--------|-----|
| Frontend | ✅ Deployado | railway.app |
| Backend API | ✅ Deployado | https://parlaybackend-production-b45e.up.railway.app |
| PostgreSQL | 🔄 En configuración | railway.app |
| B2B Endpoints | ✅ Listos | `/api/betting-houses`, `/api/bets`, `/api/reports` |
| Esquema DB | ✅ Listo | DATABASE_SCHEMA.sql |

Una vez completados todos los pasos, tu plataforma B2B estará **completamente operativa** con:
- ✅ API de juegos en vivo
- ✅ Sistema de apuestas
- ✅ Gestión de casas de apuestas
- ✅ Reportes diarios automáticos
- ✅ Historial de transacciones
