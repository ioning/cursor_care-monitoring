import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DeviceController } from './infrastructure/controllers/device.controller';
import { InternalController } from './infrastructure/controllers/internal.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { DeviceService } from './application/services/device.service';
import { DeviceRepository } from './infrastructure/repositories/device.repository';
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
  controllers: [DeviceController, InternalController, HealthController, MetricsController],
  providers: [DeviceService, DeviceRepository, JwtStrategy],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly deviceRepository: DeviceRepository) {}

  async onModuleInit() {
    await this.deviceRepository.initialize();
  }
}

