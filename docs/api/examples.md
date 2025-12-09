# Примеры API запросов и ответов

Документация с примерами использования всех основных API endpoints системы Care Monitoring.

## Аутентификация

### Регистрация пользователя

**Request**:
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "guardian@example.com",
  "password": "SecurePass123!",
  "fullName": "Иванов Иван Иванович",
  "phone": "+79991234567",
  "role": "guardian"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "guardian@example.com",
      "fullName": "Иванов Иван Иванович",
      "phone": "+79991234567",
      "role": "guardian",
      "emailVerified": false,
      "createdAt": "2024-01-15T09:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  },
  "message": "User registered successfully"
}
```

### Вход в систему

**Request**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "guardian@example.com",
  "password": "SecurePass123!",
  "deviceInfo": {
    "deviceId": "device-abc",
    "deviceType": "mobile",
    "os": "iOS 17.0"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "guardian@example.com",
      "fullName": "Иванов Иван Иванович",
      "role": "guardian"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 900
    }
  }
}
```

### Обновление токена

**Request**:
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900
  }
}
```

## Пользователи и подопечные

### Получение текущего пользователя

**Request**:
```http
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "guardian@example.com",
    "fullName": "Иванов Иван Иванович",
    "phone": "+79991234567",
    "role": "guardian",
    "status": "active",
    "emailVerified": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLoginAt": "2024-01-15T09:00:00Z"
  }
}
```

### Создание подопечного

**Request**:
```http
POST /api/v1/users/wards
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "email": "ward@example.com",
  "fullName": "Петров Петр Петрович",
  "dateOfBirth": "1945-05-15",
  "medicalConditions": {
    "allergies": ["Пенициллин", "Пыльца"],
    "chronicDiseases": ["Гипертония", "Диабет 2 типа"],
    "medications": ["Метформин 500мг", "Лизиноприл 10мг"]
  },
  "bloodType": "A+",
  "heightCm": 175,
  "weightKg": 80,
  "emergencyInstructions": "При потере сознания вызвать скорую немедленно"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "ward-456",
    "email": "ward@example.com",
    "fullName": "Петров Петр Петрович",
    "dateOfBirth": "1945-05-15",
    "medicalConditions": {
      "allergies": ["Пенициллин", "Пыльца"],
      "chronicDiseases": ["Гипертония", "Диабет 2 типа"],
      "medications": ["Метформин 500мг", "Лизиноприл 10мг"]
    },
    "bloodType": "A+",
    "heightCm": 175,
    "weightKg": 80,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  "message": "Ward created successfully"
}
```

### Получение списка подопечных

**Request**:
```http
GET /api/v1/users/wards?page=1&limit=10&search=Петров
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "ward-456",
      "fullName": "Петров Петр Петрович",
      "dateOfBirth": "1945-05-15",
      "status": "active",
      "lastSeenAt": "2024-01-15T10:30:00Z",
      "devicesCount": 1
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

## Устройства

### Регистрация устройства

**Request**:
```http
POST /api/v1/devices/register
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "deviceModelId": "model-bracelet-v2",
  "serialNumber": "BR-2024-001234",
  "macAddress": "AA:BB:CC:DD:EE:FF"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "device-789",
    "deviceModelId": "model-bracelet-v2",
    "serialNumber": "BR-2024-001234",
    "macAddress": "AA:BB:CC:DD:EE:FF",
    "status": "active",
    "firmwareVersion": "1.2.3",
    "createdAt": "2024-01-15T10:15:00Z"
  }
}
```

### Привязка устройства к подопечному

**Request**:
```http
POST /api/v1/devices/device-789/assign
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "wardId": "ward-456"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "deviceId": "device-789",
    "wardId": "ward-456",
    "assignedAt": "2024-01-15T10:20:00Z"
  },
  "message": "Device assigned successfully"
}
```

## Телеметрия

### Отправка данных телеметрии

**Request**:
```http
POST /api/v1/telemetry
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "deviceId": "device-789",
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
    },
    {
      "type": "spo2",
      "value": 98,
      "unit": "percent",
      "qualityScore": 0.92,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "location": {
    "latitude": 55.7558,
    "longitude": 37.6173,
    "accuracy": 10.5,
    "source": "gps"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "telemetryId": "tel-123",
    "deviceId": "device-789",
    "wardId": "ward-456",
    "metricsCount": 4,
    "processedAt": "2024-01-15T10:30:01Z"
  },
  "message": "Telemetry data saved successfully"
}
```

