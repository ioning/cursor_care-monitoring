# Проверка прав доступа и потока данных

## Дата проверки: 2025-12-25

## Резюме

Проведена полная проверка прав доступа по ролям (ward, guardian, dispatcher), возврата данных в приложения и полного потока данных от мобильного приложения до возврата.

## ✅ Реализовано

### 1. Права доступа по ролям

#### Ward (подопечный)
- **Доступ:** Только свои данные (`wardId === userId`)
- **Проверка:** В `UserServiceClient.hasAccessToWard()` - если `userRole === 'ward'` и `userId !== wardId`, возвращается `false`
- **Применяется в:**
  - `TelemetryService.getByWardId()` - проверка перед возвратом данных
  - `TelemetryService.getLatest()` - проверка перед возвратом данных
  - `LocationService.getLatestLocation()` - проверка перед возвратом данных
  - `LocationService.getLocationHistory()` - проверка перед возвратом данных

#### Guardian (опекун)
- **Доступ:** Данные своих подопечных (через таблицу `guardian_wards`)
- **Проверка:** В `UserServiceClient.hasAccessToWard()` - вызов `UserService` для проверки через `guardian_wards`
- **Применяется в:**
  - `TelemetryService.getByWardId()` - проверка через `UserServiceClient`
  - `TelemetryService.getLatest()` - проверка через `UserServiceClient`
  - `LocationService.getLatestLocation()` - проверка через `UserServiceClient`
  - `LocationService.getLocationHistory()` - проверка через `UserServiceClient`

#### Dispatcher (диспетчер)
- **Доступ:** Все данные (роль `dispatcher`)
- **Проверка:** В `UserServiceClient.hasAccessToWard()` - если `userRole === 'dispatcher'`, возвращается `true`
- **Применяется в:**
  - `TelemetryService.getByWardId()` - автоматический доступ
  - `TelemetryService.getLatest()` - автоматический доступ
  - `LocationService.getLatestLocation()` - автоматический доступ
  - `LocationService.getLocationHistory()` - автоматический доступ

### 2. Проверка прав доступа в сервисах

#### TelemetryService
- **Файл:** `microservices/telemetry-service/src/application/services/telemetry.service.ts`
- **Методы:**
  - `getByWardId(wardId, query, userId?, userRole?)` - проверка прав перед возвратом данных
  - `getLatest(wardId, userId?, userRole?)` - проверка прав перед возвратом данных
- **Клиент:** `UserServiceClient` для проверки доступа через `UserService`

#### LocationService
- **Файл:** `microservices/location-service/src/application/services/location.service.ts`
- **Методы:**
  - `getLatestLocation(wardId, userId?, userRole?)` - проверка прав перед возвратом данных
  - `getLocationHistory(wardId, filters, userId?, userRole?)` - проверка прав перед возвратом данных
- **Клиент:** `UserServiceClient` для проверки доступа через `UserService`

#### UserService
- **Файл:** `microservices/user-service/src/infrastructure/controllers/internal.controller.ts`
- **Endpoint:** `GET /internal/wards/:wardId/access/:userId`
- **Разрешенные сервисы:** `telemetry-service`, `location-service`, `alert-service`, `integration-service`, `dispatcher-service`
- **Метод:** `FamilyAccessService.hasAccessToWardInternal()` - проверка через `guardian_wards`

### 3. Поток данных от мобильного приложения

#### Отправка данных (Mobile App → API Gateway → Services)

**Телеметрия:**
```
Mobile App (ward-app)
  ↓ POST /api/v1/telemetry
  ↓ JWT: Bearer <token>
  ↓ Body: { deviceId, metricType, value, unit, timestamp }
API Gateway
  ↓ Преобразование формата (адаптер)
  ↓ POST /telemetry
  ↓ JWT: Bearer <token>
TelemetryService
  ↓ Получение wardId из DeviceService
  ↓ Сохранение в БД
  ↓ Отправка локации в LocationService (если есть)
  ↓ Создание алертов для критических метрик
  ↓ Публикация события в RabbitMQ
```

**Локация:**
```
Mobile App (ward-app)
  ↓ POST /api/v1/locations/wards/:wardId
  ↓ JWT: Bearer <token>
  ↓ Body: { latitude, longitude, accuracy, source }
API Gateway
  ↓ POST /locations/wards/:wardId
  ↓ JWT: Bearer <token>
LocationService
  ↓ Сохранение в БД
  ↓ Проверка геозон
  ↓ Создание алертов при нарушении
  ↓ Публикация события в RabbitMQ
```

#### Возврат данных (Applications → API Gateway → Services → Applications)

**Guardian App:**
```
Guardian App
  ↓ GET /api/v1/telemetry/wards/:wardId
  ↓ JWT: Bearer <token> (role: guardian)
API Gateway
  ↓ GET /telemetry/wards/:wardId
  ↓ JWT: Bearer <token>
TelemetryService
  ↓ Проверка прав доступа (UserServiceClient.hasAccessToWard)
  ↓ Проверка через guardian_wards
  ↓ Возврат данных
API Gateway
  ↓ Возврат данных
Guardian App
  ↓ Отображение данных
```

**Dispatcher App:**
```
Dispatcher App
  ↓ GET /api/v1/telemetry/wards/:wardId
  ↓ JWT: Bearer <token> (role: dispatcher)
API Gateway
  ↓ GET /telemetry/wards/:wardId
  ↓ JWT: Bearer <token>
TelemetryService
  ↓ Проверка прав доступа (UserServiceClient.hasAccessToWard)
  ↓ Автоматический доступ (role === 'dispatcher')
  ↓ Возврат данных
API Gateway
  ↓ Возврат данных
Dispatcher App
  ↓ Отображение данных
```

