import { Pool } from 'pg';
import { createLogger } from '../shared/libs/logger';
import * as dotenv from 'dotenv';
import { join } from 'path';

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
    // Check if test user exists
    const result = await db.query('SELECT id FROM users WHERE email = $1', ['test@example.com']);
    if (result.rows.length > 0) {
      logger.info('Test user already exists');
      return;
    }

    // Create test user (password: Test1234!)
    const passwordHash = '$2b$10$rQZ8vJ8vJ8vJ8vJ8vJ8vJ.8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ8vJ';
    await db.query(
      `INSERT INTO users (id, email, password_hash, full_name, role, status, email_verified)
       VALUES (gen_random_uuid(), 'test@example.com', $1, 'Test User', 'guardian', 'active', TRUE)`,
      [passwordHash],
    );

    logger.info('Test user created: test@example.com / Test1234!');
  } catch (error) {
    logger.error('Error seeding auth service:', error);
  } finally {
    await db.end();
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

