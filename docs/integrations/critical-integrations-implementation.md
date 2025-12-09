# Реализация критических интеграций

**Дата**: 2024-01-15  
**Статус**: ✅ Завершено

## Обзор

Реализованы все критические интеграции из Этапа 1 roadmap:
- ✅ ЮKassa (платежная система)
- ✅ SMS.ru (SMS провайдер)
- ✅ SendGrid (Email провайдер)
- ✅ Firebase Cloud Messaging (Push уведомления)
- ✅ Retry механизм с exponential backoff
- ✅ Circuit Breaker pattern

## 1. ЮKassa (Платежная система)

### Реализация

**Файлы:**
- `microservices/billing-service/src/infrastructure/payment-providers/payment-provider.interface.ts`
- `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.adapter.ts`
- `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.webhook.controller.ts`
- `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.types.ts`

### Конфигурация

```env
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
YOOKASSA_TEST_MODE=true
FRONTEND_URL=http://localhost:5175
```

### API Endpoints

- `POST /api/v1/billing/payments` - Создание платежа
- `GET /api/v1/billing/payments/:id/status` - Статус платежа
- `POST /api/v1/billing/webhooks/yookassa` - Webhook от ЮKassa

### Использование

```typescript
// Создание платежа
const response = await billingService.processPayment(userId, {
  amount: 1990.00,
  currency: 'RUB',
  description: 'Подписка Care Monitoring',
  returnUrl: 'https://care-monitoring.ru/billing/success',
  subscriptionId: 'subscription-uuid',
});
```

### Особенности

- ✅ Retry механизм (3 попытки с exponential backoff)
- ✅ Circuit Breaker для отказоустойчивости
- ✅ Валидация webhook подписей
- ✅ Автоматическое создание invoice при успешном платеже

---

## 2. SMS.ru (SMS провайдер)

### Реализация

**Файлы:**
- `microservices/integration-service/src/infrastructure/services/sms/smsru.service.ts`

### Конфигурация

```env
SMSRU_API_KEY=your-smsru-api-key
```

### Использование

```typescript
await smsService.send({
  to: '+79001234567',
  message: 'Внимание! Обнаружено падение у Ивана Ивановича.',
});
```

### Особенности

- ✅ Rate limiting (100 SMS/минуту)
- ✅ Retry механизм (3 попытки)
- ✅ Circuit Breaker
- ✅ Проверка баланса

---

## 3. SendGrid (Email провайдер)

### Реализация

**Файлы:**
- `microservices/integration-service/src/infrastructure/services/email/sendgrid.service.ts`

### Конфигурация

```env
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@care-monitoring.ru
EMAIL_FROM_NAME=Care Monitoring
```

### Использование

```typescript
await emailService.send({
  to: 'guardian@example.com',
  subject: 'Уведомление о событии',
  html: '<html>...</html>',
  text: 'Текст сообщения',
});
```

### Особенности

- ✅ Rate limiting (100 emails/секунду)
- ✅ Retry механизм (3 попытки)
- ✅ Circuit Breaker
- ✅ Tracking открытий и кликов

---

## 4. Firebase Cloud Messaging (Push уведомления)

### Реализация

**Файлы:**
- `microservices/integration-service/src/infrastructure/services/push/fcm.service.ts`

### Конфигурация

```env
FCM_PROJECT_ID=care-monitoring
FCM_SERVICE_ACCOUNT_KEY=path/to/service-account.json
# или
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Использование

```typescript
await pushService.send({
  token: 'device-fcm-token',
  title: 'Обнаружено падение',
  body: 'Иван Иванович нуждается в помощи',
  data: {
    alertId: 'alert-uuid',
    wardId: 'ward-uuid',
    severity: 'critical',
  },
});
```

### Особенности

- ✅ OAuth 2.0 авторизация через Service Account
- ✅ Автоматическое обновление access token
- ✅ Поддержка Android и iOS
- ✅ Rate limiting (1000 сообщений/секунду)
- ✅ Retry механизм (3 попытки)
- ✅ Circuit Breaker

---

## 5. Retry механизм

### Реализация

**Файлы:**
- `shared/libs/retry.ts`

### Использование

```typescript
import { retryWithBackoff } from '../../../shared/libs/retry';

