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

// Crear pool de conexiones
export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Máximo de conexiones
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejar errores de conexión
pool.on('error', (err) => {
  console.error('❌ Error inesperado en pool de conexiones:', err);
});

// Verificar conexión al iniciar (sin bloquear el server)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('⚠️ Error conectando a la base de datos:', err.message);
    console.error('   El servidor continuará pero las operaciones de BD fallarán.');
  } else {
    console.log('✅ Conectado a PostgreSQL:', res.rows[0].now);
  }
});

// Funciones helper para queries
export async function query(text, params = []) {
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
