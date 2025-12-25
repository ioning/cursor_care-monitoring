import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TelemetryController } from './infrastructure/controllers/telemetry.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { TelemetryService } from './application/services/telemetry.service';
import { TelemetryRepository } from './infrastructure/repositories/telemetry.repository';
import { TelemetryEventPublisher } from './infrastructure/messaging/telemetry-event.publisher';
import { DeviceServiceClient } from './infrastructure/clients/device-service.client';
import { LocationServiceClient } from './infrastructure/clients/location-service.client';
import { AlertServiceClient } from './infrastructure/clients/alert-service.client';
import { UserServiceClient } from './infrastructure/clients/user-service.client';
import { JwtOrInternalGuard } from './infrastructure/guards/jwt-or-internal.guard';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET || 'please-change-me';
        if (!process.env.JWT_SECRET) {
          // eslint-disable-next-line no-console
          console.warn('[telemetry-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [TelemetryController, HealthController, MetricsController],
  providers: [
    TelemetryService,
    TelemetryRepository,
    TelemetryEventPublisher,
    DeviceServiceClient,
    LocationServiceClient,
    AlertServiceClient,
    UserServiceClient,
    JwtOrInternalGuard,
    JwtStrategy,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly telemetryRepository: TelemetryRepository) {}

  async onModuleInit() {
    await this.telemetryRepository.initialize();
  }
}