await retryWithBackoff(
  async () => {
    return await externalApi.call();
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  logger,
);
```

### Параметры

- `maxAttempts` - Максимальное количество попыток (по умолчанию: 3)
- `initialDelay` - Начальная задержка в мс (по умолчанию: 1000)
- `maxDelay` - Максимальная задержка в мс (по умолчанию: 30000)
- `backoffMultiplier` - Множитель для exponential backoff (по умолчанию: 2)
- `retryableErrors` - Функция для определения, можно ли повторить запрос

### Логика

- Retry на сетевые ошибки
- Retry на 5xx ошибки сервера
- Retry на 429 (rate limit)
- Exponential backoff между попытками

---

## 6. Circuit Breaker

### Реализация

**Файлы:**
- `shared/libs/circuit-breaker.ts`

### Использование

```typescript
import { CircuitBreaker } from '../../../shared/libs/circuit-breaker';

const circuitBreaker = new CircuitBreaker('service-name', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  resetTimeout: 300000, // 5 minutes
});

await circuitBreaker.execute(async () => {
  return await externalApi.call();
});
```

### Состояния

- **CLOSED** - Нормальная работа, запросы проходят
- **OPEN** - Сервис недоступен, запросы отклоняются сразу
- **HALF_OPEN** - Тестирование восстановления сервиса

### Параметры

- `failureThreshold` - Количество ошибок для открытия (по умолчанию: 5)
- `successThreshold` - Количество успешных запросов для закрытия (по умолчанию: 2)
- `timeout` - Время до перехода в HALF_OPEN (по умолчанию: 60000 мс)
- `resetTimeout` - Время до сброса счетчика ошибок (по умолчанию: 300000 мс)

---

## Интеграция всех компонентов

Все сервисы используют:
1. **Circuit Breaker** - для защиты от каскадных отказов
2. **Retry механизм** - для обработки временных ошибок
3. **Rate limiting** - для соблюдения лимитов API
4. **Логирование** - для мониторинга и отладки

### Пример полного потока

```typescript
// В сервисе интеграции
async sendNotification() {
  try {
    // Circuit Breaker защищает от каскадных отказов
    await this.circuitBreaker.execute(async () => {
      // Retry обрабатывает временные ошибки
      return await retryWithBackoff(
        async () => {
          // Rate limiting контролирует нагрузку
          this.checkRateLimit();
          // Вызов внешнего API
          return await this.externalApi.call();
        },
        { maxAttempts: 3, initialDelay: 1000 },
        this.logger,
      );
    });
  } catch (error) {
    // Обработка ошибок
    this.logger.error('Failed to send notification', { error });
  }
}
```

---

## Мониторинг

### Метрики Circuit Breaker

```typescript
const stats = circuitBreaker.getStats();
// {
//   name: 'sendgrid',
//   state: 'CLOSED',
//   failureCount: 0,
//   successCount: 0,
//   lastFailureTime: null
// }
```

### Логирование

Все интеграции логируют:
- Успешные запросы
- Ошибки с деталями
- Retry попытки
- Изменения состояния Circuit Breaker

---

## Тестирование

### Unit тесты

Каждый адаптер должен иметь unit тесты:
- Успешные запросы
- Обработка ошибок
- Retry логика
- Circuit Breaker состояния

### Integration тесты

Тесты с mock серверами:
- Проверка формата запросов
- Обработка ответов
- Webhook валидация

---

## Следующие шаги

1. ✅ Критические интеграции - **Завершено**
2. ⏳ Медицинские интеграции (СМП, ЕГИСЗ)
3. ⏳ Дополнительные провайдеры (Тинькофф, Twilio, Mailgun)
4. ⏳ Мониторинг и метрики
5. ⏳ Документация API

---

**Последнее обновление**: 2024-01-15



**Дата**: 2024-01-15  
**Статус**: ✅ Завершено

## Обзор

Реализованы все критические интеграции из Этапа 1 roadmap:
- ✅ ЮKassa (платежная система)
- ✅ SMS.ru (SMS провайдер)
- ✅ SendGrid (Email провайдер)
- ✅ Firebase Cloud Messaging (Push уведомления)
- ✅ Retry механизм с exponential backoff
- ✅ Circuit Breaker pattern

## 1. ЮKassa (Платежная система)

### Реализация

**Файлы:**
- `microservices/billing-service/src/infrastructure/payment-providers/payment-provider.interface.ts`
- `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.adapter.ts`
- `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.webhook.controller.ts`
- `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.types.ts`

### Конфигурация

```env
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
YOOKASSA_TEST_MODE=true
FRONTEND_URL=http://localhost:5175
```

### API Endpoints

- `POST /api/v1/billing/payments` - Создание платежа
- `GET /api/v1/billing/payments/:id/status` - Статус платежа
- `POST /api/v1/billing/webhooks/yookassa` - Webhook от ЮKassa

### Использование

```typescript
// Создание платежа
const response = await billingService.processPayment(userId, {
  amount: 1990.00,
  currency: 'RUB',
  description: 'Подписка Care Monitoring',
  returnUrl: 'https://care-monitoring.ru/billing/success',
  subscriptionId: 'subscription-uuid',
});
```

### Особенности

- ✅ Retry механизм (3 попытки с exponential backoff)
- ✅ Circuit Breaker для отказоустойчивости
- ✅ Валидация webhook подписей
- ✅ Автоматическое создание invoice при успешном платеже

---

## 2. SMS.ru (SMS провайдер)

### Реализация

**Файлы:**
- `microservices/integration-service/src/infrastructure/services/sms/smsru.service.ts`

### Конфигурация

```env
SMSRU_API_KEY=your-smsru-api-key
```

### Использование

```typescript
await smsService.send({
  to: '+79001234567',
  message: 'Внимание! Обнаружено падение у Ивана Ивановича.',
});
```

### Особенности

- ✅ Rate limiting (100 SMS/минуту)
- ✅ Retry механизм (3 попытки)
- ✅ Circuit Breaker
- ✅ Проверка баланса

---

## 3. SendGrid (Email провайдер)

### Реализация

**Файлы:**
- `microservices/integration-service/src/infrastructure/services/email/sendgrid.service.ts`

### Конфигурация

```env
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@care-monitoring.ru
EMAIL_FROM_NAME=Care Monitoring
```

### Использование

```typescript
await emailService.send({
  to: 'guardian@example.com',
  subject: 'Уведомление о событии',
  html: '<html>...</html>',
  text: 'Текст сообщения',
});
```

### Особенности

- ✅ Rate limiting (100 emails/секунду)
- ✅ Retry механизм (3 попытки)
- ✅ Circuit Breaker
- ✅ Tracking открытий и кликов

---

## 4. Firebase Cloud Messaging (Push уведомления)

### Реализация

**Файлы:**
- `microservices/integration-service/src/infrastructure/services/push/fcm.service.ts`

### Конфигурация

```env
FCM_PROJECT_ID=care-monitoring
FCM_SERVICE_ACCOUNT_KEY=path/to/service-account.json
# или
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### Использование

