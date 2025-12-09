# Документация по Webhook'ам и внешним интеграциям

## Общие принципы

Все webhook'и используют:
- **HTTPS** для безопасности
- **Signature verification** для проверки подлинности
- **Idempotency keys** для предотвращения дублирования
- **Retry mechanism** с exponential backoff

## Входящие Webhook'и

### Платежные системы

#### ЮKassa Webhook

**Endpoint**: `POST /api/v1/integrations/webhooks/yookassa`

**Headers**:
```
X-YooMoney-Signature: <signature>
Content-Type: application/json
```

**Signature verification**:
```typescript
import crypto from 'crypto';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  return hash === signature;
}
```

**Payload пример**:
```json
{
  "type": "payment.succeeded",
  "event": "2024-01-15T14:00:00.000Z",
  "object": {
    "id": "2c5d8b3e-1234-5678-9abc-def012345678",
    "status": "succeeded",
    "amount": {
      "value": "1990.00",
      "currency": "RUB"
    },
    "created_at": "2024-01-15T14:00:00.000Z",
    "description": "Подписка Care Monitoring",
    "metadata": {
      "subscriptionId": "sub-123",
      "userId": "user-123"
    },
    "payment_method": {
      "type": "bank_card",
      "card": {
        "last4": "4242",
        "expiry_month": "12",
        "expiry_year": "2025"
      }
    }
  }
}
```

**Обработка**:
1. Проверка подписи
2. Извлечение `subscriptionId` из metadata
3. Обновление статуса подписки в Billing Service
4. Публикация события `PaymentProcessed`

#### Тинькофф Webhook

**Endpoint**: `POST /api/v1/integrations/webhooks/tinkoff`

**Headers**:
```
X-Api-Signature: <signature>
Content-Type: application/json
```

**Payload пример**:
```json
{
  "TerminalKey": "1234567890",
  "OrderId": "order-123",
  "Success": true,
  "Status": "CONFIRMED",
  "PaymentId": "tinkoff-456",
  "Amount": 199000,
  "CardId": "card-789",
  "Pan": "4242****4242",
  "ExpDate": "12/25"
}
```

### Системы СМП (Скорая Медицинская Помощь)

#### СМП Status Webhook

**Endpoint**: `POST /api/v1/integrations/webhooks/smp-status`

**Headers**:
```
X-Webhook-Signature: <signature>
X-Webhook-Provider: smp-moscow
Content-Type: application/json
```

**Payload пример**:
```json
{
  "callId": "smp-call-123",
  "status": "ambulance_dispatched",
  "ambulanceId": "amb-456",
  "estimatedArrival": "2024-01-15T10:45:00Z",
  "currentLocation": {
    "latitude": 55.7500,
    "longitude": 37.6000
  },
  "notes": "Бригада выехала, ETA 15 минут",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Статусы**:
- `call_received` - вызов принят
- `ambulance_dispatched` - бригада направлена
- `ambulance_on_way` - бригада в пути
- `ambulance_arrived` - бригада на месте
- `treatment_in_progress` - оказание помощи
- `call_completed` - вызов завершен
- `call_cancelled` - вызов отменен

## Исходящие Webhook'и

### Уведомления опекунам

#### Telegram Bot Webhook

**Provider**: Telegram Bot API

**Использование**:
```typescript
interface TelegramNotification {
  chatId: string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
  replyMarkup?: {
    inline_keyboard: Array<Array<{
      text: string;
      callback_data: string;
    }>>;
  };
}
```

**Пример отправки**:
```json
{
  "chatId": "123456789",
  "message": "⚠️ <b>Обнаружено падение</b>\n\nПодопечный: Иванов И.И.\nВремя: 15.01.2024 10:35\nМестоположение: Москва, ул. Примерная, д. 1",
  "parseMode": "HTML",
  "replyMarkup": {
    "inline_keyboard": [
      [
        {
          "text": "Позвонить",
          "callback_data": "call_ward_456"
        },
        {
          "text": "Подробнее",
          "callback_data": "alert_details_999"
        }
      ]
    ]
  }
}
```

### SMS провайдеры

#### SMS.ru Integration

**API Endpoint**: `https://sms.ru/sms/send`

**Request**:
```typescript
interface SMSRequest {
  api_id: string;
  to: string;  // номер телефона
  msg: string; // сообщение
  json: 1;
}
```

**Response**:
```json
{
  "status": "OK",
  "status_code": 100,
  "sms": {
    "79991234567": {
      "status": "OK",
      "status_code": 100,
      "sms_id": "sms-123"
    }
  }
}
```

#### Twilio Integration (для международных номеров)

**API Endpoint**: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`

**Request**:
```typescript
interface TwilioSMSRequest {
  From: string;  // Twilio номер
  To: string;    // получатель
  Body: string;  // сообщение
}
```

### Email провайдеры

#### SendGrid Integration

**API Endpoint**: `https://api.sendgrid.com/v3/mail/send`

