# Спецификация событий RabbitMQ

Документ описывает все события, публикуемые в RabbitMQ между микросервисами системы Care Monitoring.

## Общие принципы

- **Exchange**: `care-monitoring.events` (topic exchange)
- **Routing keys**: `{service}.{entity}.{action}` (например, `telemetry.data.received`)
- **Формат**: JSON
- **Версионирование**: поле `version` в payload
- **Correlation ID**: обязательное поле для трассировки

## Структура базового события

```typescript
interface BaseEvent {
  eventId: string;          // UUID события
  eventType: string;         // Тип события (routing key)
  timestamp: string;         // ISO 8601
  version: string;           // Версия схемы события (например, "1.0")
  correlationId: string;      // Для трассировки запроса
  source: string;            // Сервис-источник (например, "telemetry-service")
  userId?: string;           // ID пользователя (если применимо)
  wardId?: string;           // ID подопечного (если применимо)
  metadata?: Record<string, any>; // Дополнительные метаданные
}
```

## События Telemetry Service

### TelemetryReceived

**Routing key**: `telemetry.data.received`

**Описание**: Публикуется при получении данных телеметрии с устройства.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "telemetry.data.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "correlationId": "req-123",
  "source": "telemetry-service",
  "wardId": "ward-456",
  "deviceId": "device-789",
  "data": {
    "metrics": [
      {
        "type": "heart_rate",
        "value": 72,
        "unit": "bpm",
        "qualityScore": 0.95,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "type": "steps",
        "value": 1250,
        "unit": "count",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "type": "activity",
        "value": 0.65,
        "unit": "normalized",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    ],
    "location": {
      "latitude": 55.7558,
      "longitude": 37.6173,
      "accuracy": 10.5,
      "source": "gps"
    },
    "deviceInfo": {
      "batteryLevel": 85,
      "firmwareVersion": "1.2.3"
    }
  }
}
```

### FallDetected

**Routing key**: `telemetry.fall.detected`

**Описание**: Публикуется при обнаружении потенциального падения.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440001",
  "eventType": "telemetry.fall.detected",
  "timestamp": "2024-01-15T10:35:00Z",
  "version": "1.0",
  "correlationId": "req-124",
  "source": "telemetry-service",
  "wardId": "ward-456",
  "deviceId": "device-789",
  "data": {
    "impactForce": 8.5,
    "positionBefore": {
      "x": 0.1,
      "y": 0.2,
      "z": 0.9
    },
    "positionAfter": {
      "x": 0.0,
      "y": 0.0,
      "z": -0.1
    },
    "confidenceScore": 0.87,
    "healthMetrics": {
      "heartRate": 95,
      "heartRateVariability": 45,
      "spo2": 96
    }
  }
}
```

### AnomalyDetected

**Routing key**: `telemetry.anomaly.detected`

**Описание**: Публикуется при обнаружении аномалии в данных.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440002",
  "eventType": "telemetry.anomaly.detected",
  "timestamp": "2024-01-15T10:40:00Z",
  "version": "1.0",
  "correlationId": "req-125",
  "source": "telemetry-service",
  "wardId": "ward-456",
  "deviceId": "device-789",
  "data": {
    "metricType": "heart_rate",
    "value": 120,
    "expectedRange": {
      "min": 60,
      "max": 100
    },
    "zScore": 3.2,
    "severity": "medium",
    "context": {
      "timeOfDay": "morning",
      "activityLevel": "resting"
    }
  }
}
```

## События AI Prediction Service

### PredictionGenerated

**Routing key**: `ai.prediction.generated`

**Описание**: Публикуется при генерации AI-предсказания.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440003",
  "eventType": "ai.prediction.generated",
  "timestamp": "2024-01-15T10:30:05Z",
  "version": "1.0",
  "correlationId": "req-123",
  "source": "ai-prediction-service",
  "wardId": "ward-456",
  "data": {
    "predictionType": "fall_prediction",
    "modelId": "fall-prediction-v2.1",
    "modelVersion": "2.1.0",
    "inputFeatures": {
      "heartRate": 72,
      "activity": 0.65,
      "steps": 1250,
      "timeOfDay": "morning"
    },
    "output": {
      "riskScore": 0.15,
      "confidence": 0.92,
      "severity": "low",
      "timeHorizon": "15-30 minutes"
    },
    "inferenceLatencyMs": 85
  }
}
```

### RiskAlert

**Routing key**: `ai.risk.alert`

