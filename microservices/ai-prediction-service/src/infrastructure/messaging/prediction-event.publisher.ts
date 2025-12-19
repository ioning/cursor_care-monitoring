import { Injectable } from '@nestjs/common';
import { publishEvent } from '../../../../../shared/libs/rabbitmq';
import { PredictionGeneratedEvent, RiskAlertEvent } from '../../../../../shared/types/event.types';

@Injectable()
export class PredictionEventPublisher {
  async publishPredictionGenerated(event: PredictionGeneratedEvent): Promise<void> {
    await publishEvent(
      'care-monitoring.events',
      'ai.prediction.generated',
      event,
      { persistent: true },
    );
  }

  async publishRiskAlert(event: RiskAlertEvent): Promise<void> {
    await publishEvent(
      'care-monitoring.events',
      'ai.risk.alert',
      event,
      { persistent: true },
    );
  }
}

