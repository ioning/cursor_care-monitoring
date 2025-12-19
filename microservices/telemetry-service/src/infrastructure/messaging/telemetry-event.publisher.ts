import { Injectable } from '@nestjs/common';
import { publishEvent } from '../../../../../shared/libs/rabbitmq';
import { TelemetryReceivedEvent } from '../../../../../shared/types/event.types';

@Injectable()
export class TelemetryEventPublisher {
  async publishTelemetryReceived(event: TelemetryReceivedEvent): Promise<void> {
    await publishEvent(
      'care-monitoring.events',
      'telemetry.data.received',
      event,
      { persistent: true },
    );
  }
}