### Получение телеметрии подопечного

**Request**:
```http
GET /api/v1/telemetry/wards/ward-456?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&metricType=heart_rate&aggregation=hourly&page=1&limit=24
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2024-01-15T00:00:00Z",
      "metricType": "heart_rate",
      "value": 68,
      "unit": "bpm",
      "min": 65,
      "max": 72,
      "sampleCount": 12
    },
    {
      "timestamp": "2024-01-15T01:00:00Z",
      "metricType": "heart_rate",
      "value": 70,
      "unit": "bpm",
      "min": 67,
      "max": 74,
      "sampleCount": 12
    }
  ],
  "meta": {
    "page": 1,
    "limit": 24,
    "total": 24,
    "totalPages": 1
  }
}
```

### Получение последних показателей

**Request**:
```http
GET /api/v1/telemetry/wards/ward-456/latest
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "wardId": "ward-456",
    "timestamp": "2024-01-15T10:30:00Z",
    "metrics": {
      "heart_rate": {
        "value": 72,
        "unit": "bpm",
        "qualityScore": 0.95,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "steps": {
        "value": 1250,
        "unit": "count",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "spo2": {
        "value": 98,
        "unit": "percent",
        "qualityScore": 0.92,
        "timestamp": "2024-01-15T10:30:00Z"
      },
      "activity": {
        "value": 0.65,
        "unit": "normalized",
        "timestamp": "2024-01-15T10:30:00Z"
      }
    },
    "location": {
      "latitude": 55.7558,
      "longitude": 37.6173,
      "accuracy": 10.5,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

## AI Предсказания

### Получение предсказаний для подопечного

**Request**:
```http
GET /api/v1/ai-predictions/wards/ward-456/predictions?type=fall_prediction&from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&confidenceThreshold=0.7
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "pred-123",
      "predictionType": "fall_prediction",
      "modelId": "fall-prediction-v2.1",
      "modelVersion": "2.1.0",
      "riskScore": 0.15,
      "confidence": 0.92,
      "severity": "low",
      "timeHorizon": "15-30 minutes",
      "timestamp": "2024-01-15T10:30:05Z",
      "inputFeatures": {
        "heartRate": 72,
        "activity": 0.65,
        "steps": 1250
      }
    }
  ]
}
```

### Генерация предсказания (синхронный запрос)

**Request**:
```http
POST /api/v1/ai-predictions/wards/ward-456/predict
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "modelId": "fall-prediction-v2.1",
  "inputFeatures": {
    "heartRate": 95,
    "heartRateVariability": 45,
    "activity": 0.2,
    "steps": 50,
    "acceleration": {
      "x": 0.1,
      "y": 0.2,
      "z": -0.9
    },
    "timeOfDay": "morning",
    "previousActivity": "resting"
  }
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "predictionId": "pred-124",
    "predictionType": "fall_prediction",
    "modelId": "fall-prediction-v2.1",
    "modelVersion": "2.1.0",
    "output": {
      "riskScore": 0.87,
      "confidence": 0.94,
      "severity": "high",
      "timeHorizon": "15-30 minutes",
      "recommendation": "Immediate monitoring recommended"
    },
    "inferenceLatencyMs": 85,
    "timestamp": "2024-01-15T10:35:05Z"
  }
}
```

### Получение AI-инсайтов

**Request**:
```http
GET /api/v1/ai-predictions/wards/ward-456/insights?type=trend&severity=warning&acknowledged=false
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "insight-123",
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
      "generatedAt": "2024-01-15T11:00:00Z",
      "expiresAt": "2024-01-22T11:00:00Z",
      "acknowledged": false
    }
  ]
}
```

## Оповещения

### Получение списка оповещений

**Request**:
```http
GET /api/v1/alerts?wardId=ward-456&status=active&severity=high&from=2024-01-15T00:00:00Z&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "alert-999",
      "wardId": "ward-456",
      "title": "Обнаружено падение",
      "description": "Высокая вероятность падения подопечного",
      "alertType": "fall_detection",
      "severity": "high",
      "status": "active",
      "aiConfidence": 0.94,
      "triggeredAt": "2024-01-15T10:35:00Z",
      "dataSnapshot": {
        "heartRate": 95,
        "impactForce": 8.5
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

### Обновление статуса оповещения

**Request**:
```http
PATCH /api/v1/alerts/alert-999
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "status": "resolved",
  "notes": "Ложное срабатывание, подопечный в порядке"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "alert-999",
    "status": "resolved",
    "resolvedAt": "2024-01-15T10:45:00Z",
    "resolvedBy": "user-123"
  },
  "message": "Alert resolved successfully"
}
```

## Диспетчеризация

### Создание экстренного вызова

**Request**:
```http
POST /api/v1/dispatcher/calls
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "wardId": "ward-456",
  "callType": "fall_detection",
  "priority": "high",
  "healthSnapshot": {
    "heartRate": 95,
    "spo2": 96,
    "temperature": 36.6
  },
  "locationSnapshot": {
    "latitude": 55.7558,
    "longitude": 37.6173,
    "address": "Москва, ул. Примерная, д. 1"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "call-555",
    "wardId": "ward-456",
    "callType": "fall_detection",
    "priority": "high",
    "status": "created",
    "createdAt": "2024-01-15T10:35:15Z"
  },
  "message": "Emergency call created successfully"
}
```

### Получение списка вызовов

**Request**:
```http
GET /api/v1/dispatcher/calls?status=created&priority=high&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "call-555",
      "wardId": "ward-456",
      "wardName": "Петров Петр Петрович",
      "callType": "fall_detection",
      "priority": "high",
      "status": "created",
      "location": {
        "latitude": 55.7558,
        "longitude": 37.6173,
        "address": "Москва, ул. Примерная, д. 1"
      },
      "createdAt": "2024-01-15T10:35:15Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

## Биллинг

### Получение тарифных планов

**Request**:
```http
GET /api/v1/billing/plans?status=active
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "plan-basic",
      "name": "Базовый",
      "description": "Базовый мониторинг для одного подопечного",
      "priceMonthly": 990.00,
      "priceAnnual": 9900.00,
      "currency": "RUB",
      "features": {
        "maxWards": 1,
        "sosButton": true,
        "fallDetection": true,
        "aiAnalytics": false,
        "dispatcherService": false
      }
    },
    {
      "id": "plan-standard",
      "name": "Стандарт",
      "description": "Расширенный мониторинг для семьи",
      "priceMonthly": 1990.00,
      "priceAnnual": 19900.00,
      "currency": "RUB",
      "features": {
        "maxWards": 3,
        "sosButton": true,
        "fallDetection": true,
        "aiAnalytics": true,
        "dispatcherService": true
      }
    }
  ]
}
```

### Создание подписки

**Request**:
```http
POST /api/v1/billing/subscriptions
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "planId": "plan-standard",
  "paymentMethodId": "pm-yookassa-123"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub-123",
    "planId": "plan-standard",
    "status": "pending_payment",
    "currentPeriodStart": "2024-01-15T00:00:00Z",
    "currentPeriodEnd": "2024-02-15T00:00:00Z",
    "paymentUrl": "https://yookassa.ru/checkout/payments/..."
  },
  "message": "Subscription created, payment required"
}
```

## Ошибки

### Пример ошибки валидации

**Response** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/auth/register",
  "correlationId": "req-123",
  "errors": [
    {
      "field": "email",
      "message": "email must be an email"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ]
}
```

### Пример ошибки авторизации

**Response** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users/me",
  "correlationId": "req-124"
}
```

### Пример ошибки доступа

**Response** (403 Forbidden):
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/admin/users",
  "correlationId": "req-125"
}
```

### Пример ошибки не найдено

**Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Ward with ID ward-999 not found",
  "error": "Not Found",
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/v1/users/wards/ward-999",
  "correlationId": "req-126"
}
```

## WebSocket события

### Подключение

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // Подписка на события
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: [
      'telemetry:ward-456',
      'alerts:ward-456',
      'calls:dispatcher-789'
    ]
  }));
};
```

### Получение события

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'telemetry:update':
      console.log('Telemetry update:', data.payload);
      break;
    case 'alert:created':
      console.log('New alert:', data.payload);
      break;
    case 'call:updated':
      console.log('Call update:', data.payload);
      break;
  }
};
```

### Формат WebSocket сообщения

```json
{
  "type": "telemetry:update",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    "wardId": "ward-456",
    "metrics": {
      "heart_rate": 72,
      "steps": 1250
    }
  }
}
```

