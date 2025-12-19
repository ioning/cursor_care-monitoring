import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createLogger } from '../../../../../shared/libs/logger';
import { getDatabaseConnection } from '../../../../../shared/libs/database';
import { getRedisClient } from '../../../../../shared/libs/redis';
import { getChannel } from '../../../../../shared/libs/rabbitmq';

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
  private readonly serviceName = 'user-service';

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

    try {
      const redis = getRedisClient();
      if (redis) {
        await redis.ping();
        health.checks.redis = 'up';
      }
    } catch (error: any) {
      logger.debug('Redis health check failed', { error: error?.message });
      health.checks.redis = 'down';
    }

    try {
      const channel = getChannel();
      if (channel) {
        health.checks.rabbitmq = 'up';
      } else {
        health.checks.rabbitmq = 'down';
      }
    } catch (error: any) {
      logger.debug('RabbitMQ health check failed', { error: error?.message });
      health.checks.rabbitmq = 'down';
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