```typescript
await pushService.send({
  token: 'device-fcm-token',
  title: 'Обнаружено падение',
  body: 'Иван Иванович нуждается в помощи',
  data: {
    alertId: 'alert-uuid',
    wardId: 'ward-uuid',
    severity: 'critical',
  },
});
```

### Особенности

- ✅ OAuth 2.0 авторизация через Service Account
- ✅ Автоматическое обновление access token
- ✅ Поддержка Android и iOS
- ✅ Rate limiting (1000 сообщений/секунду)
- ✅ Retry механизм (3 попытки)
- ✅ Circuit Breaker

---

## 5. Retry механизм

### Реализация

**Файлы:**
- `shared/libs/retry.ts`

### Использование

```typescript
import { retryWithBackoff } from '../../../shared/libs/retry';

await retryWithBackoff(
  async () => {
    return await externalApi.call();
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  },
  logger,
);
```

### Параметры

- `maxAttempts` - Максимальное количество попыток (по умолчанию: 3)
- `initialDelay` - Начальная задержка в мс (по умолчанию: 1000)
- `maxDelay` - Максимальная задержка в мс (по умолчанию: 30000)
- `backoffMultiplier` - Множитель для exponential backoff (по умолчанию: 2)
- `retryableErrors` - Функция для определения, можно ли повторить запрос