**Ward App (Mobile):**
```
Ward App (Mobile)
  ↓ GET /api/v1/telemetry/wards/:wardId
  ↓ JWT: Bearer <token> (role: ward, userId === wardId)
API Gateway
  ↓ GET /telemetry/wards/:wardId
  ↓ JWT: Bearer <token>
TelemetryService
  ↓ Проверка прав доступа (UserServiceClient.hasAccessToWard)
  ↓ Проверка: userId === wardId
  ↓ Возврат данных
API Gateway
  ↓ Возврат данных
Ward App
  ↓ Отображение данных
```

### 4. Структура проверки прав доступа

```
UserServiceClient.hasAccessToWard(userId, wardId, userRole)
  ↓
  ├─ Если role === 'ward' и userId !== wardId → false
  ├─ Если role === 'dispatcher' → true
  └─ Если role === 'guardian' → UserService.hasAccessToWardInternal()
      ↓
      FamilyAccessService.hasAccessToWardInternal()
      ↓
      GuardianWardRepository.hasAccess(guardianId, wardId)
      ↓
      Проверка в таблице guardian_wards
```

## 📊 Схема полного потока данных

```
┌─────────────────┐
│  Mobile App     │
│  (ward-app)     │
└────────┬────────┘
         │
         │ POST /api/v1/telemetry
         │ POST /api/v1/locations/wards/:wardId
         │ JWT: Bearer <token>
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
│ Telemetry    │  │ Location     │  │ Device       │
│ Service      │  │ Service      │  │ Service      │
│ (Port 3004)  │  │ (Port 3006)  │  │ (Port 3003)  │
│              │  │              │  │              │
│ - Check      │  │ - Check      │  │ - Get wardId │
│   Access     │  │   Access     │  │              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ User Service │  │ PostgreSQL   │  │ PostgreSQL   │
│ (Port 3002)  │  │ (telemetry)  │  │ (location)   │
│              │  │              │  │              │
│ - Check      │  │ - Store      │  │ - Store      │
│   Access     │  │   Data       │  │   Data       │
└──────────────┘  └──────────────┘  └──────────────┘
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
         │ JWT: Bearer <token>
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
│              │  │              │
│ 1. Get       │  │ 1. Get       │
│    userId,   │  │    userId,   │
│    userRole  │  │    userRole  │
│              │  │              │
│ 2. Check     │  │ 2. Check     │
│    Access    │  │    Access    │
│    via       │  │    via       │
│    UserService│  │    UserService│
│              │  │              │
│ 3. Get Data  │  │ 3. Get Data  │
│    from DB   │  │    from DB   │
│              │  │              │
│ 4. Return    │  │ 4. Return    │
│    Data      │  │    Data      │
└──────────────┘  └──────────────┘
```

## ✅ Реализованные проверки

### 1. TelemetryService
- ✅ Добавлен `UserServiceClient` для проверки прав доступа
- ✅ Метод `getByWardId()` проверяет права перед возвратом данных
- ✅ Метод `getLatest()` проверяет права перед возвратом данных
- ✅ Контроллер передает `userId` и `userRole` из JWT токена

### 2. LocationService
- ✅ Добавлен `UserServiceClient` для проверки прав доступа
- ✅ Метод `getLatestLocation()` проверяет права перед возвратом данных
- ✅ Метод `getLocationHistory()` проверяет права перед возвратом данных
- ✅ Контроллер передает `userId` и `userRole` из JWT токена

### 3. UserService
- ✅ Добавлены `telemetry-service` и `location-service` в список разрешенных сервисов
- ✅ Endpoint `/internal/wards/:wardId/access/:userId` доступен для проверки прав

### 4. API Gateway
- ✅ Проксирует JWT токен в сервисы
- ✅ Сервисы получают `userId` и `userRole` из JWT токена

## 📝 Логика проверки прав доступа

### UserServiceClient.hasAccessToWard()

```typescript
async hasAccessToWard(userId: string, wardId: string, userRole?: string): Promise<boolean> {
  // Ward users can only access their own data
  if (userRole === 'ward' && userId !== wardId) {
    return false;
  }

  // Dispatcher users have access to all wards
  if (userRole === 'dispatcher') {
    return true;
  }

  // Guardian users need to check access through guardian_wards table
  // Calls UserService /internal/wards/:wardId/access/:userId
  // Which checks guardian_wards table
}
```

## 🔒 Безопасность

1. **Принцип наименьших привилегий:** Каждая роль имеет только необходимый доступ
2. **Проверка на уровне сервисов:** Проверка прав выполняется в сервисах, а не только в API Gateway
3. **Защита от ошибок:** При ошибке проверки доступа возвращается `false` (deny by default)
4. **JWT аутентификация:** Все запросы требуют валидный JWT токен
5. **Внутренние вызовы:** Внутренние сервисы используют заголовок `X-Internal-Service` для аутентификации

## ✅ Заключение

Права доступа по ролям реализованы и работают корректно:
- ✅ Ward: только свои данные
- ✅ Guardian: данные своих подопечных
- ✅ Dispatcher: все данные

Поток данных от мобильного приложения до возврата работает корректно:
- ✅ Отправка данных через API Gateway
- ✅ Преобразование формата данных
- ✅ Сохранение в БД
- ✅ Проверка прав доступа перед возвратом
- ✅ Возврат данных в приложения

Все компоненты интегрированы и готовы к использованию.

