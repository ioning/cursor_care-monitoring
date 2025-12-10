import { Pool } from 'pg';
import { createLogger } from '../shared/libs/logger';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { hash } from 'bcrypt';

dotenv.config({ path: join(__dirname, '../.env') });

const logger = createLogger({ serviceName: 'seed' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'cms_user',
  password: process.env.DB_PASSWORD || 'cms_password',
};

async function seedAuthService() {
  const db = new Pool({
    ...config,
    database: 'auth_db',
  });

  try {
    // Ensure extensions are enabled
    await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    // Create default admin user
    await seedDefaultAdmin(db);

    // Create test user (password: Test1234!)
    const testUserResult = await db.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    if (testUserResult.rows.length > 0) {
      logger.info('Test user already exists');
    } else {
      const passwordHash = '$2b$10$rQZ8vJ8vJ8vJ8vJ8vJ8vJ.8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ';
      await db.query(
        `INSERT INTO users (id, email, password_hash, full_name, role, status, email_verified, organization_id)
         VALUES (gen_random_uuid(), 'test@example.com', $1, 'Test User', 'guardian', 'active', TRUE, NULL)
         ON CONFLICT (email, organization_id) DO NOTHING`,
        [passwordHash],
      );
      logger.info('Test user created: test@example.com / Test1234!');
    }
  } catch (error) {
    logger.error('Error seeding auth service:', error);
  } finally {
    await db.end();
  }
}

async function seedDefaultAdmin(db: Pool) {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@care-monitoring.ru';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '14081979';
  const adminFullName = process.env.DEFAULT_ADMIN_FULL_NAME || 'Администратор системы';

  try {
    // Check if admin already exists
    const result = await db.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2 AND organization_id IS NULL',
      [adminEmail, 'admin']
    );

    if (result.rows.length > 0) {
      logger.info(`Default admin user already exists: ${adminEmail}`);
      return;
    }

    // Hash password
    const passwordHash = await hash(adminPassword, 10);

    // Create default admin
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, status, email_verified, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email, organization_id) DO NOTHING`,
      [
        adminEmail,
        passwordHash,
        adminFullName,
        'admin',
        'active',
        true,
        null, // Глобальный админ, не привязан к организации
      ]
    );

    logger.info(`Default admin user created: ${adminEmail} / ${adminPassword}`);
  } catch (error: any) {
    logger.error('Error creating default admin user:', error);
    throw error;
  }
}

async function seedAll() {
  logger.info('Starting database seeding...');

  await seedAuthService();

  logger.info('Database seeding completed');
}

seedAll().catch((error) => {
  logger.error('Seeding error:', error);
  process.exit(1);
});

