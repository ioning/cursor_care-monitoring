# Отчет о заглушках и моках внешних сервисов

## 📋 Сводка

Данный документ содержит полный список всех заглушек (mocks/stubs) для внешних сервисов, используемых в проекте Care Monitoring System.

---

## 🔴 Критические заглушки (требуют замены на реальные интеграции)

### 1. Integration Service - Получение опекунов

**Файл:** `microservices/integration-service/src/application/services/integration.service.ts`

**Проблема:** Метод `getGuardiansForWard()` возвращает жестко закодированные mock-данные вместо запроса к `user-service`.

```typescript
// Строки 146-164
private async getGuardiansForWard(wardId: string): Promise<any[]> {
  // In real implementation, this would query user-service
  // For MVP, return mock data
  return [
    {
      id: 'guardian-1',
      email: 'guardian@example.com',
      phone: '+79991234567',
      pushToken: 'push-token-123',
      telegramChatId: '123456789',
      preferences: {
        email: true,
        sms: true,
        push: true,
        telegram: false,
      },
    },
  ];
}
```

**Примечание:** ✅ Endpoint существует в `user-service`: `GET /family/wards/:wardId/members` (см. `microservices/user-service/src/infrastructure/controllers/family-access.controller.ts`, строка 35-40).

**Статус:** 🔴 **Требуется реализация** - добавить HTTP клиент и вызывать существующий endpoint `user-service`.

---

### 2. Telemetry Service - Получение Ward ID

**Файл:** `microservices/telemetry-service/src/infrastructure/repositories/telemetry.repository.ts`

**Проблема:** Метод `getWardIdByDeviceId()` всегда возвращает `'ward-placeholder'` вместо запроса к `device-service`.

```typescript
// Строки 105-109
async getWardIdByDeviceId(deviceId: string): Promise<string | null> {
  // In real implementation, this would query device_service
  // For MVP, return a placeholder
  return 'ward-placeholder';
}
```

**Примечание:** В `device-service` есть методы для работы с устройствами (`DeviceService.getDevice()`, `DeviceRepository`), но нет прямого endpoint для получения `wardId` по `deviceId`. Возможные варианты:
- Добавить endpoint `GET /devices/:deviceId` и извлекать `wardId` из ответа
- Использовать общую БД для прямого запроса связи device → ward
- Добавить специальный endpoint `GET /devices/:deviceId/ward`

**Статус:** 🔴 **Требуется реализация** - HTTP вызов к `device-service` или прямой SQL запрос к БД для получения связи device → ward.

---

### 3. Analytics Service - Отчеты и статистика

**Файл:** `microservices/analytics-service/src/application/services/analytics.service.ts`

**Проблема:** Методы возвращают пустые/нулевые данные с комментариями о будущей реализации.

```typescript
// Строка 53
// In real implementation, would aggregate data from telemetry, alerts, etc.
const report = {
  wardId,
  period,
  summary: {
    totalAlerts: 0,  // Заглушка
    criticalAlerts: 0,  // Заглушка
    averageHeartRate: 0,  // Заглушка
    averageActivity: 0,  // Заглушка
    healthScore: 85,  // Фиксированное значение
  },
  // ...
};

// Строка 82
// In real implementation, would aggregate system-wide statistics
const stats = {
  totalUsers: 0,  // Заглушка
  // ...
};
```

**Статус:** 🟡 **Частично заглушено** - требуется агрегация данных из `telemetry-service`, `alert-service`, `user-service`.

---

### 4. Location Service - Публикация событий

**Файл:** `microservices/location-service/src/application/services/location.service.ts`

**Проблема:** Комментарий о публикации событий через RabbitMQ.

```typescript
// Строка 51
// In real implementation, would publish event
```

**Статус:** 🟡 **Требуется проверка** - возможно событие не публикуется.

---

### 5. Alert Service - Проверка доступа

**Файл:** `microservices/alert-service/src/application/services/alert.service.ts`

**Проблема:** Упрощенная проверка доступа без реальной валидации связи guardian-ward.

```typescript
// Строки 92-93
// Verify user has access (should check guardian-ward relationship)
// For MVP, simplified check
```

**Статус:** 🟡 **Упрощенная реализация** - требуется проверка через `user-service`.

---

### 6. AI Prediction Service - Эвристическая модель

**Файл:** `microservices/ai-prediction-service/src/infrastructure/ml-models/fall-prediction.model.ts`

**Проблема:** Модель предсказания падений использует эвристический алгоритм вместо обученной ML модели.

```typescript
// Строка 39
// In production, this would be replaced with a trained ML model
async predict(features: Record<string, any>): Promise<FallPrediction> {
  // Enhanced heuristic-based model with weighted factors
  // ...
}
```

**Статус:** 🟢 **Нормально для MVP** - эвристический алгоритм работает, но для production рекомендуется обучить реальную ML модель (TensorFlow/PyTorch).

