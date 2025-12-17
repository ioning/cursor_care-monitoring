import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GatewayConfig {
  constructor(private configService: ConfigService) {}

  getAuthServiceUrl(): string {
    return this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3001');
  }

  getUserServiceUrl(): string {
    return this.configService.get<string>('USER_SERVICE_URL', 'http://localhost:3002');
  }

  getDeviceServiceUrl(): string {
    return this.configService.get<string>('DEVICE_SERVICE_URL', 'http://localhost:3003');
  }

  getTelemetryServiceUrl(): string {
    return this.configService.get<string>('TELEMETRY_SERVICE_URL', 'http://localhost:3004');
  }

  getAlertServiceUrl(): string {
    return this.configService.get<string>('ALERT_SERVICE_URL', 'http://localhost:3005');
  }

  getLocationServiceUrl(): string {
    return this.configService.get<string>('LOCATION_SERVICE_URL', 'http://localhost:3006');
  }

  getBillingServiceUrl(): string {
    return this.configService.get<string>('BILLING_SERVICE_URL', 'http://localhost:3007');
  }

  getIntegrationServiceUrl(): string {
    return this.configService.get<string>('INTEGRATION_SERVICE_URL', 'http://localhost:3008');
  }

  getDispatcherServiceUrl(): string {
    return this.configService.get<string>('DISPATCHER_SERVICE_URL', 'http://localhost:3009');
  }

  getAnalyticsServiceUrl(): string {
    return this.configService.get<string>('ANALYTICS_SERVICE_URL', 'http://localhost:3010');
  }

  getAIPredictionServiceUrl(): string {
    return this.configService.get<string>('AI_PREDICTION_SERVICE_URL', 'http://localhost:3011');
  }

  getOrganizationServiceUrl(): string {
    return this.configService.get<string>('ORGANIZATION_SERVICE_URL', 'http://localhost:3012');
  }
}


