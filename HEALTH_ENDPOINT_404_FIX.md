# Решение проблемы 404 на health endpoints

## Проблема

При проверке сервисов скрипт показывает:

```
[WARN] Auth Service (port 3001): Port open but health endpoint not responding
      -> Error: (404) Not Found
```

Это означает, что:
- ✅ Порт открыт (сервис запущен)
- ❌ Health endpoint не отвечает (404 Not Found)

## Возможные причины

### 1. Сервис еще компилируется

При первом запуске NestJS компилирует TypeScript в JavaScript. Это может занять 30-60 секунд.

**Решение:** Подождите 1-2 минуты и проверьте снова:

```powershell
.\scripts\check-services.ps1 -Type backend
```

### 2. Health controller не зарегистрирован первым

В NestJS порядок регистрации контроллеров важен. Health controller должен быть зарегистрирован **перед** контроллерами с динамическими маршрутами (например, `/:id`).

**Проверка:** Откройте `app.module.ts` сервиса и убедитесь, что `HealthController` идет первым:

```typescript
controllers: [HealthController, MetricsController, OtherController],
```

**Пример правильного порядка** (из `organization-service`):
```typescript
// Order matters: static routes like /health and /metrics must be registered before /:id
controllers: [HealthController, MetricsController, OrganizationController],
```

### 3. Глобальный префикс

Некоторые сервисы могут использовать глобальный префикс. Проверьте `main.ts`:

```typescript
app.setGlobalPrefix('api/v1'); // Если есть, путь будет /api/v1/health
```

### 4. Ошибки при запуске

Сервис может запуститься, но упасть при инициализации модулей.

**Проверка:** Посмотрите логи сервиса в консоли, где был запущен `npm run dev:all` или отдельный сервис.

### 5. Health endpoint не экспортирован

Убедитесь, что health controller правильно экспортирован и импортирован в `app.module.ts`.

## Решение

### Шаг 1: Проверьте логи

Посмотрите логи сервиса, который не отвечает:

```powershell
# Если сервисы запущены через npm run dev:all
# Логи будут в той же консоли

# Или запустите сервис отдельно для просмотра логов
cd microservices/auth-service
npm run start:dev
```

### Шаг 2: Проверьте порядок контроллеров

Откройте `app.module.ts` проблемного сервиса и убедитесь, что `HealthController` зарегистрирован первым:

```typescript
controllers: [HealthController, MetricsController, /* другие контроллеры */],
```

### Шаг 3: Проверьте вручную

Попробуйте открыть health endpoint в браузере или через curl:

```powershell
# Для микросервисов
Invoke-WebRequest -Uri "http://localhost:3001/health"

# Для API Gateway
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health"
```

### Шаг 4: Перезапустите сервис

Если проблема сохраняется, перезапустите сервис:

```powershell
# Остановите все сервисы (Ctrl+C)
# Затем запустите снова
npm run dev:all
```

## Проверка работоспособности

После исправления проверьте:

```powershell
.\scripts\check-services.ps1 -Type backend
```

Сервисы должны показывать `[OK]` вместо `[WARN]`.

## Дополнительная информация

- Health endpoints должны быть доступны на `/health` для всех микросервисов
- API Gateway использует `/api/v1/health` из-за глобального префикса
- Все сервисы также поддерживают `/health/ready` и `/health/live`

## Статус исправлений

Если вы видите `[WARN]` для сервисов, это не критично - сервисы могут работать, но health endpoints недоступны. Однако рекомендуется исправить это для правильного мониторинга.

