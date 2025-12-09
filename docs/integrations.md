# Спецификация внешних интеграций

Документ описывает все интеграции системы Care Monitoring с внешними сервисами и системами.

## Платежные системы

### ЮKassa (YooKassa)

**Назначение**: Обработка платежей за подписки

**API Документация**: https://yookassa.ru/developers/api

**Endpoints**:
- Создание платежа: `POST https://api.yookassa.ru/v3/payments`
- Получение статуса: `GET https://api.yookassa.ru/v3/payments/{payment_id}`
- Webhook для уведомлений: `POST /api/v1/billing/webhooks/yookassa`

**Аутентификация**:
```typescript
{
  shopId: string;      // ID магазина
  secretKey: string;   // Секретный ключ
}
```

**Пример создания платежа**:
```typescript
POST https://api.yookassa.ru/v3/payments
Headers: {
  "Authorization": "Basic " + base64(shopId + ":" + secretKey),
  "Idempotence-Key": "unique-request-id"
}
Body: {
  amount: {
    value: "1990.00",
    currency: "RUB"
  },
  confirmation: {
    type: "redirect",
    return_url: "https://care-monitoring.ru/billing/success"
  },
  description: "Подписка Care Monitoring - Стандарт",
  metadata: {
    subscription_id: "subscription-uuid",
    guardian_id: "guardian-uuid"
  }
}
```

**Webhook payload**:
```typescript
{
  type: "notification",
  event: "payment.succeeded",
  object: {
    id: "payment-id",
    status: "succeeded",
    amount: {
      value: "1990.00",
      currency: "RUB"
    },
    metadata: {
      subscription_id: "subscription-uuid",
      guardian_id: "guardian-uuid"
    },
    created_at: "2024-01-15T10:00:00Z",
    paid: true
  }
}
```

**Валидация webhook**:
- Проверка подписи через `X-YooMoney-Signature`
- Формула: `HMAC-SHA256(payload, secretKey)`

### Тинькофф

**Назначение**: Альтернативный провайдер платежей

**API Документация**: https://www.tinkoff.ru/kassa/develop/api/

**Endpoints**:
- Создание платежа: `POST https://securepay.tinkoff.ru/v2/Init`
- Подтверждение: `POST https://securepay.tinkoff.ru/v2/Confirm`
- Webhook: `POST /api/v1/billing/webhooks/tinkoff`

**Аутентификация**:
```typescript
{
  terminalKey: string;
  password: string;
}
```

**Пример создания платежа**:
```typescript
POST https://securepay.tinkoff.ru/v2/Init
Body: {
  TerminalKey: "terminal-key",
  Amount: 199000,  // в копейках
  OrderId: "order-uuid",
  Description: "Подписка Care Monitoring",
  SuccessURL: "https://care-monitoring.ru/billing/success",
  FailURL: "https://care-monitoring.ru/billing/fail",
  DATA: {
    SubscriptionId: "subscription-uuid",
    GuardianId: "guardian-uuid"
  }
}
```

## SMS провайдеры

### SMS.ru

**Назначение**: Отправка SMS уведомлений

**API**: `https://sms.ru/sms/send`

**Аутентификация**: API ключ

**Пример запроса**:
```typescript
POST https://sms.ru/sms/send
Body: {
  api_id: "api-key",
  to: "+79001234567",
  msg: "Внимание! Обнаружено падение у Ивана Ивановича. Местоположение: Москва, ул. Примерная, д. 1",
  json: 1
}
```

**Ответ**:
```typescript
{
  status: "OK",
  status_code: 100,
  sms: {
    "+79001234567": {
      status: "OK",
      status_code: 100,
      sms_id: "sms-id"
    }
  }
}
```

### Twilio (резервный)

**Назначение**: Международные SMS

**API**: `https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json`

**Аутентификация**: Basic Auth (AccountSid:AuthToken)

## Email провайдеры

### SendGrid

**Назначение**: Отправка email уведомлений

**API**: `https://api.sendgrid.com/v3/mail/send`

**Аутентификация**: Bearer token

