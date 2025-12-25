# Спецификация событий (Event Bus)

Документ описывает все события, публикуемые в RabbitMQ между микросервисами системы Care Monitoring.

## Общие принципы

- **Формат**: JSON
- **Exchange**: `care-monitoring.events` (topic exchange)
- **Routing Key**: `{service}.{event-type}.{version}`
- **Версионирование**: события версионируются через routing key
- **Идемпотентность**: события содержат `eventId` для дедупликации
- **Трассировка**: все события содержат `traceId` для сквозной трассировки

## Структура события

```typescript
interface BaseEvent {
  eventId: string;           // UUID события
  eventType: string;          // Тип события
  timestamp: string;          // ISO 8601 timestamp
  traceId: string;            // Correlation ID для трассировки
  source: string;             // Сервис-источник
  version: string;            // Версия схемы события
  payload: object;            // Данные события
}
```

## События по сервисам

### Telemetry Service

#### TelemetryReceived

**Routing Key**: `telemetry.received.v1`

**Описание**: Публикуется при получении данных телеметрии с устройства.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440000",
  eventType: "TelemetryReceived",
  timestamp: "2024-01-15T10:30:00Z",
  traceId: "trace-123",
  source: "telemetry-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    deviceId: "device-uuid",
    metrics: [
      {
        type: "heart_rate",
        value: 72,
        unit: "bpm",
        qualityScore: 0.95,
        timestamp: "2024-01-15T10:30:00Z"
      },
      {
        type: "spo2",
        value: 98,
        unit: "%",
        qualityScore: 0.92,
        timestamp: "2024-01-15T10:30:00Z"
      },
      {
        type: "activity",
        value: 150,
        unit: "steps",
        qualityScore: 1.0,
        timestamp: "2024-01-15T10:30:00Z"
      },
      {
        type: "accelerometer",
        value: {
          x: 0.1,
          y: -9.8,
          z: 0.2,
          magnitude: 9.8
        },
        qualityScore: 0.98,
        timestamp: "2024-01-15T10:30:00Z"
      }
    ],
    location: {
      latitude: 55.7558,
      longitude: 37.6173,
      accuracy: 10,
      source: "gps"
    },
    batteryLevel: 85,
    deviceStatus: "active"
  }
}
```

#### FallDetected

**Routing Key**: `telemetry.fall-detected.v1`

**Описание**: Публикуется при обнаружении потенциального падения.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440001",
  eventType: "FallDetected",
  timestamp: "2024-01-15T10:35:00Z",
  traceId: "trace-123",
  source: "telemetry-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    deviceId: "device-uuid",
    impactForce: 12.5,
    positionBefore: {
      x: 0.1,
      y: -9.8,
      z: 0.2
    },
    positionAfter: {
      x: 0.0,
      y: 0.0,
      z: -9.8
    },
    confidenceScore: 0.87,
    location: {
      latitude: 55.7558,
      longitude: 37.6173,
      accuracy: 10
    },
    healthMetrics: {
      heartRate: 95,
      spo2: 96,
      timestamp: "2024-01-15T10:35:00Z"
    }
  }
}
```

### AI Prediction Service

#### PredictionGenerated

**Routing Key**: `ai-prediction.prediction-generated.v1`

**Описание**: Публикуется после генерации AI-предсказания.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440002",
  eventType: "PredictionGenerated",
  timestamp: "2024-01-15T10:30:05Z",
  traceId: "trace-123",
  source: "ai-prediction-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    predictionType: "fall_prediction",
    modelId: "fall-prediction-v2.1",
    modelVersion: "2.1",
    inputFeatures: {
      heartRate: 72,
      heartRateVariability: 45,
      activity: 150,
      accelerometerMagnitude: 9.8,
      timeOfDay: "10:30",
      dayOfWeek: "monday"
    },
    output: {
      isFall: false,
      fallProbability: 0.12,
      riskScore: 3.5,
      severity: "low",
      confidence: 0.89
    },
    inferenceTimeMs: 45,
    timestamp: "2024-01-15T10:30:05Z"
  }
}
```

#### AnomalyDetected

**Routing Key**: `ai-prediction.anomaly-detected.v1`

**Описание**: Публикуется при обнаружении аномалии в данных.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440003",
  eventType: "AnomalyDetected",
  timestamp: "2024-01-15T10:30:05Z",
  traceId: "trace-123",
  source: "ai-prediction-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    metricType: "heart_rate",
    zScore: 3.2,
    baselineValue: 72,
    currentValue: 95,
    window: "5min",
    context: {
      timeOfDay: "10:30",
      activity: "resting",
      previousAnomalies: 0
    },
    confidence: 0.85,
    recommendation: "monitor_closely"
  }
}
```

#### RiskAlert

**Routing Key**: `ai-prediction.risk-alert.v1`

