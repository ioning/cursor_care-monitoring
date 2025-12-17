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

  // Оптимизированные настройки connection pool
  const poolConfig: PoolConfig = {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    // Увеличено количество соединений для высокой нагрузки
    max: config.max || 50,
    // Минимальное количество соединений для быстрого отклика
    min: config.min || 5,
    // Увеличено время простоя перед закрытием соединения
    idleTimeoutMillis: config.idleTimeoutMillis || 60000,
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


