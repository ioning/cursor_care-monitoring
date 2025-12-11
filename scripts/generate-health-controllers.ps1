# PowerShell script to generate health and metrics controllers for all services
# Usage: .\scripts\generate-health-controllers.ps1

$ErrorActionPreference = "Stop"

$services = @(
    @{ name = "user-service"; port = 3002 },
    @{ name = "device-service"; port = 3003 },
    @{ name = "telemetry-service"; port = 3004 },
    @{ name = "alert-service"; port = 3005 },
    @{ name = "location-service"; port = 3006 },
    @{ name = "billing-service"; port = 3007 },
    @{ name = "integration-service"; port = 3008 },
    @{ name = "dispatcher-service"; port = 3009 },
    @{ name = "analytics-service"; port = 3010 },
    @{ name = "ai-prediction-service"; port = 3011 },
    @{ name = "organization-service"; port = 3012 }
)

$healthTemplate = Get-Content -Path "scripts\templates\health.controller.template.ts" -Raw -ErrorAction SilentlyContinue
$metricsTemplate = Get-Content -Path "scripts\templates\metrics.controller.template.ts" -Raw -ErrorAction SilentlyContinue

if (-not $healthTemplate) {
    Write-Host "Templates not found, using inline generation..." -ForegroundColor Yellow
    
    foreach ($service in $services) {
        $serviceName = $service.name
        $controllersPath = "microservices\$serviceName\src\infrastructure\controllers"
        
        Write-Host "Processing $serviceName..." -ForegroundColor Cyan
        
        if (-not (Test-Path $controllersPath)) {
            Write-Host "  Controllers directory not found: $controllersPath" -ForegroundColor Yellow
            continue
        }
        
        # Generate health controller content
        $healthContent = @"
import { Controller, Get, HttpStatus, HttpException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { createLogger } from '../../../../../shared/libs/logger';
import { getDatabaseConnection } from '../../../../../shared/libs/database';
import { getRedisClient } from '../../../../../shared/libs/redis';
import { getRabbitMQChannel } from '../../../../../shared/libs/rabbitmq';

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
  private readonly serviceName = '$serviceName';

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
      const channel = getRabbitMQChannel();
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
"@

        # Generate metrics controller content
        $metricsContent = @"
import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { register } from '../../../../../shared/libs/metrics';

@ApiTags('metrics')
@Controller()
export class MetricsController {
  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics' })
  async metrics(@Res() res: Response) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  }
}
"@

        # Write files
        $healthContent | Out-File -FilePath "$controllersPath\health.controller.ts" -Encoding utf8 -Force
        $metricsContent | Out-File -FilePath "$controllersPath\metrics.controller.ts" -Encoding utf8 -Force
        Write-Host "  Created health and metrics controllers" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done! Now update app.module.ts in each service to include HealthController and MetricsController" -ForegroundColor Green