**Описание**: Публикуется при превышении порога риска.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440004",
  eventType: "RiskAlert",
  timestamp: "2024-01-15T10:30:05Z",
  traceId: "trace-123",
  source: "ai-prediction-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    alertId: "alert-uuid",
    riskType: "health_deterioration",
    priority: 7,
    confidence: 0.92,
    riskScore: 7.5,
    severity: "high",
    recommendation: "contact_healthcare_provider",
    ttl: "2024-01-15T11:30:00Z",
    dataSupport: {
      metrics: ["heart_rate", "spo2"],
      trend: "increasing",
      duration: "2hours"
    }
  }
}
```

#### ModelTrained

**Routing Key**: `ai-prediction.model-trained.v1`

**Описание**: Публикуется после завершения обучения модели.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440005",
  eventType: "ModelTrained",
  timestamp: "2024-01-15T12:00:00Z",
  traceId: "trace-456",
  source: "ai-prediction-service",
  version: "1.0",
  payload: {
    modelId: "fall-prediction-v2.2",
    modelType: "fall_prediction",
    version: "2.2",
    trainingJobId: "job-uuid",
    metrics: {
      accuracy: 0.94,
      precision: 0.92,
      recall: 0.93,
      f1Score: 0.925,
      rocAuc: 0.96,
      prAuc: 0.85
    },
    datasetRef: {
      startDate: "2024-01-01",
      endDate: "2024-01-15",
      sampleCount: 50000
    },
    trainingDuration: 3600,
    deployed: false
  }
}
```

#### ModelDeployed

**Routing Key**: `ai-prediction.model-deployed.v1`

**Описание**: Публикуется после развертывания модели в production.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440006",
  eventType: "ModelDeployed",
  timestamp: "2024-01-15T13:00:00Z",
  traceId: "trace-789",
  source: "ai-prediction-service",
  version: "1.0",
  payload: {
    modelId: "fall-prediction-v2.2",
    version: "2.2",
    previousVersion: "2.1",
    deploymentType: "canary",
    canaryPercentage: 10,
    healthCheck: {
      status: "healthy",
      latencyP95: 95,
      latencyP99: 120,
      errorRate: 0.001
    }
  }
}
```

### Alert Service

#### AlertCreated

**Routing Key**: `alert.created.v1`

**Описание**: Публикуется при создании нового оповещения.

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440007",
  eventType: "AlertCreated",
  timestamp: "2024-01-15T10:30:10Z",
  traceId: "trace-123",
  source: "alert-service",
  version: "1.0",
  payload: {
    alertId: "alert-uuid",
    wardId: "ward-uuid",
    ruleId: "rule-uuid",
    title: "Высокий пульс в состоянии покоя",
    description: "Пульс превысил пороговое значение на 25%",
    alertType: "health_anomaly",
    severity: "high",
    status: "active",
    aiConfidence: 0.92,
    dataSnapshot: {
      heartRate: 95,
      baseline: 72,
      timestamp: "2024-01-15T10:30:00Z"
    },
    triggeredAt: "2024-01-15T10:30:10Z"
  }
}
```

#### AlertResolved

**Routing Key**: `alert.resolved.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440008",
  eventType: "AlertResolved",
  timestamp: "2024-01-15T10:45:00Z",
  traceId: "trace-123",
  source: "alert-service",
  version: "1.0",
  payload: {
    alertId: "alert-uuid",
    wardId: "ward-uuid",
    resolvedBy: "guardian-uuid",
    resolutionNotes: "Показатели нормализовались",
    resolvedAt: "2024-01-15T10:45:00Z"
  }
}
```

### Dispatcher Service

#### EmergencyCallCreated

**Routing Key**: `dispatcher.call-created.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440009",
  eventType: "EmergencyCallCreated",
  timestamp: "2024-01-15T10:35:00Z",
  traceId: "trace-123",
  source: "dispatcher-service",
  version: "1.0",
  payload: {
    callId: "call-uuid",
    wardId: "ward-uuid",
    callType: "fall_detection",
    priority: "critical",
    status: "created",
    healthSnapshot: {
      heartRate: 95,
      spo2: 96,
      timestamp: "2024-01-15T10:35:00Z"
    },
    locationSnapshot: {
      latitude: 55.7558,
      longitude: 37.6173,
      accuracy: 10,
      address: "Москва, ул. Примерная, д. 1"
    },
    aiAnalysis: {
      fallProbability: 0.87,
      severity: "high",
      confidence: 0.89
    },
    createdAt: "2024-01-15T10:35:00Z"
  }
}
```

#### CallResolved

**Routing Key**: `dispatcher.call-resolved.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440010",
  eventType: "CallResolved",
  timestamp: "2024-01-15T11:00:00Z",
  traceId: "trace-123",
  source: "dispatcher-service",
  version: "1.0",
  payload: {
    callId: "call-uuid",
    wardId: "ward-uuid",
    dispatcherId: "dispatcher-uuid",
    resolutionNotes: "Бригада прибыла, помощь оказана",
    resolutionType: "medical_assistance_provided",
    resolvedAt: "2024-01-15T11:00:00Z"
  }
}
```

