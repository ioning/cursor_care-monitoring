import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIPredictionController } from './infrastructure/controllers/ai-prediction.controller';
import { HealthController } from './infrastructure/controllers/health.controller';
import { MetricsController } from './infrastructure/controllers/metrics.controller';
import { AIPredictionService } from './application/services/ai-prediction.service';
import { FallPredictionModel } from './infrastructure/ml-models/fall-prediction.model';
import { PredictionRepository } from './infrastructure/repositories/prediction.repository';
import { PredictionEventPublisher } from './infrastructure/messaging/prediction-event.publisher';
import { createLogger } from '../../shared/libs/logger';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  controllers: [AIPredictionController, HealthController, MetricsController],
  providers: [
    AIPredictionService,
    FallPredictionModel,
    PredictionRepository,
    PredictionEventPublisher,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = createLogger({ serviceName: 'ai-prediction-service' });

  constructor(private readonly predictionRepository: PredictionRepository) {}

  async onModuleInit() {
    try {
      await this.predictionRepository.initialize();
      this.logger.info('Prediction repository initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize prediction repository', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

