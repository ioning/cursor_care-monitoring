# Интеграция контрактных СМП и стоимости услуг

**Дата**: 2024-01-15  
**Версия**: 1.0.0

## Обзор

Реализована полная функциональность для управления контрактными СМП (Служба Медицинской Помощи) и отслеживания стоимости оказанных услуг.

## Архитектура

### База данных

#### Таблицы

1. **smp_providers** - Провайдеры СМП
   - Информация о компаниях-партнерах
   - Контактные данные
   - Данные о контрактах
   - Рейтинг и зона обслуживания

2. **service_prices** - База стоимости услуг
   - Типы услуг (экстренный вызов, скорая помощь, консультация и т.д.)
   - Базовая стоимость
   - Единицы измерения
   - Описание услуг

3. **smp_calls** - Вызовы СМП
   - Связь с экстренными вызовами
   - Привязка к провайдеру
   - Тип услуги и количество
   - Расчет стоимости
   - Статус выполнения

### API Endpoints

#### SMP Providers

```
GET /dispatcher/smp/providers
GET /dispatcher/smp/providers/:id
```

#### Service Prices

```
GET /dispatcher/smp/service-prices
GET /dispatcher/smp/service-prices/:serviceType
```

#### SMP Calls

```
GET /dispatcher/smp/calls
GET /dispatcher/smp/calls/:id
POST /dispatcher/smp/calls
PUT /dispatcher/smp/calls/:id/status
```

#### Cost Summary

```
GET /dispatcher/smp/cost-summary
Query params:
  - from: string (YYYY-MM-DD)
  - to: string (YYYY-MM-DD)
  - providerId?: string
  - organizationId?: string
```

## Использование

### Создание вызова СМП

```typescript
POST /dispatcher/smp/calls
{
  "callId": "uuid-of-emergency-call",
  "smpProviderId": "uuid-of-provider",
  "serviceType": "emergency_call",
  "quantity": 1.0,
  "notes": "Optional notes"
}
```

Система автоматически:
1. Находит цену услуги по типу
2. Проверяет существование провайдера
3. Рассчитывает общую стоимость (basePrice * quantity)
4. Создает запись о вызове СМП

### Получение статистики стоимости

```typescript
GET /dispatcher/smp/cost-summary?from=2024-01-01&to=2024-01-31
```

Возвращает:
- Общее количество провайдеров
- Количество активных провайдеров
- Общее количество вызовов
- Общую стоимость
- Детализацию по каждому провайдеру
- Разбивку по типам услуг

## Миграции

Миграция создает все необходимые таблицы и индексы:

```bash
npm run db:migrate
```

Или вручную:

```sql
-- Применить миграцию
\i database/migrations/dispatcher/002_create_smp_tables.sql
```

## Дефолтные данные

При инициализации автоматически создаются базовые типы услуг:

- **emergency_call** - Экстренный вызов (5000 руб.)
- **ambulance** - Скорая помощь (8000 руб.)
- **medical_consultation** - Медицинская консультация (3000 руб.)
- **transportation** - Транспортировка (50 руб./км)
- **home_visit** - Выезд на дом (6000 руб.)

## Multi-tenancy

Все таблицы поддерживают `organization_id` для изоляции данных между организациями. При запросах автоматически фильтруются по организации пользователя из JWT токена.

## Интеграция с вызовами

Вызовы СМП связаны с экстренными вызовами через `call_id` с каскадным удалением. При создании вызова СМП система:

1. Проверяет существование экстренного вызова
2. Получает актуальную цену услуги
3. Рассчитывает стоимость
4. Создает запись с статусом `pending`

## Статусы вызовов СМП

- **pending** - Ожидает подтверждения
- **confirmed** - Подтвержден провайдером
- **completed** - Завершен
- **cancelled** - Отменен

## Примеры использования

### Получение стоимости за месяц

```bash
curl -X GET "http://localhost:3009/dispatcher/smp/cost-summary?from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### Создание вызова СМП

```bash
curl -X POST "http://localhost:3009/dispatcher/smp/calls" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "123e4567-e89b-12d3-a456-426614174000",
    "smpProviderId": "987fcdeb-51a2-43d7-8f9e-123456789abc",
    "serviceType": "emergency_call",
    "quantity": 1.0
  }'
```

### Получение всех провайдеров

```bash
curl -X GET "http://localhost:3009/dispatcher/smp/providers" \
  -H "Authorization: Bearer <token>"
