import { Pool, PoolConfig } from 'pg';

let pool: Pool | null = null;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  statement_timeout?: number;
  query_timeout?: number;
  application_name?: string;
}

export function createDatabaseConnection(config: DatabaseConfig): Pool {
  if (pool) {
    return pool;
  }

  // Connection pool defaults tuned for local dev:
  // Many microservices run concurrently on one Postgres instance, so keep pool sizes small by default.
  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    // Limit connections by default to avoid exhausting Postgres max_connections in dev
    max: config.max ?? 5,
    // Keep 0 idle connections by default (faster startup, fewer reserved slots)
    min: config.min ?? 0,
    // Close idle connections reasonably fast in dev
    idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
    // Увеличено время ожидания соединения
    connectionTimeoutMillis: config.connectionTimeoutMillis || 5000,
    // Таймаут для выполнения запросов (30 секунд)
    statement_timeout: config.statement_timeout || 30000,
    // Таймаут для запросов
    query_timeout: config.query_timeout || 30000,
    // Имя приложения для мониторинга
    application_name: config.application_name || 'care-monitoring',
    // Дополнительные оптимизации
    allowExitOnIdle: false,
  };

  pool = new Pool(poolConfig);

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });

  pool.on('connect', () => {
    // Устанавливаем оптимальные настройки для каждого соединения
    pool?.query('SET work_mem = "256MB"').catch(() => {});
    pool?.query('SET maintenance_work_mem = "512MB"').catch(() => {});
    pool?.query('SET effective_cache_size = "2GB"').catch(() => {});
    pool?.query('SET random_page_cost = 1.1').catch(() => {});
  });

  return pool;
}

export function getDatabaseConnection(): Pool {
  if (!pool) {
    throw new Error('Database connection not initialized. Call createDatabaseConnection first.');
  }
  return pool;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}


