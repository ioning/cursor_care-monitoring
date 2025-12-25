export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  version: string;
  correlationId: string;
  source: string;
  userId?: string;
  wardId?: string;
  metadata?: Record<string, any>;
}

export interface TelemetryReceivedEvent extends BaseEvent {
  eventType: 'telemetry.data.received';
  deviceId: string;
  data: {
    metrics: Array<{
      type: string;
      value: number;
      unit?: string;
      qualityScore?: number;
      timestamp: string;
    }>;
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      source: string;
    };
    deviceInfo?: {
      batteryLevel?: number;
      firmwareVersion?: string;
    };
  };
}

export interface PredictionGeneratedEvent extends BaseEvent {
  eventType: 'ai.prediction.generated';
  data: {
    predictionType: string;
    modelId: string;
    modelVersion: string;
    inputFeatures: Record<string, any>;
    output: {
      riskScore: number;
      confidence: number;
      severity: string;
      timeHorizon?: string;
    };
    inferenceLatencyMs: number;
  };
}

export interface RiskAlertEvent extends BaseEvent {
  eventType: 'ai.risk.alert';
  data: {
    alertType: string;
    riskScore: number;
    confidence: number;
    priority: number;
    severity: string;
    recommendation?: string;
    modelId: string;
    modelVersion: string;
    ttl?: string;
  };
}

export interface AlertCreatedEvent extends BaseEvent {
  eventType: 'alert.created';
  data: {
    alertId: string;
    ruleId?: string;
    title: string;
    description?: string;
    alertType: string;
    severity: string;
    status: string;
    aiConfidence?: number;
    dataSnapshot?: Record<string, any>;
    triggeredAt: string;
  };
}

export interface EmergencyCallCreatedEvent extends BaseEvent {
  eventType: 'dispatcher.call.created';
  data: {
    callId: string;
    callType: string;
    priority: string;
    status: string;
    healthSnapshot?: Record<string, any>;
    locationSnapshot?: Record<string, any>;
    aiAnalysis?: Record<string, any>;
    createdAt: string;
  };
}

export interface GeofenceViolationEvent extends BaseEvent {
  eventType: 'location.geofence.violation';
  geofenceId: string;
  geofenceType: string;
  violationType: 'exit' | 'entry';
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
}

export type SystemEvent =
  | TelemetryReceivedEvent
  | PredictionGeneratedEvent
  | RiskAlertEvent
  | AlertCreatedEvent
  | EmergencyCallCreatedEvent
  | GeofenceViolationEvent;

