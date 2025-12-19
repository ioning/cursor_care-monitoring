import { Injectable } from '@nestjs/common';
import { publishEvent } from '../../../../../shared/libs/rabbitmq';
import { AlertCreatedEvent } from '../../../../../shared/types/event.types';

@Injectable()
export class AlertEventPublisher {
  async publishAlertCreated(event: AlertCreatedEvent): Promise<void> {
    await publishEvent(
      'care-monitoring.events',
      'alert.created',
      event,
      { persistent: true },
    );
  }
}

