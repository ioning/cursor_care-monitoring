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

    // Create default users for all roles
    await seedDefaultUser(db, {
      email: 'test@example.com',
      password: 'Test1234!',
      fullName: 'Test User',
      role: 'guardian',
    });

    await seedDefaultUser(db, {
      email: 'guardian@care-monitoring.ru',
      password: 'guardian123',
      fullName: 'Тестовый Опекун',
      role: 'guardian',
    });

    await seedDefaultUser(db, {
      email: 'ward@care-monitoring.ru',
      password: 'ward123',
      fullName: 'Тестовый Подопечный',
      role: 'ward',
    });

    await seedDefaultUser(db, {
      email: 'dispatcher@care-monitoring.ru',
      password: 'dispatcher123',
      fullName: 'Тестовый Диспетчер',
      role: 'dispatcher',
    });

    await seedDefaultUser(db, {
      email: 'org-admin@care-monitoring.ru',
      password: 'orgadmin123',
      fullName: 'Администратор Организации',
      role: 'organization_admin',
    });
  } catch (error) {
    logger.error('Error seeding auth service:', error);
  } finally {
    await db.end();
  }
}

interface DefaultUser {
  email: string;
  password: string;
  fullName: string;
  role: 'guardian' | 'ward' | 'dispatcher' | 'admin' | 'organization_admin';
  organizationId?: string | null;
}

async function seedDefaultUser(db: Pool, user: DefaultUser) {
  try {
    const orgId = user.organizationId || null;
    
    // Check if user already exists
    const checkQuery = orgId 
      ? 'SELECT id FROM users WHERE email = $1 AND organization_id = $2'
      : 'SELECT id FROM users WHERE email = $1 AND organization_id IS NULL';
    
    const checkParams = orgId ? [user.email, orgId] : [user.email];
    const result = await db.query(checkQuery, checkParams);

    if (result.rows.length > 0) {
      logger.info(`User already exists: ${user.email} (${user.role})`);
      return;
    }

    // Hash password
    const passwordHash = await hash(user.password, 10);

    // Create user (without ON CONFLICT since we already checked)
    await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, status, email_verified, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user.email,
        passwordHash,
        user.fullName,
        user.role,
        'active',
        true,
        orgId,
      ]
    );

    logger.info(`Default user created: ${user.email} / ${user.password} (${user.role})`);
  } catch (error: any) {
    logger.error(`Error creating user ${user.email}:`, error);
    throw error;
  }
}

async function seedDefaultAdmin(db: Pool) {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@care-monitoring.ru';
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || '14081979';
  const adminFullName = process.env.DEFAULT_ADMIN_FULL_NAME || 'Администратор системы';

  await seedDefaultUser(db, {
    email: adminEmail,
    password: adminPassword,
    fullName: adminFullName,
    role: 'admin',
    organizationId: null, // Глобальный админ, не привязан к организации
  });
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

