# Быстрый старт: Multi-Tenancy

## Установка и настройка

### 1. Применение миграций

```bash
# Применить все миграции
npm run db:migrate

# Или по отдельности
npm run db:migrate:up
```

Миграции создадут:
- Таблицу `organizations`
- Поле `organization_id` в `users`, `wards`, `alerts`, `raw_metrics`
- Дефолтную организацию для существующих данных
- Все необходимые индексы

### 2. Запуск сервисов

```bash
# Запустить все сервисы включая Organization Service
npm run dev:all

# Или отдельно
npm run dev:organization  # Порт 3012
npm run dev:gateway       # Порт 3000
```

### 3. Создание первой организации

```bash
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "Диспетчерская служба №1",
    "slug": "dispatcher-1",
    "subscriptionTier": "professional",
    "maxWards": 100,
    "maxDispatchers": 10,
    "trialDays": 30
  }'
```

### 4. Создание пользователя в организации

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dispatcher-1.ru",
    "password": "secure-password",
    "fullName": "Администратор",
    "role": "organization_admin",
    "organizationId": "<organization-id>"
  }'
```

### 5. Вход и получение токена

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dispatcher-1.ru",
    "password": "secure-password"
  }'
```

Токен будет содержать `organizationId` для автоматической фильтрации.

## Проверка работы

### Проверка изоляции

```bash
# Создать подопечного (автоматически привязан к организации из токена)
curl -X POST http://localhost:3000/api/v1/wards \
  -H "Authorization: Bearer <token-with-org-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Иван Петров",
    "dateOfBirth": "1950-01-01"
  }'

# Получить подопечных (только своей организации)
curl http://localhost:3000/api/v1/wards \
  -H "Authorization: Bearer <token-with-org-id>"
```

### Проверка лимитов

```bash
curl http://localhost:3000/api/v1/organizations/<org-id>/limits/wards \
  -H "Authorization: Bearer <token>"
```

## Структура данных

После миграции структура будет следующей:

```
organizations (tenant)
├── users (с organization_id)
│   ├── dispatchers
│   ├── guardians
│   ├── wards
│   └── organization_admins
├── wards (с organization_id)
├── alerts (с organization_id)
├── telemetry (с organization_id)
└── subscriptions (на уровне организации)
```

## Важные замечания

1. **Email уникален в рамках организации** - один email может существовать в разных организациях
2. **Все запросы автоматически фильтруются** по `organizationId` из JWT
3. **Дефолтная организация** создается для обратной совместимости
4. **Лимиты проверяются** перед созданием ресурсов

## Troubleshooting

### Проблема: "Tenant ID is required"

**Решение**: Убедитесь, что JWT токен содержит `organizationId`. Проверьте логин пользователя.

### Проблема: "Access denied: user does not belong to this organization"

**Решение**: Пользователь пытается получить доступ к данным другой организации. Проверьте `organizationId` в токене.

### Проблема: "Limit reached"

**Решение**: Организация достигла лимита ресурсов. Обновите подписку или увеличьте лимиты.



## Установка и настройка

### 1. Применение миграций

```bash
# Применить все миграции
npm run db:migrate

# Или по отдельности
npm run db:migrate:up
```

Миграции создадут:
- Таблицу `organizations`
- Поле `organization_id` в `users`, `wards`, `alerts`, `raw_metrics`
- Дефолтную организацию для существующих данных
- Все необходимые индексы

### 2. Запуск сервисов

```bash
# Запустить все сервисы включая Organization Service
npm run dev:all

# Или отдельно
npm run dev:organization  # Порт 3012
npm run dev:gateway       # Порт 3000
```

### 3. Создание первой организации

```bash
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin-token>" \
  -d '{
    "name": "Диспетчерская служба №1",
    "slug": "dispatcher-1",
    "subscriptionTier": "professional",
    "maxWards": 100,
    "maxDispatchers": 10,
    "trialDays": 30
  }'
```

### 4. Создание пользователя в организации

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dispatcher-1.ru",
    "password": "secure-password",
    "fullName": "Администратор",
    "role": "organization_admin",
    "organizationId": "<organization-id>"
  }'
```

### 5. Вход и получение токена

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dispatcher-1.ru",
    "password": "secure-password"
  }'
```

Токен будет содержать `organizationId` для автоматической фильтрации.

## Проверка работы

### Проверка изоляции

```bash
# Создать подопечного (автоматически привязан к организации из токена)
curl -X POST http://localhost:3000/api/v1/wards \
  -H "Authorization: Bearer <token-with-org-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Иван Петров",
    "dateOfBirth": "1950-01-01"
  }'

# Получить подопечных (только своей организации)
curl http://localhost:3000/api/v1/wards \
  -H "Authorization: Bearer <token-with-org-id>"
```

### Проверка лимитов

```bash
curl http://localhost:3000/api/v1/organizations/<org-id>/limits/wards \
  -H "Authorization: Bearer <token>"
```

## Структура данных

После миграции структура будет следующей:

```
organizations (tenant)
├── users (с organization_id)
│   ├── dispatchers
│   ├── guardians
│   ├── wards
│   └── organization_admins
├── wards (с organization_id)
├── alerts (с organization_id)
├── telemetry (с organization_id)
└── subscriptions (на уровне организации)
```

## Важные замечания

1. **Email уникален в рамках организации** - один email может существовать в разных организациях
2. **Все запросы автоматически фильтруются** по `organizationId` из JWT
3. **Дефолтная организация** создается для обратной совместимости
4. **Лимиты проверяются** перед созданием ресурсов

## Troubleshooting

### Проблема: "Tenant ID is required"

**Решение**: Убедитесь, что JWT токен содержит `organizationId`. Проверьте логин пользователя.

### Проблема: "Access denied: user does not belong to this organization"

**Решение**: Пользователь пытается получить доступ к данным другой организации. Проверьте `organizationId` в токене.

### Проблема: "Limit reached"

**Решение**: Организация достигла лимита ресурсов. Обновите подписку или увеличьте лимиты.







