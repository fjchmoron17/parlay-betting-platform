#!/usr/bin/env node
// backend/scripts/verify-db.js
// Script para verificar la conexión a PostgreSQL

import pkg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pkg;

// Cargar variables de entorno
dotenv.config({ path: '.env.production' });
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔍 Verificando conexión a PostgreSQL...\n');

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  process.exit(1);
}

// Mostrar URL (sin credenciales)
const urlParts = DATABASE_URL.split('@');
console.log(`📍 Host: ${urlParts[1] || 'no visible'}`);
console.log(`🔒 Configuración SSL: ${process.env.NODE_ENV === 'production' ? 'Habilitado' : 'Deshabilitado'}\n`);

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 1,
  connectionTimeoutMillis: 5000
});

async function verify() {
  try {
    console.log('⏳ Conectando...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa\n');

    // Verificar tablas
    console.log('📋 Verificando tablas...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (result.rows.length === 0) {
      console.warn('⚠️  No hay tablas. Necesitas ejecutar la migración:\n');
      console.log('   npm run db:migrate\n');
    } else {
      console.log(`✅ Se encontraron ${result.rows.length} tablas:\n`);
      result.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    // Verificar funciones
    console.log('\n🔧 Verificando funciones...');
    const funcsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public'
      ORDER BY routine_name
    `);

    if (funcsResult.rows.length > 0) {
      console.log(`✅ Se encontraron ${funcsResult.rows.length} funciones:\n`);
      funcsResult.rows.forEach(row => {
        console.log(`   ✓ ${row.routine_name}()`);
      });
    }

    // Verificar vistas
    console.log('\n📊 Verificando vistas...');
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'VIEW'
      ORDER BY table_name
    `);

    if (viewsResult.rows.length > 0) {
      console.log(`✅ Se encontraron ${viewsResult.rows.length} vistas:\n`);
      viewsResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }

    // Contar registros
    console.log('\n📦 Datos existentes:');
    const counts = await Promise.all([
      client.query('SELECT COUNT(*) as count FROM betting_houses'),
      client.query('SELECT COUNT(*) as count FROM betting_house_users'),
      client.query('SELECT COUNT(*) as count FROM bets'),
      client.query('SELECT COUNT(*) as count FROM daily_reports')
    ]);

    console.log(`   • betting_houses: ${counts[0].rows[0].count}`);
    console.log(`   • betting_house_users: ${counts[1].rows[0].count}`);
    console.log(`   • bets: ${counts[2].rows[0].count}`);
    console.log(`   • daily_reports: ${counts[3].rows[0].count}`);

    console.log('\n✅ Base de datos completamente operativa\n');

    client.release();
  } catch (err) {
    console.error('\n❌ Error de conexión:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 Sugerencias:');
      console.log('   1. Verifica que PostgreSQL está corriendo en Railway');
      console.log('   2. Verifica que DATABASE_URL es correcto en .env.production');
      console.log('   3. Espera unos minutos si acabo de crear la BD');
    } else if (err.code === 'ENOTFOUND') {
      console.log('\n💡 Error de red/DNS. Verifica DATABASE_URL\n');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

verify();
