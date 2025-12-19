import { Request, Response } from 'express';
import { getDatabaseConnection } from './database';
import { getRedisClient } from './redis';
import { getRabbitMQChannel } from './rabbitmq';
import { createLogger } from './logger';

const logger = createLogger({ serviceName: 'health-check' });

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database: 'up' | 'down';
    redis?: 'up' | 'down';
    rabbitmq?: 'up' | 'down';
  };
}

export async function httpHealthCheck(_req: Request, res: Response) {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'down',
    },
  };

  // Check database
  try {
    const db = getDatabaseConnection();
    await db.query('SELECT 1');
    health.checks.database = 'up';
  } catch (error) {
    logger.error('Database health check failed:', error);
    health.checks.database = 'down';
    health.status = 'unhealthy';
  }

  // Check Redis (optional)
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.checks.redis = 'up';
  } catch (error) {
    logger.warn('Redis health check failed:', error);
    health.checks.redis = 'down';
    // Redis failure doesn't make service unhealthy
  }

  // Check RabbitMQ (optional)
  try {
    const channel = getRabbitMQChannel();
    if (channel) {
      health.checks.rabbitmq = 'up';
    } else {
      health.checks.rabbitmq = 'down';
    }
  } catch (error) {
    logger.warn('RabbitMQ health check failed:', error);
    health.checks.rabbitmq = 'down';
    // RabbitMQ failure doesn't make service unhealthy
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}

export async function httpReadinessCheck(_req: Request, res: Response) {
  // Readiness check - all critical dependencies must be up
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'down',
    },
  };

  try {
    const db = getDatabaseConnection();
    await db.query('SELECT 1');
    health.checks.database = 'up';
  } catch (error) {
    logger.error('Readiness check failed:', error);
    health.checks.database = 'down';
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
}

export async function httpLivenessCheck(_req: Request, res: Response) {
  // Liveness check - service is alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
}

