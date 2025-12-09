import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocationController } from './infrastructure/controllers/location.controller';
import { LocationService } from './application/services/location.service';
import { LocationRepository } from './infrastructure/repositories/location.repository';
import { GeofenceRepository } from './infrastructure/repositories/geofence.repository';
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
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    LocationRepository,
    GeofenceRepository,
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



  async onModuleInit() {
    await this.locationRepository.initialize();
    await this.geofenceRepository.initialize();
  }
}



  async onModuleInit() {
    await this.locationRepository.initialize();
    await this.geofenceRepository.initialize();
  }
}

