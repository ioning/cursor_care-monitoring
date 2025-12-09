import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export async function createRedisConnection(config: RedisConfig): Promise<RedisClientType> {
  if (redisClient?.isOpen) {
    return redisClient;
  }

  const url = `redis://${config.password ? `:${config.password}@` : ''}${config.host}:${config.port}${config.db ? `/${config.db}` : ''}`;

  redisClient = createClient({
    url,
  }) as RedisClientType;

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });

  await redisClient.connect();

  return redisClient;
}

export function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis connection not initialized. Call createRedisConnection first.');
  }
  return redisClient;
}

export async function closeRedisConnection(): Promise<void> {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    redisClient = null;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

