import { createDatabaseConnection } from '../libs/database';
import { createRedisConnection } from '../libs/redis';
import { createLogger } from '../libs/logger';

export async function setupTestEnvironment() {
  // Setup test database
  await createDatabaseConnection({
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'test_db',
    user: process.env.TEST_DB_USER || 'cms_user',
    password: process.env.TEST_DB_PASSWORD || 'cms_password',
  });

  // Setup test Redis (optional)
  try {
    await createRedisConnection({
      host: process.env.TEST_REDIS_HOST || 'localhost',
      port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
    });
  } catch (error) {
    // Redis is optional for tests
    console.warn('Redis connection failed in tests:', error);
  }
}

export async function teardownTestEnvironment() {
  // Cleanup will be handled by test framework
}

export function createTestLogger() {
  return createLogger({ serviceName: 'test' });
}

