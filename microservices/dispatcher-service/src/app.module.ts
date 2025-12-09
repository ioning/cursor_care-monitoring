import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DispatcherController } from './infrastructure/controllers/dispatcher.controller';
import { SMPController } from './infrastructure/controllers/smp.controller';
import { DispatcherService } from './application/services/dispatcher.service';
import { SMPService } from './application/services/smp.service';
import { CallRepository } from './infrastructure/repositories/call.repository';
import { DispatcherRepository } from './infrastructure/repositories/dispatcher.repository';
import { SMPProviderRepository } from './infrastructure/repositories/smp-provider.repository';
import { ServicePriceRepository } from './infrastructure/repositories/service-price.repository';
import { SMPCallRepository } from './infrastructure/repositories/smp-call.repository';
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
  controllers: [DispatcherController, SMPController],
  providers: [
    DispatcherService,
    SMPService,
    CallRepository,
    DispatcherRepository,
    SMPProviderRepository,
    ServicePriceRepository,
    SMPCallRepository,
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


    SMPCallRepository,
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


    SMPCallRepository,
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