**Примечание:** Модель использует взвешенные факторы (активность, пульс, ускорение и т.д.) для расчета риска. Это допустимо для начальной версии.

---

## 🟡 Условные заглушки (работают в development режиме)

### 1. SendGrid Email Service

**Файл:** `microservices/integration-service/src/infrastructure/services/email/sendgrid.service.ts`

**Поведение:** Если `SENDGRID_API_KEY` не настроен:
- В **development** режиме: логирует "Email would be sent" и **пропускает отправку**
- В **production** режиме: выбрасывает ошибку

```typescript
// Строки 63-72
if (!this.apiKey) {
  this.logger.warn('SendGrid API key not configured, skipping email send');
  if (process.env.NODE_ENV === 'development') {
    this.logger.info('Email would be sent', {
      to: message.to,
      subject: message.subject,
    });
    return;  // Пропускает отправку в development
  }
  throw new Error('SendGrid API key not configured');
}
```

**Статус:** ✅ **Корректно** - защита от случайных отправок в development.

---

### 2. SMS.ru Service

**Файл:** `microservices/integration-service/src/infrastructure/services/sms/smsru.service.ts`

**Поведение:** Аналогично SendGrid - пропускает отправку в development при отсутствии API ключа.

```typescript
// Строки 56-65
if (!this.apiKey) {
  this.logger.warn('SMS.ru API key not configured, skipping SMS send');
  if (process.env.NODE_ENV === 'development') {
    this.logger.info('SMS would be sent', {
      to: message.to,
      message: message.message.substring(0, 50) + '...',
    });
    return;  // Пропускает отправку в development
  }
  throw new Error('SMS.ru API key not configured');
}
```

**Статус:** ✅ **Корректно** - защита от случайных отправок в development.

---

### 3. Firebase Cloud Messaging (FCM)

**Файл:** `microservices/integration-service/src/infrastructure/services/push/fcm.service.ts`

**Поведение:** Пропускает отправку push-уведомлений в development при отсутствии конфигурации.

```typescript
// Строки 101-110
if (!this.projectId || !this.serviceAccountKey) {
  this.logger.warn('FCM not configured, skipping push notification');
  if (process.env.NODE_ENV === 'development') {
    this.logger.info('Push notification would be sent', {
      token: message.token.substring(0, 20) + '...',
      title: message.title,
    });
    return;  // Пропускает отправку в development
  }
  throw new Error('FCM not configured');
}
```

**Статус:** ✅ **Корректно** - защита от случайных отправок в development.

---

### 4. Telegram Bot Service

**Файл:** `microservices/integration-service/src/infrastructure/services/telegram.service.ts`

**Поведение:** Пропускает отправку сообщений в development или при отсутствии токена.

```typescript
// Строки 18-25
// In development or if no bot token, just log
if (process.env.NODE_ENV === 'development' || !this.botToken) {
  this.logger.info('Telegram message would be sent', {
    chatId: message.chatId,
    message: message.message.substring(0, 50) + '...',
  });
  return;  // Пропускает отправку
}
```

**Статус:** ✅ **Корректно** - защита от случайных отправок в development.

---

## 🟢 Frontend моки (контролируемые через env переменную)

### Admin App - Все API методы

**Файлы:**
- `frontend/apps/admin-app/src/api/system.api.ts`
- `frontend/apps/admin-app/src/api/users.api.ts`
- `frontend/apps/admin-app/src/api/billing.api.ts`
- `frontend/apps/admin-app/src/api/analytics.api.ts`
- `frontend/apps/admin-app/src/api/incidents.api.ts`
- `frontend/apps/admin-app/src/api/settings.api.ts`
- `frontend/apps/admin-app/src/api/ai-models.api.ts`

**Поведение:** Все методы проверяют `VITE_USE_MOCKS` и возвращают mock-данные вместо реальных API вызовов.

**Пример:**
```typescript
const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export const fetchSystemHealth = async (): Promise<SystemHealthResponse> => {
  if (useMocks) {
    return Promise.resolve(structuredClone(mockHealth));  // Mock данные
  }
  const { data } = await apiClient.get<{ data: SystemHealthResponse }>('/system/health');
  return data.data;
};
```

**Статус:** ✅ **Корректно** - позволяет работать frontend без backend для разработки UI.

**Управление:** Установить `VITE_USE_MOCKS=true` в `.env` для использования моков.

---

## 💳 Платежные системы

### YooKassa Payment Provider

**Файл:** `microservices/billing-service/src/infrastructure/payment-providers/yookassa/yookassa.adapter.ts`

**Статус:** ✅ **Реализовано полностью** - нет заглушек.

**Особенности:**
- Поддерживает тестовый режим через `YOOKASSA_TEST_MODE=true`
- Использует реальный API YooKassa (тестовый или продакшн)
- В тестовом режиме использует тестовые данные YooKassa

