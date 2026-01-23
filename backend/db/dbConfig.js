// backend/db/dbConfig.js
// Configuración de conexión a PostgreSQL
import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Cargar variables de entorno
dotenv.config({ path: '.env.production' });
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️ DATABASE_URL no está configurada. Usando modo sin base de datos.');
}

// Crear pool de conexiones SOLO si DATABASE_URL existe
let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Manejar errores de conexión
  pool.on('error', (err) => {
    console.error('❌ Error inesperado en pool de conexiones:', err);
  });

  // Verificar conexión (async, non-blocking)
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('⚠️ Error conectando a PostgreSQL:', err.message);
    } else {
      console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
    }
  });
}

// Crear pool dummy si no hay DATABASE_URL para evitar errores
if (!pool) {
  console.warn('⚠️ Se usará un pool dummy (no habrá acceso a BD)');
}

export { pool };

// Funciones helper para queries
export async function query(text, params = []) {
  if (!pool) {
    throw new Error('DATABASE_URL not configured. Cannot execute queries.');
  }
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('DB Query Error:', error);
    throw error;
  }
}

export async function getOne(text, params = []) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

export async function getAll(text, params = []) {
  const result = await query(text, params);
  return result.rows || [];
}

export default pool;
