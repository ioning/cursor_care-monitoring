import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GatewayConfig } from '../config/gateway.config';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
  timestamp?: string;
  checks?: {
    database?: 'up' | 'down';
    redis?: 'up' | 'down';
    rabbitmq?: 'up' | 'down';
  };
  error?: string;
}

interface ServiceInfo {
  name: string;
  port: number;
  url: string;
}

@ApiTags('services')
@Controller('admin/services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  private getServices(): ServiceInfo[] {
    return [
      { name: 'API Gateway', port: 3000, url: 'http://localhost:3000' },
      { name: 'Auth Service', port: 3001, url: this.gatewayConfig.getAuthServiceUrl() },
      { name: 'User Service', port: 3002, url: this.gatewayConfig.getUserServiceUrl() },
      { name: 'Device Service', port: 3003, url: this.gatewayConfig.getDeviceServiceUrl() },
      { name: 'Telemetry Service', port: 3004, url: this.gatewayConfig.getTelemetryServiceUrl() },
      { name: 'Alert Service', port: 3005, url: this.gatewayConfig.getAlertServiceUrl() },
      { name: 'Location Service', port: 3006, url: this.gatewayConfig.getLocationServiceUrl() },
      { name: 'Billing Service', port: 3007, url: this.gatewayConfig.getBillingServiceUrl() },
      { name: 'Integration Service', port: 3008, url: this.gatewayConfig.getIntegrationServiceUrl() },
      { name: 'Dispatcher Service', port: 3009, url: this.gatewayConfig.getDispatcherServiceUrl() },
      { name: 'Analytics Service', port: 3010, url: this.gatewayConfig.getAnalyticsServiceUrl() },
      { name: 'AI Prediction Service', port: 3011, url: this.gatewayConfig.getAIPredictionServiceUrl() },
      { name: 'Organization Service', port: 3012, url: this.gatewayConfig.getOrganizationServiceUrl() },
    ];
  }

  constructor(
    private readonly httpService: HttpService,
    private readonly gatewayConfig: GatewayConfig,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Get health status of all services' })
  @ApiResponse({ status: 200, description: 'Services health status retrieved successfully' })
  async getAllServicesHealth(@Request() req: any): Promise<{ services: ServiceHealth[] }> {
    const services = this.getServices();
    const healthChecks = await Promise.allSettled(
      services.map(async (service) => {
        const startTime = Date.now();
        try {
          const response = await firstValueFrom(
            this.httpService.get(`${service.url}/health`, {
              timeout: 5000,
            }),
          );

          const latency = Date.now() - startTime;
          const healthData = response.data;

          return {
            name: service.name,
            status: healthData.status === 'healthy' ? 'healthy' : 'unhealthy',
            latency,
            timestamp: new Date().toISOString(),
            checks: healthData.checks || {},
          } as ServiceHealth;
        } catch (error: any) {
          return {
            name: service.name,
            status: 'unhealthy',
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
            error: error.message || 'Service unavailable',
          } as ServiceHealth;
        }
      }),
    );

    const services = healthChecks.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return {
        name: 'Unknown',
        status: 'unknown' as const,
        timestamp: new Date().toISOString(),
        error: result.reason?.message || 'Failed to check service',
      } as ServiceHealth;
    });

    return { services };
  }

  @Post(':serviceName/restart')
  @ApiOperation({ summary: 'Restart a specific service' })
  @ApiResponse({ status: 200, description: 'Service restart initiated' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async restartService(@Param('serviceName') serviceName: string, @Request() req: any) {
    const { exec } = require('child_process');
    const path = require('path');
    const os = require('os');

    // Map service names to valid service identifiers
    const serviceMap: Record<string, string> = {
      'api-gateway': 'api-gateway',
      'auth-service': 'auth-service',
      'user-service': 'user-service',
      'device-service': 'device-service',
      'telemetry-service': 'telemetry-service',
      'alert-service': 'alert-service',
      'location-service': 'location-service',
      'billing-service': 'billing-service',
      'integration-service': 'integration-service',
      'dispatcher-service': 'dispatcher-service',
      'analytics-service': 'analytics-service',
      'ai-prediction-service': 'ai-prediction-service',
      'organization-service': 'organization-service',
    };

    const validServiceName = serviceMap[serviceName.toLowerCase()];
    if (!validServiceName) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const projectRoot = path.resolve(__dirname, '../../../..');
    const isWindows = os.platform() === 'win32';
    const scriptName = isWindows ? 'restart-service.ps1' : 'restart-service.sh';
    const scriptPath = path.join(projectRoot, 'scripts', scriptName);

    try {
      // Запускаем скрипт в фоновом режиме (не ждем завершения)
      if (isWindows) {
        exec(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -ServiceName "${validServiceName}"`,
          { cwd: projectRoot, windowsHide: true },
          () => {
            // Callback игнорируется, так как процесс запускается в фоне
          },
        );
      } else {
        exec(`bash "${scriptPath}" "${validServiceName}"`, { cwd: projectRoot }, () => {
          // Callback игнорируется, так как процесс запускается в фоне
        });
      }

      return {
        success: true,
        message: `Restart command for ${serviceName} has been initiated`,
        service: serviceName,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to restart service: ${error.message}`);
    }
  }

  @Post('restart-all')
  @ApiOperation({ summary: 'Restart all services' })
  @ApiResponse({ status: 200, description: 'All services restart initiated' })
  async restartAllServices(@Request() req: any, @Body() body?: { keepInfra?: boolean }) {
    const { exec } = require('child_process');
    const path = require('path');
    const os = require('os');

    const projectRoot = path.resolve(__dirname, '../../../..');
    const isWindows = os.platform() === 'win32';
    const scriptName = isWindows ? 'restart-all-services.ps1' : 'restart-all-services.sh';
    const scriptPath = path.join(projectRoot, 'scripts', scriptName);

    try {
      // Запускаем скрипт в фоновом режиме
      if (isWindows) {
        const keepInfraFlag = body?.keepInfra ? '-KeepInfra' : '';
        exec(
          `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" ${keepInfraFlag}`,
          { cwd: projectRoot, windowsHide: true },
          () => {
            // Callback игнорируется, так как процесс запускается в фоне
          },
        );
      } else {
        const keepInfraFlag = body?.keepInfra ? '--keep-infra' : '';
        exec(`bash "${scriptPath}" ${keepInfraFlag}`, { cwd: projectRoot }, () => {
          // Callback игнорируется, так как процесс запускается в фоне
        });
      }

      return {
        success: true,
        message: 'Restart command for all services has been initiated',
        services: this.getServices().map((s) => s.name),
        keepInfra: body?.keepInfra || false,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      throw new Error(`Failed to restart all services: ${error.message}`);
    }
  }
}

