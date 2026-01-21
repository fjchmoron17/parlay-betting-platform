// backend/scripts/migrate.js
// Script para ejecutar migraciones de base de datos
import fs from 'fs';
import path from 'path';
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
  console.error('❌ Error: DATABASE_URL no está configurada');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigration() {
  try {
    console.log('📊 Iniciando migración de base de datos...');
    console.log(`🔗 Conectando a: ${DATABASE_URL.split('@')[1]}`);

    // Leer el archivo SQL
    const schemaPath = path.join(process.cwd(), '..', 'DATABASE_SCHEMA.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Conectar
    const client = await pool.connect();
    console.log('✅ Conexión establecida');

    try {
      // Ejecutar el script SQL
      await client.query(schema);
      console.log('✅ Schema ejecutado exitosamente');

      // Verificar tablas
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(`✅ Tablas creadas: ${tables.rows.length}`);
      tables.rows.forEach(t => console.log(`   - ${t.table_name}`));

      // Verificar vistas
      const views = await client.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
      `);
      console.log(`✅ Vistas creadas: ${views.rows.length}`);
      views.rows.forEach(v => console.log(`   - ${v.table_name}`));

    } finally {
      client.release();
    }

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