```

## Мониторинг и аналитика

Система предоставляет детальную аналитику:

- Стоимость по компаниям
- Количество вызовов по типам услуг
- Распределение затрат
- Периодические отчеты

Все данные доступны через API и отображаются в интерфейсе диспетчера.



**Дата**: 2024-01-15  
**Версия**: 1.0.0

## Обзор

Реализована полная функциональность для управления контрактными СМП (Служба Медицинской Помощи) и отслеживания стоимости оказанных услуг.

## Архитектура

### База данных

#### Таблицы

1. **smp_providers** - Провайдеры СМП
   - Информация о компаниях-партнерах
   - Контактные данные
   - Данные о контрактах
   - Рейтинг и зона обслуживания

2. **service_prices** - База стоимости услуг
   - Типы услуг (экстренный вызов, скорая помощь, консультация и т.д.)
   - Базовая стоимость
   - Единицы измерения
   - Описание услуг

3. **smp_calls** - Вызовы СМП
   - Связь с экстренными вызовами
   - Привязка к провайдеру
   - Тип услуги и количество
   - Расчет стоимости
   - Статус выполнения

### API Endpoints

#### SMP Providers

```
GET /dispatcher/smp/providers
GET /dispatcher/smp/providers/:id
```

#### Service Prices

```
GET /dispatcher/smp/service-prices
GET /dispatcher/smp/service-prices/:serviceType
```

#### SMP Calls

```
GET /dispatcher/smp/calls
GET /dispatcher/smp/calls/:id
POST /dispatcher/smp/calls
PUT /dispatcher/smp/calls/:id/status
```

#### Cost Summary

```
GET /dispatcher/smp/cost-summary
Query params:
  - from: string (YYYY-MM-DD)
  - to: string (YYYY-MM-DD)
  - providerId?: string
  - organizationId?: string
```

## Использование

### Создание вызова СМП

```typescript
POST /dispatcher/smp/calls
{
  "callId": "uuid-of-emergency-call",
  "smpProviderId": "uuid-of-provider",
  "serviceType": "emergency_call",
  "quantity": 1.0,
  "notes": "Optional notes"
}
```

Система автоматически:
1. Находит цену услуги по типу
2. Проверяет существование провайдера
3. Рассчитывает общую стоимость (basePrice * quantity)
4. Создает запись о вызове СМП

### Получение статистики стоимости

```typescript
GET /dispatcher/smp/cost-summary?from=2024-01-01&to=2024-01-31
```

Возвращает:
- Общее количество провайдеров
- Количество активных провайдеров
- Общее количество вызовов
- Общую стоимость
- Детализацию по каждому провайдеру
- Разбивку по типам услуг

## Миграции

Миграция создает все необходимые таблицы и индексы:

```bash
npm run db:migrate
```

Или вручную:

```sql
-- Применить миграцию
\i database/migrations/dispatcher/002_create_smp_tables.sql
```

## Дефолтные данные

При инициализации автоматически создаются базовые типы услуг:

- **emergency_call** - Экстренный вызов (5000 руб.)
- **ambulance** - Скорая помощь (8000 руб.)
- **medical_consultation** - Медицинская консультация (3000 руб.)
- **transportation** - Транспортировка (50 руб./км)
- **home_visit** - Выезд на дом (6000 руб.)

## Multi-tenancy

Все таблицы поддерживают `organization_id` для изоляции данных между организациями. При запросах автоматически фильтруются по организации пользователя из JWT токена.

## Интеграция с вызовами

Вызовы СМП связаны с экстренными вызовами через `call_id` с каскадным удалением. При создании вызова СМП система:

1. Проверяет существование экстренного вызова
2. Получает актуальную цену услуги
3. Рассчитывает стоимость
4. Создает запись с статусом `pending`

## Статусы вызовов СМП

- **pending** - Ожидает подтверждения
- **confirmed** - Подтвержден провайдером
- **completed** - Завершен
- **cancelled** - Отменен

## Примеры использования

### Получение стоимости за месяц

```bash
curl -X GET "http://localhost:3009/dispatcher/smp/cost-summary?from=2024-01-01&to=2024-01-31" \
  -H "Authorization: Bearer <token>"
```

### Создание вызова СМП

```bash
curl -X POST "http://localhost:3009/dispatcher/smp/calls" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "123e4567-e89b-12d3-a456-426614174000",
    "smpProviderId": "987fcdeb-51a2-43d7-8f9e-123456789abc",
    "serviceType": "emergency_call",
    "quantity": 1.0
  }'
```

### Получение всех провайдеров

```bash
curl -X GET "http://localhost:3009/dispatcher/smp/providers" \
  -H "Authorization: Bearer <token>"
```

## Мониторинг и аналитика

Система предоставляет детальную аналитику:

- Стоимость по компаниям
- Количество вызовов по типам услуг
- Распределение затрат
- Периодические отчеты

Все данные доступны через API и отображаются в интерфейсе диспетчера.







