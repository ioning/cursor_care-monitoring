import { Injectable } from '@nestjs/common';
import { publishEvent } from '../../../../shared/libs/rabbitmq';
import { randomUUID } from 'crypto';

export interface GeofenceViolationEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  correlationId: string;
  source: string;
  wardId: string;
  geofenceId: string;
  geofenceType: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  violationType: 'exit' | 'entry';
}

@Injectable()
export class LocationEventPublisher {
  async publishGeofenceViolation(event: GeofenceViolationEvent): Promise<void> {
    await publishEvent(
      'care-monitoring.events',
      'location.geofence.violation',
      event,
      { persistent: true },
    );
  }
}

