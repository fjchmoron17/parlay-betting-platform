# Configuración de PostgreSQL en Railway

## Paso 1: Crear instancia PostgreSQL en Railway

1. Ve a [railway.app/dashboard](https://railway.app/dashboard)
2. Click en **New** → **Database** → **PostgreSQL**
3. Railway creará automáticamente una instancia PostgreSQL
4. Espera a que se inicialize (2-3 minutos)

## Paso 2: Obtener DATABASE_URL

1. En el dashboard de Railway, selecciona el **servicio PostgreSQL** recién creado
2. Abre la pestaña **Connect**
3. Busca **DATABASE_URL** (será algo como: `postgresql://user:password@host:port/railway`)
4. **Copia toda la URL**

## Paso 3: Configurar la variable de entorno en el Backend

1. Abre tu servicio backend en Railway
2. Ve a **Variables** (en el panel de la izquierda)
3. **Agrega una nueva variable:**
   - Name: `DATABASE_URL`
   - Value: (pega la URL que copiaste en Paso 2)
4. Guarda los cambios

Railway redesplegará automáticamente tu backend.

## Paso 4: Ejecutar la migración

Tienes **2 opciones**:

### Opción A: Usar Railway CLI (Recomendado)
```bash
# Instalar Railway CLI si no lo tienes
brew install railway

# Loguéate en Railway
railway login

# Ir al proyecto
cd /Users/fjchmoron/Documents/PARLAY_SITE

# Ejecutar el script de migración
railway run npm run db:migrate
```

### Opción B: Usar psql directamente
```bash
# Conectarte a PostgreSQL
psql "postgresql://user:password@host:port/railway"

# Copiar y pegar el contenido de DATABASE_SCHEMA.sql
\i DATABASE_SCHEMA.sql
```

### Opción C: Usar Node.js (local)
```bash
cd /Users/fjchmoron/Documents/PARLAY_SITE/backend
npm run db:migrate
```

## Paso 5: Verificar la conexión

```bash
# Desde la terminal local
curl https://parlaybackend-production-b45e.up.railway.app/health
```

Deberías ver una respuesta indicando que la BD está conectada.

---

## Variables de Entorno Completas para Railway

Configura estas variables en tu servicio backend de Railway:

```
PORT=3333
NODE_ENV=production
CORS_ORIGIN=https://parlayfront-production-xxxx.up.railway.app
ODDS_API_KEY=3709555baab96669fb03ff0afbe6c873
ODDS_API_BASE_URL=https://api.the-odds-api.com/v4
GAMES_CACHE_TTL_MS=300000
DATABASE_URL=postgresql://user:password@host:port/railway
```

---

## Troubleshooting

**Error: "DATABASE_URL no está configurada"**
- Verifica que agregaste la variable en Railway → Backend Service → Variables

**Error: "Connection refused"**
- Espera 2-3 minutos a que PostgreSQL se inicialize completamente
- Verifica que la DATABASE_URL sea correcta

**Error: "Relation 'betting_houses' does not exist"**
- La migración no se ejecutó. Intenta nuevamente con `railway run npm run db:migrate`
