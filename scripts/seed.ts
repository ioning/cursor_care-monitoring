import { Pool } from 'pg';
import { createLogger } from '../shared/libs/logger';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { hash } from 'bcrypt';

dotenv.config({ path: join(__dirname, '../.env') });

const logger = createLogger({ serviceName: 'seed' });

const config = {
  // IMPORTANT:
  // Do not rely on generic DB_* env vars in developer machines (often set to postgres).
  // Our docker-compose defaults are cms_user/cms_password, so keep safe defaults here.
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || process.env.DB_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'cms_user',
  password: process.env.POSTGRES_PASSWORD || 'cms_password',
};

function createDb(database: string) {
  return new Pool({
    ...config,
    database,
  });
}

async function ensurePgCrypto(db: Pool) {
  await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
}

async function seedAuthService() {
  const db = createDb('auth_db');

  try {
    // Ensure extensions are enabled
    await ensurePgCrypto(db);

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

type AuthUserRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
};

async function getAuthUserByEmail(db: Pool, email: string): Promise<AuthUserRow | null> {
  const res = await db.query<AuthUserRow>(
    `SELECT id, email, full_name, phone, role
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email],
  );
  return res.rows[0] ?? null;
}

async function seedUserServiceData(params: { guardian: AuthUserRow; ward: AuthUserRow }) {
  const db = createDb('user_db');
  const { guardian, ward } = params;

  try {
    await ensurePgCrypto(db);

    // Ensure minimal tables exist (in case user-service не запускался)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL,
        organization_id UUID,
        status VARCHAR(20) DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID`);
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key`);
    await db.query(`DROP INDEX IF EXISTS idx_users_email_organization`);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_null_org
      ON users(email)
      WHERE organization_id IS NULL
    `);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_organization
      ON users(email, organization_id)
      WHERE organization_id IS NOT NULL
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    await db.query(`
      CREATE TABLE IF NOT EXISTS wards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        medical_info TEXT,
        emergency_contact TEXT,
        avatar_url TEXT,
        organization_id UUID,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`ALTER TABLE wards ADD COLUMN IF NOT EXISTS organization_id UUID`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_wards_status ON wards(status)`);

    // guardian_wards schema is used by queries that expect extended columns.
    // Keep it backward compatible and add missing columns if table already exists.
    await db.query(`
      CREATE TABLE IF NOT EXISTS guardian_wards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guardian_id UUID NOT NULL,
        ward_id UUID NOT NULL,
        relationship VARCHAR(50) DEFAULT 'ward',
        relationship_type VARCHAR(50),
        is_primary BOOLEAN DEFAULT FALSE,
        access_level VARCHAR(50) DEFAULT 'full',
        notification_preferences JSONB,
        duty_schedule JSONB,
        can_manage_other_guardians BOOLEAN DEFAULT FALSE,
        temporary_primary_guardian BOOLEAN DEFAULT FALSE,
        temporary_period_start TIMESTAMPTZ,
        temporary_period_end TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(guardian_id, ward_id)
      )
    `);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(50)`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'full'`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS notification_preferences JSONB`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS duty_schedule JSONB`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS can_manage_other_guardians BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS temporary_primary_guardian BOOLEAN DEFAULT FALSE`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS temporary_period_start TIMESTAMPTZ`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS temporary_period_end TIMESTAMPTZ`);
    await db.query(`ALTER TABLE guardian_wards ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_guardian_wards_guardian ON guardian_wards(guardian_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_guardian_wards_ward ON guardian_wards(ward_id)`);

    const upsertUser = async (u: AuthUserRow) => {
      await db.query(
        `INSERT INTO users (id, email, full_name, phone, role, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, 'active', TRUE)
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           role = EXCLUDED.role,
           status = 'active',
           email_verified = TRUE,
           updated_at = NOW()`,
        [u.id, u.email, u.full_name, u.phone, u.role],
      );
    };

    // Upsert guardian user profile into user_db.users
    await upsertUser(guardian);

    // Create ward profile in user_db. Use the SAME id as auth-service user id (important for joins).
    const wardExists = await db.query('SELECT 1 FROM wards WHERE id = $1', [ward.id]);
    if (wardExists.rows.length === 0) {
      await db.query(
        `INSERT INTO wards (id, full_name, date_of_birth, gender, medical_info, emergency_contact, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'active')`,
        [
          ward.id,
          // “дефолтные параметры” под браслет/демо
          'Иванов Пётр (демо браслет)',
          '1956-04-12',
          'male',
          'Хронические: гипертония. Аллергия: пенициллин. Риск падений: высокий.',
          'Экстренный контакт: +7 (999) 000-00-01 (Мария Иванова, дочь)',
        ],
      );
      logger.info(`Ward profile created in user_db: ${ward.id}`);
    } else {
      logger.info(`Ward profile already exists in user_db: ${ward.id}`);
    }

    // Link guardian <-> ward
    await db.query(
      `INSERT INTO guardian_wards (guardian_id, ward_id, relationship, relationship_type, is_primary, access_level, status)
       VALUES ($1, $2, 'ward', 'ward', TRUE, 'full', 'active')
       ON CONFLICT (guardian_id, ward_id) DO NOTHING`,
      [guardian.id, ward.id],
    );
    logger.info(`Guardian linked to ward in user_db: ${guardian.id} -> ${ward.id}`);
  } finally {
    await db.end();
  }
}

async function seedDeviceServiceData(params: { guardianId: string; wardId: string }) {
  const db = createDb('device_db');
  const deviceId = process.env.DEFAULT_BRACELET_DEVICE_ID || '11111111-1111-1111-1111-111111111111';
  const apiKey = process.env.DEFAULT_BRACELET_API_KEY || 'bracelet-demo-api-key';

  try {
    await ensurePgCrypto(db);

    await db.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        ward_id UUID,
        name VARCHAR(255) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        firmware_version VARCHAR(50),
        mac_address VARCHAR(17),
        serial_number VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        last_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_devices_ward_id ON devices(ward_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_devices_api_key ON devices(api_key)`);

    // Idempotent insert by api_key
    const exists = await db.query('SELECT id FROM devices WHERE api_key = $1', [apiKey]);
    if (exists.rows.length === 0) {
      await db.query(
        `INSERT INTO devices (id, user_id, ward_id, name, device_type, api_key, firmware_version, mac_address, serial_number, last_seen_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
        [
          deviceId,
          params.guardianId,
          params.wardId,
          'Браслет CareBand A1 (демо)',
          'bracelet',
          apiKey,
          '1.0.0',
          'AA:BB:CC:DD:EE:01',
          'CB-A1-DEMO-0001',
        ],
      );
      logger.info(`Bracelet device created in device_db: ${deviceId} (apiKey=${apiKey})`);
    } else {
      logger.info(`Bracelet device already exists in device_db (apiKey=${apiKey})`);
    }
  } finally {
    await db.end();
  }

  return { deviceId, apiKey };
}

async function seedTelemetryServiceData(params: { deviceId: string; wardId: string }) {
  const db = createDb('telemetry_db');
  try {
    await ensurePgCrypto(db);

    await db.query(`
      CREATE TABLE IF NOT EXISTS raw_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL,
        ward_id UUID NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL(10,4) NOT NULL,
        unit VARCHAR(20),
        quality_score DECIMAL(3,2),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_raw_metrics_ward_timestamp ON raw_metrics(ward_id, timestamp DESC)`);
    await db.query(
      `CREATE INDEX IF NOT EXISTS idx_raw_metrics_ward_type_timestamp ON raw_metrics(ward_id, metric_type, timestamp DESC)`,
    );

    // Do not spam duplicates: if there are any records for this ward in the last hour, skip
    const recent = await db.query(
      `SELECT 1 FROM raw_metrics WHERE ward_id = $1 AND timestamp > NOW() - INTERVAL '60 minutes' LIMIT 1`,
      [params.wardId],
    );
    if (recent.rows.length > 0) {
      logger.info(`Telemetry already exists for ward in last hour, skipping telemetry seed: ${params.wardId}`);
      return;
    }

    const now = new Date();
    const metrics = [
      { type: 'heart_rate', value: 72, unit: 'bpm', quality: 0.96 },
      { type: 'spo2', value: 98, unit: '%', quality: 0.95 },
      { type: 'steps', value: 1240, unit: 'count', quality: 0.9 },
      { type: 'temperature', value: 36.6, unit: 'c', quality: 0.92 },
      { type: 'battery', value: 87, unit: '%', quality: 1.0 },
    ];

    for (let i = 0; i < metrics.length; i++) {
      const m = metrics[i];
      const ts = new Date(now.getTime() - i * 5 * 60 * 1000); // каждые 5 минут
      await db.query(
        `INSERT INTO raw_metrics (id, device_id, ward_id, metric_type, value, unit, quality_score, timestamp)
         VALUES (gen_random_uuid(), $1,$2,$3,$4,$5,$6,$7)`,
        [params.deviceId, params.wardId, m.type, m.value, m.unit, m.quality, ts],
      );
    }

    logger.info(`Telemetry seeded in telemetry_db for ward=${params.wardId}, device=${params.deviceId}`);
  } finally {
    await db.end();
  }
}

async function seedAll() {
  logger.info('Starting database seeding...');

  await seedAuthService();

  // Create a default ward + bracelet demo data
  const authDb = createDb('auth_db');
  try {
    const guardian = await getAuthUserByEmail(authDb, 'guardian@care-monitoring.ru');
    const ward = await getAuthUserByEmail(authDb, 'ward@care-monitoring.ru');
    if (!guardian || !ward) {
      logger.warn('Default guardian/ward users were not found in auth_db; run seedAuthService first.');
      return;
    }

    await seedUserServiceData({ guardian, ward });

    // Also link the default admin to the same ward for convenience (so ward is visible when logged in as admin).
    const admin = await getAuthUserByEmail(authDb, process.env.DEFAULT_ADMIN_EMAIL || 'admin@care-monitoring.ru');
    if (admin) {
      // Reuse user_db and create the link (idempotent).
      const userDb = createDb('user_db');
      try {
        await ensurePgCrypto(userDb);
        await userDb.query(
          `INSERT INTO users (id, email, full_name, phone, role, status, email_verified)
           VALUES ($1, $2, $3, $4, $5, 'active', TRUE)
           ON CONFLICT (id) DO UPDATE SET
             email = EXCLUDED.email,
             full_name = EXCLUDED.full_name,
             phone = EXCLUDED.phone,
             role = EXCLUDED.role,
             status = 'active',
             email_verified = TRUE,
             updated_at = NOW()`,
          [admin.id, admin.email, admin.full_name, admin.phone, admin.role],
        );
        await userDb.query(
          `INSERT INTO guardian_wards (guardian_id, ward_id, relationship, relationship_type, is_primary, access_level, status)
           VALUES ($1, $2, 'caregiver', 'caregiver', FALSE, 'full', 'active')
           ON CONFLICT (guardian_id, ward_id) DO NOTHING`,
          [admin.id, ward.id],
        );
        logger.info(`Admin linked to ward in user_db: ${admin.id} -> ${ward.id}`);
      } finally {
        await userDb.end();
      }
    }

    const { deviceId } = await seedDeviceServiceData({ guardianId: guardian.id, wardId: ward.id });
    await seedTelemetryServiceData({ deviceId, wardId: ward.id });
  } finally {
    await authDb.end();
  }

  logger.info('Database seeding completed');
}

seedAll().catch((error) => {
  logger.error('Seeding error:', error);
  process.exit(1);
});

