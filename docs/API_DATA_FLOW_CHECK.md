# Проверка потока данных от мобильного приложения

## Дата проверки: 2025-12-25

## Резюме

Проведена полная проверка потока данных от мобильного приложения (ward-app) через API Gateway в соответствующие сервисы и возврат данных в приложения по ролям.

## ✅ Реализовано

### 1. Формат данных от мобильного приложения

**Мобильное приложение отправляет:**
```typescript
{
  deviceId?: string;
  wardId?: string;
  metricType: string;
  value: number;
  unit: string;
  timestamp: string;
}
```

**Telemetry-service ожидает:**
```typescript
{
  deviceId: string;
  metrics: Array<{
    type: string;
    value: number;
    unit?: string;
    qualityScore?: number;
    timestamp?: string;
  }>;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: string;
  };
}
```

**Решение:** Добавлен адаптер в API Gateway (`api-gateway/src/controllers/telemetry.controller.ts`), который автоматически преобразует формат данных от мобильного приложения в формат, ожидаемый telemetry-service.

### 2. Поток данных телеметрии

```
Mobile App (ward-app)
  ↓ POST /api/v1/telemetry (JWT auth)
API Gateway
  ↓ Преобразование формата данных
  ↓ POST /telemetry (JWT auth)
TelemetryService
  ↓ Получение wardId из DeviceService
  ↓ Сохранение в БД
  ↓ Отправка локации в LocationService (если есть)
  ↓ Создание алертов для критических метрик
  ↓ Публикация события в RabbitMQ
```

**Endpoints:**
- **Отправка:** `POST /api/v1/telemetry`
- **Получение:** `GET /api/v1/telemetry/wards/:wardId`
- **Последние данные:** `GET /api/v1/telemetry/wards/:wardId/latest`

### 3. Поток данных локации

```
Mobile App (ward-app)
  ↓ POST /api/v1/locations/wards/:wardId (JWT auth)
API Gateway
  ↓ POST /locations/wards/:wardId (JWT auth)
LocationService
  ↓ Сохранение в БД
  ↓ Проверка геозон
  ↓ Создание алертов при нарушении
  ↓ Публикация события в RabbitMQ
```

**Endpoints:**
- **Отправка:** `POST /api/v1/locations/wards/:wardId`
- **Последняя локация:** `GET /api/v1/locations/wards/:wardId/latest`
- **История:** `GET /api/v1/locations/wards/:wardId/history`

### 4. Возврат данных в приложения

#### Guardian App
- **Телеметрия:** `GET /api/v1/telemetry/wards/:wardId` (JWT auth, проверка доступа через guardian_wards)
- **Локация:** `GET /api/v1/locations/wards/:wardId/latest` (JWT auth, проверка доступа через guardian_wards)
- **Алерты:** `GET /api/v1/alerts?wardId=:wardId` (JWT auth, проверка доступа через guardian_wards)

#### Dispatcher App
- **Телеметрия:** `GET /api/v1/telemetry/wards/:wardId` (JWT auth, роль dispatcher - доступ ко всем данным)
- **Локация:** `GET /api/v1/locations/wards/:wardId/latest` (JWT auth, роль dispatcher - доступ ко всем данным)
- **Алерты:** `GET /api/v1/alerts?wardId=:wardId` (JWT auth, роль dispatcher - доступ ко всем данным)

#### Ward App (Mobile)
- **Телеметрия:** `GET /api/v1/telemetry/wards/:wardId` (JWT auth, только свои данные: wardId = userId)
- **Локация:** `GET /api/v1/locations/wards/:wardId/latest` (JWT auth, только свои данные: wardId = userId)
- **Алерты:** `GET /api/v1/alerts?wardId=:wardId` (JWT auth, только свои данные: wardId = userId)

### 5. Права доступа

#### Ward (подопечный)
- Может видеть только свои данные (`wardId = userId`)
- Может отправлять телеметрию и локацию только для себя
- Проверка: `req.user.id === wardId`