**Пример запроса**:
```typescript
POST https://api.sendgrid.com/v3/mail/send
Headers: {
  "Authorization": "Bearer API_KEY"
}
Body: {
  personalizations: [{
    to: [{ email: "guardian@example.com" }],
    subject: "Уведомление о событии"
  }],
  from: { email: "noreply@care-monitoring.ru" },
  content: [{
    type: "text/html",
    value: "<html>...</html>"
  }]
}
```

### Mailgun (резервный)

**API**: `https://api.mailgun.net/v3/{domain}/messages`

**Аутентификация**: Basic Auth

## Push уведомления

### Firebase Cloud Messaging (FCM)

**Назначение**: Push уведомления для мобильных приложений

**API**: `https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`

**Аутентификация**: OAuth 2.0 (Service Account)

**Пример запроса**:
```typescript
POST https://fcm.googleapis.com/v1/projects/care-monitoring/messages:send
Headers: {
  "Authorization": "Bearer ACCESS_TOKEN"
}
Body: {
  message: {
    token: "device-fcm-token",
    notification: {
      title: "Обнаружено падение",
      body: "Иван Иванович нуждается в помощи"
    },
    data: {
      alertId: "alert-uuid",
      wardId: "ward-uuid",
      severity: "critical",
      type: "fall_detection"
    },
    android: {
      priority: "high",
      notification: {
        sound: "default",
        channelId: "emergency_alerts"
      }
    },
    apns: {
      headers: {
        "apns-priority": "10"
      },
      payload: {
        aps: {
          sound: "default",
          badge: 1
        }
      }
    }
  }
}
```

## Telegram Bot

**Назначение**: Уведомления через Telegram

**API**: `https://api.telegram.org/bot{token}/sendMessage`

**Пример запроса**:
```typescript
POST https://api.telegram.org/bot{token}/sendMessage
Body: {
  chat_id: "telegram-chat-id",
  text: "🚨 Внимание! Обнаружено падение у Ивана Ивановича.\n📍 Местоположение: Москва, ул. Примерная, д. 1\n⏰ Время: 15.01.2024 10:35",
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [[
      { text: "Позвонить", callback_data: "call_ward" },
      { text: "Вызвать диспетчера", callback_data: "call_dispatcher" }
    ]]
  }
}
```

## Системы скорой медицинской помощи (СМП)

### Интеграция через API (если доступно)

**Endpoint**: Зависит от конкретной системы СМП

**Формат данных для передачи**:
```typescript
{
  callType: "emergency",
  patient: {
    fullName: "Иванов Иван Иванович",
    dateOfBirth: "1945-05-15",
    gender: "male",
    address: "Москва, ул. Примерная, д. 1, кв. 5",
    phone: "+79001234567"
  },
  location: {
    latitude: 55.7558,
    longitude: 37.6173,
    address: "Москва, ул. Примерная, д. 1",
    accuracy: 10
  },
  medicalInfo: {
    allergies: ["пенициллин"],
    chronicDiseases: ["гипертония"],
    medications: ["лизиноприл"],
    bloodType: "A+"
  },
  currentCondition: {
    heartRate: 95,
    spo2: 96,
    consciousness: "conscious",
    complaints: "Головокружение после падения"
  },
  incidentDetails: {
    type: "fall",
    time: "2024-01-15T10:35:00Z",
    description: "Падение обнаружено системой мониторинга"
  },
  caller: {
    type: "system",
    systemName: "Care Monitoring",
    contactPhone: "+78001234567"
  }
}
```

### Интеграция через телефонный звонок (fallback)

Если API недоступно, система:
1. Формирует голосовое сообщение с данными
2. Инициирует автоматический звонок через телефонию
3. Воспроизводит сообщение диспетчеру СМП

## Устройства (Bluetooth)

### Протокол взаимодействия

**Стандарт**: Bluetooth Low Energy (BLE)

**Сервисы и характеристики**:

#### Health Service (UUID: 0x180D)
- Heart Rate (0x2A37): Чтение пульса
- Heart Rate Control Point (0x2A39): Управление

