import { Module, DynamicModule } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';
import { MetricsController } from '../controllers/metrics.controller';

@Module({})
export class HealthModule {
  static forRoot(serviceName: string): DynamicModule {
    return {
      module: HealthModule,
      controllers: [HealthController, MetricsController],
      providers: [
        {
          provide: 'SERVICE_NAME',
          useValue: serviceName,
        },
      ],
      exports: [],
    };
  }
}