**Описание**: Публикуется при обнаружении высокого риска.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440004",
  "eventType": "ai.risk.alert",
  "timestamp": "2024-01-15T10:35:05Z",
  "version": "1.0",
  "correlationId": "req-124",
  "source": "ai-prediction-service",
  "wardId": "ward-456",
  "data": {
    "alertType": "high_fall_risk",
    "riskScore": 0.87,
    "confidence": 0.94,
    "priority": 8,
    "severity": "high",
    "recommendation": "Immediate monitoring recommended",
    "modelId": "fall-prediction-v2.1",
    "modelVersion": "2.1.0",
    "ttl": "2024-01-15T10:50:00Z"
  }
}
```

### HealthInsightGenerated

**Routing key**: `ai.insight.generated`

**Описание**: Публикуется при генерации инсайта о здоровье.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440005",
  "eventType": "ai.insight.generated",
  "timestamp": "2024-01-15T11:00:00Z",
  "version": "1.0",
  "correlationId": "req-126",
  "source": "ai-prediction-service",
  "wardId": "ward-456",
  "data": {
    "insightType": "trend",
    "title": "Повышение пульса в покое",
    "description": "За последние 3 дня отмечено повышение среднего пульса в покое на 15%",
    "severity": "warning",
    "dataSupport": {
      "baseline": 65,
      "current": 75,
      "trend": "increasing",
      "timeframe": "3 days"
    },
    "recommendations": [
      "Рекомендуется консультация с врачом",
      "Увеличить время отдыха"
    ],
    "expiresAt": "2024-01-22T11:00:00Z"
  }
}
```

### ModelTrained

**Routing key**: `ai.model.trained`

**Описание**: Публикуется после завершения обучения модели.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440006",
  "eventType": "ai.model.trained",
  "timestamp": "2024-01-15T12:00:00Z",
  "version": "1.0",
  "correlationId": "train-job-789",
  "source": "ai-prediction-service",
  "data": {
    "modelId": "fall-prediction-v2.2",
    "modelVersion": "2.2.0",
    "modelType": "fall_prediction",
    "trainingJobId": "job-123",
    "metrics": {
      "accuracy": 0.95,
      "precision": 0.93,
      "recall": 0.94,
      "f1Score": 0.935,
      "rocAuc": 0.97
    },
    "dataset": {
      "size": 50000,
      "dateRange": {
        "from": "2023-06-01",
        "to": "2024-01-01"
      }
    },
    "trainingDuration": 3600,
    "modelPath": "/models/fall-prediction/v2.2/model.pkl"
  }
}
```

### ModelDeployed

**Routing key**: `ai.model.deployed`

**Описание**: Публикуется после развертывания модели в production.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440007",
  "eventType": "ai.model.deployed",
  "timestamp": "2024-01-15T12:30:00Z",
  "version": "1.0",
  "correlationId": "deploy-job-790",
  "source": "ai-prediction-service",
  "data": {
    "modelId": "fall-prediction-v2.2",
    "modelVersion": "2.2.0",
    "previousVersion": "2.1.0",
    "deploymentType": "canary",
    "trafficPercentage": 10,
    "status": "active"
  }
}
```

## События Alert Service

### AlertCreated

**Routing key**: `alert.created`

**Описание**: Публикуется при создании нового оповещения.

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440008",
  "eventType": "alert.created",
  "timestamp": "2024-01-15T10:35:10Z",
  "version": "1.0",
  "correlationId": "req-124",
  "source": "alert-service",
  "wardId": "ward-456",
  "userId": "user-123",
  "data": {
    "alertId": "alert-999",
    "ruleId": "rule-456",
    "title": "Обнаружено падение",
    "description": "Высокая вероятность падения подопечного",
    "alertType": "fall_detection",
    "severity": "high",
    "status": "active",
    "aiConfidence": 0.94,
    "dataSnapshot": {
      "heartRate": 95,
      "impactForce": 8.5
    },
    "triggeredAt": "2024-01-15T10:35:00Z"
  }
}
```

### AlertResolved

**Routing key**: `alert.resolved`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440009",
  "eventType": "alert.resolved",
  "timestamp": "2024-01-15T10:45:00Z",
  "version": "1.0",
  "correlationId": "req-127",
  "source": "alert-service",
  "wardId": "ward-456",
  "data": {
    "alertId": "alert-999",
    "resolvedBy": "user-123",
    "resolutionNotes": "Ложное срабатывание, подопечный в порядке",
    "resolvedAt": "2024-01-15T10:45:00Z"
  }
}
```

## События Dispatcher Service

### EmergencyCallCreated

**Routing key**: `dispatcher.call.created`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440010",
  "eventType": "dispatcher.call.created",
  "timestamp": "2024-01-15T10:35:15Z",
  "version": "1.0",
  "correlationId": "req-124",
  "source": "dispatcher-service",
  "wardId": "ward-456",
  "data": {
    "callId": "call-555",
    "callType": "fall_detection",
    "priority": "high",
    "status": "created",
    "healthSnapshot": {
      "heartRate": 95,
      "spo2": 96,
      "temperature": 36.6
    },
    "locationSnapshot": {
      "latitude": 55.7558,
      "longitude": 37.6173,
      "address": "Москва, ул. Примерная, д. 1"
    },
    "aiAnalysis": {
      "riskScore": 0.87,
      "recommendedAction": "immediate_medical_attention"
    },
    "createdAt": "2024-01-15T10:35:15Z"
  }
}
```

### CallAssigned

**Routing key**: `dispatcher.call.assigned`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440011",
  "eventType": "dispatcher.call.assigned",
  "timestamp": "2024-01-15T10:36:00Z",
  "version": "1.0",
  "correlationId": "req-128",
  "source": "dispatcher-service",
  "data": {
    "callId": "call-555",
    "dispatcherId": "dispatcher-789",
    "assignedAt": "2024-01-15T10:36:00Z"
  }
}
```