#### Device Information Service (UUID: 0x180A)
- Manufacturer Name (0x2A29)
- Model Number (0x2A24)
- Serial Number (0x2A25)
- Firmware Revision (0x2A26)

#### Custom Service (UUID: генерируется производителем)
- Accelerometer Data (0xFF01): Данные акселерометра
- SpO2 Data (0xFF02): Кислород в крови
- Temperature (0xFF03): Температура
- Battery Level (0xFF04): Уровень батареи
- SOS Button (0xFF05): Событие нажатия SOS
- Fall Detection (0xFF06): Событие падения

**Формат данных акселерометра**:
```typescript
{
  x: number;      // -32768 to 32767 (scaled to ±2g)
  y: number;
  z: number;
  timestamp: number;  // milliseconds since device start
}
```

**Формат данных SpO2**:
```typescript
{
  spo2: number;   // 0-100 (%)
  pulseRate: number;  // bpm
  quality: number;    // 0-100 (signal quality)
  timestamp: number;
}
```

**Процесс подключения**:
1. Сканирование устройств по MAC-адресу или имени
2. Подключение к устройству
3. Обнаружение сервисов и характеристик
4. Подписка на уведомления (notifications)
5. Периодическое чтение данных (если notifications недоступны)

**Обработка ошибок**:
- Автоматическое переподключение при разрыве связи
- Буферизация данных при отсутствии связи
- Валидация данных перед отправкой на сервер

## Геокодирование

### Yandex Geocoder API

**Назначение**: Преобразование координат в адреса

**API**: `https://geocode-maps.yandex.ru/1.x/`

**Пример запроса**:
```typescript
GET https://geocode-maps.yandex.ru/1.x/?apikey=API_KEY&geocode=55.7558,37.6173&format=json
```

**Ответ**:
```typescript
{
  response: {
    GeoObjectCollection: {
      featureMember: [{
        GeoObject: {
          metaDataProperty: {
            GeocoderMetaData: {
              text: "Россия, Москва, Красная площадь, 1",
              kind: "house",
              precision: "exact"
            }
          }
        }
      }]
    }
  }
}
```

### Google Geocoding API (резервный)

**API**: `https://maps.googleapis.com/maps/api/geocode/json`

## Мониторинг и логирование

### Sentry (ошибки)

**Назначение**: Отслеживание ошибок в production

**DSN**: Настраивается через переменные окружения

**Интеграция**: Автоматическая через SDK

### DataDog / New Relic (APM)

**Назначение**: Мониторинг производительности

**API**: Зависит от провайдера

## Webhook'и для внешних систем

### Формат webhook'а

Все исходящие webhook'и имеют единый формат:

```typescript
POST {external-system-url}/webhook
Headers: {
  "X-Care-Monitoring-Signature": "HMAC-SHA256(payload, secret)",
  "X-Care-Monitoring-Event": "event-type",
  "X-Care-Monitoring-Timestamp": "2024-01-15T10:30:00Z"
}
Body: {
  eventId: "event-uuid",
  eventType: "AlertCreated",
  timestamp: "2024-01-15T10:30:00Z",
  data: {
    // Event-specific data
  }
}
```

**Валидация подписи**:
```typescript
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(JSON.stringify(payload))
  .digest('hex');
```

## Rate Limiting

Все внешние API имеют ограничения:

- **ЮKassa**: 100 запросов/секунду
- **SMS.ru**: 100 SMS/минуту
- **SendGrid**: 100 email/секунду
- **FCM**: 1000 сообщений/секунду
- **Telegram**: 30 сообщений/секунду

Реализовать через:
- Очереди с throttling
- Retry с exponential backoff
- Circuit breaker pattern

## Безопасность

- Все API ключи хранятся в Secrets Manager (Kubernetes Secrets / AWS Secrets Manager)
- Webhook'и валидируются через HMAC подписи
- HTTPS для всех внешних запросов
- IP whitelist для критичных интеграций (если поддерживается)
- Логирование всех внешних запросов (без чувствительных данных)

