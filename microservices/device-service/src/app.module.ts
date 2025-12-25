import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DeviceController, DeviceTelemetryController } from './infrastructure/controllers/device.controller';
import { InternalController } from './infrastructure/controllers/internal.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { DeviceService } from './application/services/device.service';
import { DeviceRepository } from './infrastructure/repositories/device.repository';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { OrganizationServiceClient } from './infrastructure/clients/organization-service.client';
import { TelemetryServiceClient } from './infrastructure/clients/telemetry-service.client';
import { LocationServiceClient } from './infrastructure/clients/location-service.client';
import { ApiKeyGuard } from './infrastructure/guards/api-key.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    HttpModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET || 'please-change-me';
        if (!process.env.JWT_SECRET) {
          // eslint-disable-next-line no-console
          console.warn('[device-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [
    DeviceController,
    DeviceTelemetryController,
    InternalController,
    HealthController,
    MetricsController,
  ],
  providers: [
    DeviceService,
    DeviceRepository,
    JwtStrategy,
    OrganizationServiceClient,
    TelemetryServiceClient,
    LocationServiceClient,
    ApiKeyGuard,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async onModuleInit() {
    await this.deviceRepository.initialize();
  }
}