## События Billing Service

### PaymentProcessed

**Routing key**: `billing.payment.processed`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440012",
  "eventType": "billing.payment.processed",
  "timestamp": "2024-01-15T14:00:00Z",
  "version": "1.0",
  "correlationId": "payment-456",
  "source": "billing-service",
  "userId": "user-123",
  "data": {
    "paymentId": "payment-789",
    "subscriptionId": "sub-123",
    "amount": 1990.00,
    "currency": "RUB",
    "status": "completed",
    "paymentMethod": "yookassa",
    "externalPaymentId": "yoo-123456",
    "paidAt": "2024-01-15T14:00:00Z"
  }
}
```

### SubscriptionExpired

**Routing key**: `billing.subscription.expired`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440013",
  "eventType": "billing.subscription.expired",
  "timestamp": "2024-01-15T00:00:00Z",
  "version": "1.0",
  "correlationId": "sub-exp-123",
  "source": "billing-service",
  "userId": "user-123",
  "data": {
    "subscriptionId": "sub-123",
    "planId": "plan-standard",
    "expiredAt": "2024-01-15T00:00:00Z",
    "gracePeriodEndsAt": "2024-01-18T00:00:00Z"
  }
}
```

## События Location Service

### LocationUpdated

**Routing key**: `location.updated`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440014",
  "eventType": "location.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0",
  "correlationId": "req-129",
  "source": "location-service",
  "wardId": "ward-456",
  "data": {
    "locationId": "loc-789",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "accuracy": 10.5,
    "altitude": 150.0,
    "speed": 0.0,
    "source": "gps",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### GeofenceBreached

**Routing key**: `location.geofence.breached`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440015",
  "eventType": "location.geofence.breached",
  "timestamp": "2024-01-15T10:40:00Z",
  "version": "1.0",
  "correlationId": "req-130",
  "source": "location-service",
  "wardId": "ward-456",
  "data": {
    "geofenceId": "geofence-123",
    "geofenceName": "Дом",
    "eventType": "exit",
    "location": {
      "latitude": 55.7600,
      "longitude": 37.6200
    },
    "timestamp": "2024-01-15T10:40:00Z"
  }
}
```

## События User Service

### WardCreated

**Routing key**: `user.ward.created`

**Payload**:
```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440016",
  "eventType": "user.ward.created",
  "timestamp": "2024-01-15T09:00:00Z",
  "version": "1.0",
  "correlationId": "req-131",
  "source": "user-service",
  "userId": "user-123",
  "wardId": "ward-456",
  "data": {
    "wardId": "ward-456",
    "fullName": "Иванов Иван Иванович",
    "dateOfBirth": "1945-05-15",
    "guardianId": "user-123",
    "createdAt": "2024-01-15T09:00:00Z"
  }
}
```

## Очереди и подписки

### Очереди для обработки событий

1. **telemetry-queue** - обработка телеметрии
   - Binding: `telemetry.data.received`
   - Consumers: AI Prediction Service, Analytics Service

2. **ai-predictions-queue** - AI предсказания
   - Binding: `ai.prediction.generated`, `ai.risk.alert`
   - Consumers: Alert Service

3. **alerts-queue** - оповещения
   - Binding: `alert.created`, `alert.resolved`
   - Consumers: Integration Service, Frontend (WebSocket)

4. **dispatcher-queue** - диспетчеризация
   - Binding: `dispatcher.call.created`, `dispatcher.call.assigned`
   - Consumers: Integration Service, Frontend (WebSocket)

5. **billing-queue** - биллинг
   - Binding: `billing.payment.processed`, `billing.subscription.expired`
   - Consumers: User Service, Integration Service

6. **location-queue** - геолокация
   - Binding: `location.updated`, `location.geofence.breached`
   - Consumers: Alert Service, Analytics Service

## Обработка ошибок

### Dead Letter Queue (DLQ)

Все события, которые не удалось обработать после 3 попыток, попадают в DLQ:

- **Exchange**: `care-monitoring.dlq`
- **Routing key**: `{original-routing-key}.failed`
- **TTL**: 7 дней

### Retry Policy

- **Max retries**: 3
- **Backoff**: exponential (1s, 2s, 4s)
- **Timeout**: 30 секунд на обработку

## Мониторинг событий

Метрики для Prometheus:
- `rabbitmq_messages_published_total` - количество опубликованных событий
- `rabbitmq_messages_consumed_total` - количество обработанных событий
- `rabbitmq_messages_failed_total` - количество неудачных обработок
- `rabbitmq_processing_duration_seconds` - время обработки события