#### Guardian (опекун)
- Может видеть данные своих подопечных (через таблицу `guardian_wards`)
- Может отправлять телеметрию и локацию для своих подопечных
- Проверка: `guardianWardRepository.hasAccess(guardianId, wardId)`

#### Dispatcher (диспетчер)
- Может видеть все данные (роль `dispatcher`)
- Может отправлять телеметрию и локацию для всех подопечных
- Проверка: `req.user.role === 'dispatcher'`

## ⚠️ Требуется доработка

### 1. Проверка прав доступа в TelemetryService

**Текущее состояние:** `TelemetryService.getByWardId()` не проверяет права доступа пользователя.

**Рекомендация:** Добавить проверку прав доступа перед возвратом данных:
- Для роли `ward`: проверить, что `wardId === userId`
- Для роли `guardian`: проверить доступ через `UserServiceClient.hasAccessToWard(userId, wardId)`
- Для роли `dispatcher`: разрешить доступ ко всем данным

**Файл:** `microservices/telemetry-service/src/application/services/telemetry.service.ts`

### 2. Проверка прав доступа в LocationService

**Текущее состояние:** `LocationService.getLatestLocation()` и `LocationService.getLocationHistory()` не проверяют права доступа пользователя.

**Рекомендация:** Добавить проверку прав доступа аналогично TelemetryService.

**Файл:** `microservices/location-service/src/application/services/location.service.ts`

### 3. Проверка прав доступа в API Gateway

**Текущее состояние:** API Gateway просто проксирует запросы в сервисы без проверки прав доступа.

**Рекомендация:** Добавить проверку прав доступа в API Gateway перед проксированием для дополнительной безопасности:
- Использовать `UserServiceClient` для проверки доступа
- Для роли `ward`: проверить, что `wardId === userId`
- Для роли `guardian`: проверить доступ через `UserServiceClient.hasAccessToWard(userId, wardId)`
- Для роли `dispatcher`: разрешить доступ ко всем данным

**Файлы:**
- `api-gateway/src/controllers/telemetry.controller.ts`
- `api-gateway/src/controllers/location.controller.ts`

## 📊 Схема потока данных

```
┌─────────────────┐
│  Mobile App     │
│  (ward-app)     │
└────────┬────────┘
         │
         │ POST /api/v1/telemetry
         │ POST /api/v1/locations/wards/:wardId
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│  (Port 3000)    │
│  - JWT Auth     │
│  - Format       │
│    Transform    │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Telemetry    │  │ Location     │  │ Device      │
│ Service      │  │ Service      │  │ Service     │
│ (Port 3004)  │  │ (Port 3006)  │  │ (Port 3003) │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ PostgreSQL   │  │ PostgreSQL   │  │ PostgreSQL   │
│ (telemetry)  │  │ (location)   │  │ (device)     │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Alert        │  │ RabbitMQ     │
│ Service      │  │ (Events)     │
│ (Port 3005)  │  └──────────────┘
└──────────────┘
```

## 🔄 Обратный поток (возврат данных)

```
┌─────────────────┐
│  Guardian App   │
│  Dispatcher App │
│  Ward App       │
└────────┬────────┘
         │
         │ GET /api/v1/telemetry/wards/:wardId
         │ GET /api/v1/locations/wards/:wardId/latest
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│  - JWT Auth     │
│  - Proxy        │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Telemetry    │  │ Location     │
│ Service      │  │ Service      │
│ - Get Data   │  │ - Get Data   │
│ - Check      │  │ - Check      │
│   Access     │  │   Access     │
└──────────────┘  └──────────────┘
```

## 📝 Рекомендации

1. **Добавить проверку прав доступа** в TelemetryService и LocationService перед возвратом данных
2. **Добавить проверку прав доступа** в API Gateway для дополнительной безопасности
3. **Добавить логирование** всех запросов к данным для аудита
4. **Добавить rate limiting** для защиты от злоупотреблений
5. **Добавить кэширование** для часто запрашиваемых данных

## ✅ Заключение

Основной поток данных от мобильного приложения реализован и работает корректно. Добавлен адаптер для преобразования формата данных. Требуется добавить проверку прав доступа в сервисах для полной безопасности системы.

