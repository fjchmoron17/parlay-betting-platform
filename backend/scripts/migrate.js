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

    // Leer todos los archivos de migración en orden
    const migrationsDir = path.join(process.cwd(), 'backend', 'db', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No se encontraron archivos de migración.');
      process.exit(0);
    }

    // Conectar
    const client = await pool.connect();
    console.log('✅ Conexión establecida');

    try {
      for (const file of migrationFiles) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');
        console.log(`\n▶️ Ejecutando migración: ${file}`);
        await client.query(sql);
        console.log(`✅ Migración ${file} ejecutada`);
      }

      // Verificar tablas
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log(`✅ Tablas: ${tables.rows.length}`);
      tables.rows.forEach(t => console.log(`   - ${t.table_name}`));

      // Verificar vistas
      const views = await client.query(`
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
      `);
      console.log(`✅ Vistas: ${views.rows.length}`);
      views.rows.forEach(v => console.log(`   - ${v.table_name}`));

    } finally {
      client.release();
    }

    console.log('\n✅ Todas las migraciones completadas exitosamente');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en migración:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
