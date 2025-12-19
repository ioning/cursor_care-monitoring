import { Controller, Get, HttpStatus, HttpException, Inject, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createLogger } from '../libs/logger';
import { getDatabaseConnection } from '../libs/database';
import { getRedisClient } from '../libs/redis';
import { getRabbitMQChannel } from '../libs/rabbitmq';

const logger = createLogger({ serviceName: 'health-check' });

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  service: string;
  checks: {
    database?: 'up' | 'down';
    redis?: 'up' | 'down';
    rabbitmq?: 'up' | 'down';
  };
}

@ApiTags('health')
@Controller()
export class HealthController {
  private readonly serviceName: string;

  constructor(@Optional() @Inject('SERVICE_NAME') serviceName?: string) {
    this.serviceName = serviceName || 'service';
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  async health() {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      checks: {},
    };

    // Check database
    try {
      const db = getDatabaseConnection();
      if (db) {
        await db.query('SELECT 1');
        health.checks.database = 'up';
      }
    } catch (error: any) {
      logger.warn('Database health check failed', { error: error?.message });
      health.checks.database = 'down';
      health.status = 'unhealthy';
    }

    // Check Redis (optional)
    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
        health.checks.redis = 'up';
      }
    } catch (error: any) {
      logger.debug('Redis health check failed', { error: error?.message });
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
    } catch (error: any) {
      logger.debug('RabbitMQ health check failed', { error: error?.message });
      health.checks.rabbitmq = 'down';
      // RabbitMQ failure doesn't make service unhealthy
    }

    if (health.status === 'unhealthy') {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness() {
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      checks: {},
    };

    // Readiness check - all critical dependencies must be up
    try {
      const db = getDatabaseConnection();
      if (db) {
        await db.query('SELECT 1');
        health.checks.database = 'up';
      } else {
        health.checks.database = 'down';
        health.status = 'unhealthy';
      }
    } catch (error: any) {
      logger.error('Readiness check failed', { error: error?.message });
      health.checks.database = 'down';
      health.status = 'unhealthy';
    }

    if (health.status === 'unhealthy') {
      throw new HttpException(health, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return health;
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      uptime: process.uptime(),
    };
  }
}