### Логика

- Retry на сетевые ошибки
- Retry на 5xx ошибки сервера
- Retry на 429 (rate limit)
- Exponential backoff между попытками

---

## 6. Circuit Breaker

### Реализация

**Файлы:**
- `shared/libs/circuit-breaker.ts`

### Использование

```typescript
import { CircuitBreaker } from '../../../shared/libs/circuit-breaker';

const circuitBreaker = new CircuitBreaker('service-name', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000, // 1 minute
  resetTimeout: 300000, // 5 minutes
});

await circuitBreaker.execute(async () => {
  return await externalApi.call();
});
```

### Состояния

- **CLOSED** - Нормальная работа, запросы проходят
- **OPEN** - Сервис недоступен, запросы отклоняются сразу
- **HALF_OPEN** - Тестирование восстановления сервиса

### Параметры

- `failureThreshold` - Количество ошибок для открытия (по умолчанию: 5)
- `successThreshold` - Количество успешных запросов для закрытия (по умолчанию: 2)
- `timeout` - Время до перехода в HALF_OPEN (по умолчанию: 60000 мс)
- `resetTimeout` - Время до сброса счетчика ошибок (по умолчанию: 300000 мс)

---

## Интеграция всех компонентов

Все сервисы используют:
1. **Circuit Breaker** - для защиты от каскадных отказов
2. **Retry механизм** - для обработки временных ошибок
3. **Rate limiting** - для соблюдения лимитов API
4. **Логирование** - для мониторинга и отладки

### Пример полного потока

```typescript
// В сервисе интеграции
async sendNotification() {
  try {
    // Circuit Breaker защищает от каскадных отказов
    await this.circuitBreaker.execute(async () => {
      // Retry обрабатывает временные ошибки
      return await retryWithBackoff(
        async () => {
          // Rate limiting контролирует нагрузку
          this.checkRateLimit();
          // Вызов внешнего API
          return await this.externalApi.call();
        },
        { maxAttempts: 3, initialDelay: 1000 },
        this.logger,
      );
    });
  } catch (error) {
    // Обработка ошибок
    this.logger.error('Failed to send notification', { error });
  }
}
```

---

## Мониторинг

### Метрики Circuit Breaker

```typescript
const stats = circuitBreaker.getStats();
// {
//   name: 'sendgrid',
//   state: 'CLOSED',
//   failureCount: 0,
//   successCount: 0,
//   lastFailureTime: null
// }
```

### Логирование

Все интеграции логируют:
- Успешные запросы
- Ошибки с деталями
- Retry попытки
- Изменения состояния Circuit Breaker

---

## Тестирование

### Unit тесты

Каждый адаптер должен иметь unit тесты:
- Успешные запросы
- Обработка ошибок
- Retry логика
- Circuit Breaker состояния

### Integration тесты

Тесты с mock серверами:
- Проверка формата запросов
- Обработка ответов
- Webhook валидация

---

## Следующие шаги

1. ✅ Критические интеграции - **Завершено**
2. ⏳ Медицинские интеграции (СМП, ЕГИСЗ)
3. ⏳ Дополнительные провайдеры (Тинькофф, Twilio, Mailgun)
4. ⏳ Мониторинг и метрики
5. ⏳ Документация API

---

**Последнее обновление**: 2024-01-15







