# 🗄️ Setup de Base de Datos PostgreSQL en Railway

## Paso 1: Crear PostgreSQL en Railway

1. Ve a [Railway Dashboard](https://railway.app)
2. Haz clic en `+ New` → `Database` → `PostgreSQL`
3. Espera a que se cree la instancia (2-3 minutos)
4. Una vez creada, ve a la pestaña `Connect`

## Paso 2: Obtener DATABASE_URL

En el panel de Railway:

1. Selecciona el servicio PostgreSQL
2. Ve a `Variables` y copia la variable `DATABASE_URL`
3. Debería verse así: `postgresql://user:password@host:port/database`

## Paso 3: Agregar DATABASE_URL a Railway Backend

1. Ve al servicio del backend en Railway
2. Selecciona la pestaña `Variables`
3. Añade nueva variable:
   - **Name**: `DATABASE_URL`
   - **Value**: `[pega el DATABASE_URL del paso anterior]`
4. Guarda los cambios

## Paso 4: Ejecutar el Script SQL

Tienes dos opciones:

### Opción A: Usar Railway CLI (Recomendado)

```bash
# Instala Railway CLI si no lo tienes
npm install -g @railway/cli

# Conecta con tu cuenta
railway login

# En la carpeta del proyecto
railway link [proyecto-id]

# Ejecuta el script
railway run psql < DATABASE_SCHEMA.sql
```

### Opción B: Usar pgAdmin o DBeaver

1. Descarga [DBeaver Community](https://dbeaver.io/download/) o [pgAdmin](https://www.pgadmin.org/)
2. Conecta usando el DATABASE_URL de Railway
3. Abre el archivo `DATABASE_SCHEMA.sql`
4. Ejecuta todo el script SQL

### Opción C: Copiar y Pegar en Railway Query Console

1. Ve a Railway Dashboard → PostgreSQL → `Query`
2. Copia el contenido de `DATABASE_SCHEMA.sql`
3. Pégalo en la consola de queries
4. Ejecuta en secciones (tablas, luego vistas, luego funciones)

## Paso 5: Verificar la Instalación

Una vez ejecutado el script, verifica que todo esté creado:

```sql
-- Ver todas las tablas
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';

-- Ver vistas
SELECT * FROM information_schema.views 
WHERE table_schema = 'public';

-- Ver procedimientos
SELECT * FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Ver datos de ejemplo
SELECT * FROM betting_houses;
SELECT * FROM betting_house_users;
```

## Conectar Backend a la BD

En `backend/server.js`, necesitarás:

```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Importante para Railway
});

// Verificar conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('DB Error:', err);
  else console.log('DB Connected:', res.rows[0]);
});
```

## Variables de Entorno Necesarias

En Railway backend, asegúrate de tener:

```
DATABASE_URL=postgresql://user:pass@host:port/database
ODDS_API_KEY=3709555baab96669fb03ff0afbe6c873
GAMES_CACHE_TTL_MS=300000
NODE_ENV=production
PORT=3333
```

## Tablas Creadas

✅ `betting_houses` - Casas de apuestas  
✅ `betting_house_users` - Usuarios únicos por casa  
✅ `bets` - Apuestas realizadas  
✅ `bet_selections` - Selecciones en cada apuesta  
✅ `daily_reports` - Reportes diarios  
✅ `account_transactions` - Historial de transacciones  
✅ `user_activity_log` - Auditoría  

## Vistas Creadas

✅ `v_betting_summary` - Resumen por casa de apuestas  
✅ `v_daily_pnl` - Ganancias/Pérdidas diarias  
✅ `v_last_7_days_performance` - Performance últimos 7 días  

## Función Almacenada

✅ `calculate_daily_report()` - Calcula reportes diarios automáticamente

## Soporte

Si tienes problemas:

1. Verifica que DATABASE_URL sea correcto
2. Asegúrate de que railway.json tiene la configuración correcta
3. Revisa los logs en Railway: `railway logs -s backend`
4. Conecta directamente a la BD para verificar las tablas

## Backup

Para hacer backup de la BD en Railway:

```bash
# Descargar backup
pg_dump "postgresql://user:pass@host:port/database" > backup.sql

# Restaurar backup
psql "postgresql://user:pass@host:port/database" < backup.sql
```

---

**Próximo paso**: Implementar endpoints en Node.js para interactuar con las tablas.
