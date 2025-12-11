import { Module, DynamicModule } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';
import { MetricsController } from '../controllers/metrics.controller';

@Module({})
export class HealthModule {
  static forRoot(serviceName: string): DynamicModule {
    // Create controller instances with service name
    const healthController = new HealthController(serviceName);
    
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

