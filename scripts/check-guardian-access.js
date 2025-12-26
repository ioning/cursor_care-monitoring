// Скрипт для проверки связей опекун-подопечный в БД

const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const config = {
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'cms_user',
  password: process.env.POSTGRES_PASSWORD || 'cms_password',
};

const WARD_ID = '6db0aa86-db1d-46a6-adb0-817c3cd36262';
const GUARDIAN_ID = 'b2011541-e9ab-430c-93e1-a6546b2aadaa';
const ADMIN_ID = 'ac4067ce-6777-48d0-87ef-a786c3ce5b97';

async function checkAccess() {
  const userDb = new Pool({
    ...config,
    database: 'user_db',
  });

  try {
    console.log('=== Проверка связей опекун-подопечный ===\n');

    // Проверка связи опекун-подопечный
    console.log('1. Проверка связи опекун-подопечный:');
    const guardianResult = await userDb.query(
      `SELECT * FROM guardian_wards 
       WHERE guardian_id = $1 AND ward_id = $2`,
      [GUARDIAN_ID, WARD_ID]
    );

    if (guardianResult.rows.length > 0) {
      console.log('   ✓ Связь найдена:');
      const row = guardianResult.rows[0];
      console.log(`     - ID: ${row.id}`);
      console.log(`     - Guardian ID: ${row.guardian_id}`);
      console.log(`     - Ward ID: ${row.ward_id}`);
      console.log(`     - Status: ${row.status || 'NULL'}`);
      console.log(`     - Relationship: ${row.relationship}`);
      console.log(`     - Is Primary: ${row.is_primary}`);
    } else {
      console.log('   ✗ Связь НЕ найдена!');
    }

    // Проверка связи админ-подопечный
    console.log('\n2. Проверка связи админ-подопечный:');
    const adminResult = await userDb.query(
      `SELECT * FROM guardian_wards 
       WHERE guardian_id = $1 AND ward_id = $2`,
      [ADMIN_ID, WARD_ID]
    );

    if (adminResult.rows.length > 0) {
      console.log('   ✓ Связь найдена:');
      const row = adminResult.rows[0];
      console.log(`     - ID: ${row.id}`);
      console.log(`     - Status: ${row.status || 'NULL'}`);
    } else {
      console.log('   ✗ Связь НЕ найдена!');
    }

    // Проверка всех связей для этого подопечного
    console.log('\n3. Все связи для подопечного:');
    const allResult = await userDb.query(
      `SELECT 
         gw.guardian_id,
         gw.ward_id,
         gw.status,
         gw.relationship,
         gw.is_primary,
         u.email,
         u.role
       FROM guardian_wards gw
       LEFT JOIN users u ON u.id = gw.guardian_id
       WHERE gw.ward_id = $1`,
      [WARD_ID]
    );

    if (allResult.rows.length > 0) {
      console.log(`   Найдено связей: ${allResult.rows.length}`);
      allResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.email} (${row.role}) - Status: ${row.status || 'NULL'}, Primary: ${row.is_primary}`);
      });
    } else {
      console.log('   ✗ Связи не найдены!');
    }

    // Проверка пользователей
    console.log('\n4. Проверка пользователей:');
    const usersResult = await userDb.query(
      `SELECT id, email, role FROM users 
       WHERE id IN ($1, $2, $3)`,
      [GUARDIAN_ID, ADMIN_ID, WARD_ID]
    );

    usersResult.rows.forEach(row => {
      console.log(`   - ${row.email} (${row.role}): ${row.id}`);
    });

  } catch (error) {
    console.error('Ошибка:', error.message);
  } finally {
    await userDb.end();
  }
}

checkAccess().catch(console.error);