### Location Service

#### LocationUpdated

**Routing Key**: `location.updated.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440011",
  eventType: "LocationUpdated",
  timestamp: "2024-01-15T10:30:00Z",
  traceId: "trace-123",
  source: "location-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    deviceId: "device-uuid",
    latitude: 55.7558,
    longitude: 37.6173,
    accuracy: 10,
    altitude: 150,
    speed: 0,
    source: "gps",
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

#### GeofenceBreached

**Routing Key**: `location.geofence-breached.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440012",
  eventType: "GeofenceBreached",
  timestamp: "2024-01-15T10:30:00Z",
  traceId: "trace-123",
  source: "location-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    geofenceId: "geofence-uuid",
    geofenceName: "Безопасная зона",
    eventType: "exit",
    location: {
      latitude: 55.7558,
      longitude: 37.6173,
      accuracy: 10
    },
    timestamp: "2024-01-15T10:30:00Z"
  }
}
```

### Billing Service

#### PaymentProcessed

**Routing Key**: `billing.payment-processed.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440013",
  eventType: "PaymentProcessed",
  timestamp: "2024-01-15T10:00:00Z",
  traceId: "trace-456",
  source: "billing-service",
  version: "1.0",
  payload: {
    paymentId: "payment-uuid",
    subscriptionId: "subscription-uuid",
    guardianId: "guardian-uuid",
    amount: 1990.00,
    currency: "RUB",
    status: "completed",
    paymentMethod: "yookassa",
    externalPaymentId: "yookassa-payment-id",
    paidAt: "2024-01-15T10:00:00Z"
  }
}
```

#### SubscriptionExpired

**Routing Key**: `billing.subscription-expired.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440014",
  eventType: "SubscriptionExpired",
  timestamp: "2024-01-15T10:00:00Z",
  traceId: "trace-456",
  source: "billing-service",
  version: "1.0",
  payload: {
    subscriptionId: "subscription-uuid",
    guardianId: "guardian-uuid",
    planId: "plan-uuid",
    expiredAt: "2024-01-15T10:00:00Z",
    daysOverdue: 3
  }
}
```

### User Service

#### WardCreated

**Routing Key**: `user.ward-created.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440015",
  eventType: "WardCreated",
  timestamp: "2024-01-15T09:00:00Z",
  traceId: "trace-789",
  source: "user-service",
  version: "1.0",
  payload: {
    wardId: "ward-uuid",
    guardianId: "guardian-uuid",
    fullName: "Иванов Иван Иванович",
    dateOfBirth: "1945-05-15",
    medicalConditions: {
      allergies: ["пенициллин"],
      chronicDiseases: ["гипертония"],
      medications: ["лизиноприл"]
    },
    createdAt: "2024-01-15T09:00:00Z"
  }
}
```

### Device Service

#### DeviceRegistered

**Routing Key**: `device.registered.v1`

**Payload**:
```typescript
{
  eventId: "550e8400-e29b-41d4-a716-446655440016",
  eventType: "DeviceRegistered",
  timestamp: "2024-01-15T09:30:00Z",
  traceId: "trace-789",
  source: "device-service",
  version: "1.0",
  payload: {
    deviceId: "device-uuid",
    deviceModelId: "model-uuid",
    serialNumber: "SN123456",
    macAddress: "AA:BB:CC:DD:EE:FF",
    wardId: "ward-uuid",
    registeredAt: "2024-01-15T09:30:00Z"
  }
}
```

## Очереди и подписки

### Очереди по сервисам

- `telemetry.received.queue` → AI Prediction Service
- `ai-prediction.prediction-generated.queue` → Alert Service
- `ai-prediction.risk-alert.queue` → Alert Service, Dispatcher Service
- `alert.created.queue` → Integration Service
- `dispatcher.call-created.queue` → Integration Service
- `billing.payment-processed.queue` → User Service (активация подписки)
- `billing.subscription-expired.queue` → User Service (ограничение доступа)

### Dead Letter Queue (DLQ)

Все неудачно обработанные сообщения попадают в `care-monitoring.dlq` с метаданными:
- Оригинальное сообщение
- Причина ошибки
- Количество попыток
- Timestamp последней попытки

## Обработка ошибок

- **Retry Policy**: 3 попытки с экспоненциальной задержкой (1s, 5s, 30s)
- **DLQ**: После 3 неудачных попыток сообщение попадает в DLQ
- **Idempotency**: Обработчики должны проверять `eventId` для предотвращения дубликатов

## Мониторинг событий

Метрики для Prometheus:
- `events_published_total{service, event_type}` - количество опубликованных событий
- `events_consumed_total{service, event_type}` - количество обработанных событий
- `events_failed_total{service, event_type, error_type}` - количество ошибок
- `event_processing_duration_seconds{service, event_type}` - время обработки

