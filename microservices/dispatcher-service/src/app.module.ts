import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DispatcherController } from './infrastructure/controllers/dispatcher.controller';
import { SMPController } from './infrastructure/controllers/smp.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { DispatcherService } from './application/services/dispatcher.service';
import { SMPService } from './application/services/smp.service';
import { CallRepository } from './infrastructure/repositories/call.repository';
import { DispatcherRepository } from './infrastructure/repositories/dispatcher.repository';
import { SMPProviderRepository } from './infrastructure/repositories/smp-provider.repository';
import { ServicePriceRepository } from './infrastructure/repositories/service-price.repository';
import { SMPCallRepository } from './infrastructure/repositories/smp-call.repository';
import { UserServiceClient } from './infrastructure/clients/user-service.client';
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
          console.warn('[dispatcher-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [DispatcherController, SMPController, HealthController, MetricsController],
  providers: [
    DispatcherService,
    SMPService,
    CallRepository,
    DispatcherRepository,
    SMPProviderRepository,
    ServicePriceRepository,
    SMPCallRepository,
    UserServiceClient,
    JwtStrategy,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    private readonly callRepository: CallRepository,
    private readonly dispatcherRepository: DispatcherRepository,
    private readonly smpProviderRepository: SMPProviderRepository,
    private readonly servicePriceRepository: ServicePriceRepository,
    private readonly smpCallRepository: SMPCallRepository,
  ) {}

  async onModuleInit() {
    await this.callRepository.initialize();
    await this.dispatcherRepository.initialize();
    await this.smpProviderRepository.initialize();
    await this.servicePriceRepository.initialize();
    await this.smpCallRepository.initialize();
  }
}

