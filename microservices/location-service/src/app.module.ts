import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocationController } from './infrastructure/controllers/location.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { LocationService } from './application/services/location.service';
import { LocationRepository } from './infrastructure/repositories/location.repository';
import { GeofenceRepository } from './infrastructure/repositories/geofence.repository';
import { LocationEventPublisher } from './infrastructure/messaging/location-event.publisher';
import { YandexGeocoderService } from './infrastructure/services/geocoding/yandex-geocoder.service';
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
          console.warn('[location-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [LocationController, HealthController, MetricsController],
  providers: [
    LocationService,
    LocationRepository,
    GeofenceRepository,
    LocationEventPublisher,
    YandexGeocoderService,
    JwtStrategy,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly locationRepository: LocationRepository,
    private readonly geofenceRepository: GeofenceRepository,
  ) {}

  async onModuleInit() {
    await this.locationRepository.initialize();
    await this.geofenceRepository.initialize();
  }
}

