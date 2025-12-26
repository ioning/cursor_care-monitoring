import { Pool } from 'pg';
import { createLogger } from '../shared/libs/logger';
import * as dotenv from 'dotenv';
import { join } from 'path';
import axios from 'axios';

dotenv.config({ path: join(__dirname, '../.env') });

const logger = createLogger({ serviceName: 'create-test-call' });

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const DEFAULT_WARD_ID = '6db0aa86-db1d-46a6-adb0-817c3cd36262';
const DEFAULT_DISPATCHER_EMAIL = process.env.DEFAULT_DISPATCHER_EMAIL || 'dispatcher@care-monitoring.ru';
const DEFAULT_DISPATCHER_PASSWORD = process.env.DEFAULT_DISPATCHER_PASSWORD || 'dispatcher123';

const config = {
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

async function login(email: string, password: string): Promise<string> {
  try {
    const response = await axios.post(`${API_GATEWAY_URL}/api/v1/auth/login`, { email, password });
    if (response.data?.success && response.data.data?.tokens?.accessToken) {
      return response.data.data.tokens.accessToken;
    }
    throw new Error('Failed to get access token');
  } catch (error: any) {
    logger.error(`Login failed for ${email}:`, error.message);
    throw error;
  }
}

async function createTestCall() {
  logger.info('Creating test emergency call for dispatcher...');

  const dispatcherDb = createDb('dispatcher_db');

  try {
    // Check if call already exists
    const existingCall = await dispatcherDb.query(
      `SELECT id FROM emergency_calls 
       WHERE ward_id = $1 AND status IN ('created', 'assigned', 'in_progress')
       LIMIT 1`,
      [DEFAULT_WARD_ID]
    );

    if (existingCall.rows.length > 0) {
      logger.info(`Test call already exists: ${existingCall.rows[0].id}`);
      return;
    }

    // Create test emergency call
    const callId = 'test-call-' + Date.now();
    await dispatcherDb.query(
      `INSERT INTO emergency_calls (
        id, ward_id, call_type, priority, status, source,
        health_snapshot, location_snapshot, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        callId,
        DEFAULT_WARD_ID,
        'test',
        'medium',
        'created',
        'test_script',
        JSON.stringify({
          alertType: 'test_alert',
          message: 'Тестовый вызов для проверки работы диспетчера',
        }),
        JSON.stringify({
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
        }),
      ]
    );

    logger.info(`Test call created: ${callId}`);
    logger.info(`Ward ID: ${DEFAULT_WARD_ID}`);
    logger.info('\nТестовый вызов создан. Диспетчер должен увидеть его в кабинете.');
  } catch (error: any) {
    logger.error('Failed to create test call:', error.message);
    throw error;
  } finally {
    await dispatcherDb.end();
  }
}

createTestCall().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

