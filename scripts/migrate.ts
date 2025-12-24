import { MigrationRunner } from '../shared/libs/migrations/migration-runner';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: join(__dirname, '../.env') });

const services = [
  { name: 'auth', db: 'auth_db' },
  { name: 'user', db: 'user_db' },
  { name: 'device', db: 'device_db' },
  { name: 'telemetry', db: 'telemetry_db' },
  { name: 'alert', db: 'alert_db' },
  { name: 'location', db: 'location_db' },
  { name: 'billing', db: 'billing_db' },
  { name: 'integration', db: 'integration_db' },
  { name: 'dispatcher', db: 'dispatcher_db' },
  { name: 'analytics', db: 'analytics_db' },
  { name: 'ai-prediction', db: 'ai_prediction_db' },
];

async function runMigrations() {
  const command = process.argv[2] || 'up';
  const serviceName = process.argv[3];

  // On Windows it's common to have global DB_* environment variables set (e.g. DB_USER=postgres),
  // which breaks local docker-compose defaults (cms_user/cms_password). Prefer POSTGRES_* when present,
  // and ignore DB_USER=postgres style globals.
  const safeDbUser =
    process.env.POSTGRES_USER ||
    (process.env.DB_USER && process.env.DB_USER !== 'postgres' ? process.env.DB_USER : undefined) ||
    'cms_user';
  const safeDbPassword =
    process.env.POSTGRES_PASSWORD ||
    (process.env.DB_PASSWORD && process.env.DB_USER !== 'postgres' ? process.env.DB_PASSWORD : undefined) ||
    'cms_password';

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: safeDbUser,
    password: safeDbPassword,
  };

  if (serviceName) {
    const service = services.find((s) => s.name === serviceName);
    if (!service) {
      console.error(`Service not found: ${serviceName}`);
      process.exit(1);
    }

    const runner = new MigrationRunner({
      ...config,
      database: service.db,
      migrationsPath: join(__dirname, `../database/migrations/${service.name}`),
    });

    if (command === 'up') {
      await runner.runMigrations();
    } else if (command === 'down') {
      await runner.rollbackLast();
    }

    await runner.close();
  } else {
    // Run migrations for all services
    for (const service of services) {
      console.log(`\n=== Running migrations for ${service.name} ===`);
      const runner = new MigrationRunner({
        ...config,
        database: service.db,
        migrationsPath: join(__dirname, `../database/migrations/${service.name}`),
      });

      try {
        if (command === 'up') {
          await runner.runMigrations();
        } else if (command === 'down') {
          await runner.rollbackLast();
        }
      } catch (error) {
        console.error(`Error running migrations for ${service.name}:`, error);
      }

      await runner.close();
    }
  }
}

runMigrations().catch((error) => {
  console.error('Migration error:', error);
  process.exit(1);
});

