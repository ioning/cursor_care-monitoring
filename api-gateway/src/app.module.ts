import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './controllers/health.controller';
import { MetricsController } from './controllers/metrics.controller';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { DeviceController } from './controllers/device.controller';
import { TelemetryController } from './controllers/telemetry.controller';
import { AlertController } from './controllers/alert.controller';
import { LocationController } from './controllers/location.controller';
import { BillingController } from './controllers/billing.controller';
import { DispatcherController } from './controllers/dispatcher.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { OrganizationController } from './controllers/organization.controller';
import { GatewayConfig } from './config/gateway.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    HttpModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
  ],
  controllers: [
    HealthController,
    MetricsController,
    AuthController,
    UserController,
    DeviceController,
    TelemetryController,
    AlertController,
    LocationController,
    BillingController,
    DispatcherController,
    AnalyticsController,
    OrganizationController,
  ],
  providers: [GatewayConfig],
})
export class AppModule {}