**Примечание:** В `env.example` указаны демо-данные:
```env
YOOKASSA_SHOP_ID=demo-shop
YOOKASSA_SECRET_KEY=demo-secret
YOOKASSA_TEST_MODE=true
```

**Рекомендация:** Заменить на реальные тестовые credentials для разработки.

---

## 📧 Email Service (auth-service)

### SMTP для верификации email

**Файл:** `microservices/auth-service/src/infrastructure/services/email.service.ts`

**Статус:** ✅ **Реализовано полностью** - используется nodemailer с SMTP (Yandex).

**Конфигурация:**
```env
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=465
SMTP_USER=ioning@yandex.ru
SMTP_PASSWORD=your-yandex-password
```

**Примечание:** ✅ Реализовано без заглушек, но требует реального пароля от почты.

---

## 📊 Итоговая таблица

| Сервис/Компонент | Тип заглушки | Статус | Приоритет |
|-----------------|--------------|--------|-----------|
| `integration-service.getGuardiansForWard()` | Hardcoded mock data | 🔴 Критично | Высокий |
| `telemetry-service.getWardIdByDeviceId()` | Hardcoded placeholder | 🔴 Критично | Высокий |
| `analytics-service.getWardHealthReport()` | Пустые данные | 🟡 Средне | Средний |
| `analytics-service.getSystemStats()` | Пустые данные | 🟡 Средне | Средний |
| `location-service` публикация событий | Комментарий TODO | 🟡 Средне | Средний |
| `alert-service` проверка доступа | Упрощенная проверка | 🟡 Средне | Средний |
| `AI Prediction` модель | Эвристика вместо ML | 🟢 Нормально | Низкий |
| `SendGrid` email | Пропуск в development | ✅ Корректно | Низкий |
| `SMS.ru` SMS | Пропуск в development | ✅ Корректно | Низкий |
| `FCM` push | Пропуск в development | ✅ Корректно | Низкий |
| `Telegram` bot | Пропуск в development | ✅ Корректно | Низкий |
| `Admin App` все API | Mock через env | ✅ Корректно | Низкий |
| `YooKassa` payments | Полная реализация | ✅ Реализовано | - |
| `Auth Email` SMTP | Полная реализация | ✅ Реализовано | - |

---

## 🎯 Рекомендации по устранению

### Высокий приоритет

1. **Реализовать `getGuardiansForWard()` в integration-service:**
   - Добавить HTTP клиент для `user-service`
   - Использовать существующий endpoint `GET /family/wards/:wardId/members`
   - Обработать ошибки и fallback
   - Маппить данные из ответа `user-service` в формат, ожидаемый `integration-service`

2. **Реализовать `getWardIdByDeviceId()` в telemetry-service:**
   - **Вариант А:** Добавить HTTP клиент для `device-service` и использовать `GET /devices/:deviceId` (требуется проверка наличия `wardId` в ответе)
   - **Вариант Б:** Добавить новый endpoint в `device-service`: `GET /devices/:deviceId/ward`
   - **Вариант В:** Использовать прямую БД связь (если устройства и телеметрия в одной БД или shared БД)
   - Убрать hardcoded `'ward-placeholder'`

### Средний приоритет

3. **Реализовать агрегацию данных в analytics-service:**
   - Добавить запросы к `telemetry-service` для метрик
   - Добавить запросы к `alert-service` для статистики алертов
   - Добавить запросы к `user-service` для статистики пользователей

4. **Проверить публикацию событий в location-service:**
   - Убедиться, что события публикуются в RabbitMQ
   - Проверить обработку событий в других сервисах

5. **Усилить проверку доступа в alert-service:**
   - Реализовать проверку через `user-service`
   - Валидировать связь guardian-ward перед выдачей алерта

---

## 🔧 Управление моками в development

### Для integration-service (email/SMS/push/telegram):

Все сервисы автоматически пропускают отправку в `NODE_ENV=development` при отсутствии API ключей. Для тестирования реальной отправки:

1. Установить реальные API ключи в `.env`
2. Переключить `NODE_ENV=production` (или убрать проверку)

### Для admin-app:

Использовать переменную окружения:
```env
VITE_USE_MOCKS=false  # Использовать реальный API
VITE_USE_MOCKS=true   # Использовать mock данные
```

---

## ✅ Заключение

**Критические заглушки:** 2 (integration-service, telemetry-service)
**Частичные заглушки:** 3 (analytics, location, alert services)
**Условные заглушки:** 4 (email/SMS/push/telegram в development) - ✅ Корректно
**Frontend моки:** 7 API модулей - ✅ Корректно (управляются через env)

**Общий статус:** 🟡 **Требуется доработка** - 5 критических/частичных заглушек требуют реализации для полноценной работы системы.

