import bcrypt from 'bcryptjs';
import { query } from '../db/dbConfig.js';

async function seed() {
  console.log('🔐 Creando usuarios para autenticación...');

  // Asegurar columna is_active
  await query('ALTER TABLE betting_house_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE');
  // Permitir super usuario sin casa
  await query('ALTER TABLE betting_house_users ALTER COLUMN betting_house_id DROP NOT NULL');
  // Actualizar constraint de roles
  await query('ALTER TABLE betting_house_users DROP CONSTRAINT IF EXISTS betting_house_users_role_check');
  await query("ALTER TABLE betting_house_users ADD CONSTRAINT betting_house_users_role_check CHECK (role IN ('super_admin','house_admin','admin','operator','viewer'))");

  const housesResult = await query('SELECT id, name FROM betting_houses ORDER BY id');
  const houses = housesResult.rows;

  const users = [
    {
      username: 'superadmin',
      email: 'superadmin@parlay.com',
      password: 'Super!123',
      role: 'super_admin',
      betting_house_id: null
    },
    ...houses.map((house) => ({
      username: `casa${house.id}`,
      email: `admin${house.id}@parlay.com`,
      password: `Casa${house.id}!123`,
      role: 'house_admin',
      betting_house_id: house.id
    }))
  ];

  const inserted = [];

  for (const user of users) {
    const password_hash = await bcrypt.hash(user.password, 10);
    // Eliminar registros que choquen por betting_house_id o username para permitir un upsert limpio
    await query('DELETE FROM betting_house_users WHERE betting_house_id = $1 OR username = $2', [user.betting_house_id, user.username]);

    const result = await query(
      `INSERT INTO betting_house_users (betting_house_id, username, email, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, username, role, betting_house_id` ,
      [user.betting_house_id, user.username, user.email, password_hash, user.role]
    );
    inserted.push({ ...result.rows[0], password: user.password });
  }

  console.table(inserted);
  console.log('✅ Usuarios creados/actualizados.');
}

seed()
  .catch((err) => {
    console.error('❌ Error seeding users:', err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