**Request**:
```json
{
  "personalizations": [
    {
      "to": [
        {
          "email": "guardian@example.com",
          "name": "Иван Иванов"
        }
      ],
      "subject": "Обнаружено падение подопечного"
    }
  ],
  "from": {
    "email": "alerts@caremonitoring.ru",
    "name": "Care Monitoring"
  },
  "content": [
    {
      "type": "text/html",
      "value": "<html><body><h2>Обнаружено падение</h2><p>Подопечный: Иванов И.И.</p></body></html>"
    }
  ],
  "template_id": "d-1234567890abcdef"
  }
}
```

## Интеграция с устройствами

### Bluetooth Low Energy (BLE) протокол

#### Характеристики устройства

**Service UUID**: `0000180d-0000-1000-8000-00805f9b34fb` (Heart Rate Service)

**Characteristics**:
- `00002a37-0000-1000-8000-00805f9b34fb` - Heart Rate Measurement
- `00002a38-0000-1000-8000-00805f9b34fb` - Body Sensor Location
- `00002a39-0000-1000-8000-00805f9b34fb` - Heart Rate Control Point

**Формат данных Heart Rate**:
```
Byte 0: Flags (bit 0 = Heart Rate Value Format, bit 1 = Sensor Contact Status)
Byte 1-2: Heart Rate Value (uint16 if flag bit 0 = 1, else uint8)
Byte 3+: Optional fields based on flags
```

**Пример парсинга**:
```typescript
interface HeartRateData {
  heartRate: number;
  sensorContact: boolean;
  energyExpended?: number;
  rrIntervals?: number[];
}

function parseHeartRate(buffer: Buffer): HeartRateData {
  const flags = buffer[0];
  const format16Bit = (flags & 0x01) !== 0;
  const sensorContact = (flags & 0x02) !== 0;
  
  let heartRate: number;
  let offset = 1;
  
  if (format16Bit) {
    heartRate = buffer.readUInt16LE(offset);
    offset += 2;
  } else {
    heartRate = buffer[offset];
    offset += 1;
  }
  
  // Optional fields parsing...
  
  return { heartRate, sensorContact };
}
```

#### Акселерометр данные

**Service UUID**: `0000181a-0000-1000-8000-00805f9b34fb` (Environmental Sensing)

**Формат**:
```
Byte 0-1: X-axis (int16, scaled by 0.01g)
Byte 2-3: Y-axis (int16, scaled by 0.01g)
Byte 4-5: Z-axis (int16, scaled by 0.01g)
```

**Детекция падения**:
```typescript
interface AccelerometerData {
  x: number;  // в g
  y: number;  // в g
  z: number;  // в g
  timestamp: number;
}

function detectFall(accelData: AccelerometerData[]): boolean {
  // Проверка резкого изменения ускорения
  const magnitude = Math.sqrt(
    accelData[0].x ** 2 + 
    accelData[0].y ** 2 + 
    accelData[0].z ** 2
  );
  
  // Порог падения: > 2.5g
  return magnitude > 2.5;
}
```

### LoRaWAN протокол (для удаленных устройств)

**Payload формат**:
```typescript
interface LoRaWANPayload {
  deviceId: string;
  timestamp: number;
  batteryLevel: number;
  metrics: {
    heartRate?: number;
    temperature?: number;
    activity?: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}
```

**Декодирование**:
```typescript
function decodeLoRaWANPayload(payload: Buffer): LoRaWANPayload {
  // Custom decoding logic based on device manufacturer
  // Example: first 8 bytes = deviceId, next 4 = timestamp, etc.
}
```

## Интеграция с медицинскими системами

### ЕГИСЗ (Единая Государственная Информационная Система в сфере Здравоохранения)

**API Endpoint**: `https://egisz.rosminzdrav.ru/api/v1/`

**Аутентификация**: OAuth 2.0

**Отправка данных о вызове**:
```json
{
  "patient": {
    "snils": "123-456-789 01",
    "lastName": "Иванов",
    "firstName": "Иван",
    "middleName": "Иванович",
    "birthDate": "1945-05-15"
  },
  "call": {
    "callType": "emergency",
    "reason": "fall_detection",
    "timestamp": "2024-01-15T10:35:00Z",
    "location": {
      "address": "Москва, ул. Примерная, д. 1",
      "coordinates": {
        "latitude": 55.7558,
        "longitude": 37.6173
      }
    },
    "vitalSigns": {
      "heartRate": 95,
      "spo2": 96,
      "temperature": 36.6
    }
  }
}
```

## Rate Limiting

Все внешние API имеют rate limits:

- **SMS**: 100 сообщений/час на номер
- **Email**: 1000 писем/день
- **Telegram**: 30 сообщений/секунду
- **Webhook retries**: максимум 3 попытки с exponential backoff

## Мониторинг интеграций

Метрики для каждой интеграции:
- `integration_requests_total{provider, status}` - количество запросов
- `integration_request_duration_seconds{provider}` - время выполнения
- `integration_errors_total{provider, error_type}` - количество ошибок
- `integration_webhook_received_total{provider}` - полученные webhook'и

