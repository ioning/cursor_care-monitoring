# Database Migrations

Система миграций базы данных для всех микросервисов.

## Структура

```
database/
└── migrations/
    ├── auth/
    │   ├── 001_create_users_table.sql
    │   └── 002_create_sessions_table.sql
    ├── user/
    │   ├── 001_create_users_table.sql
    │   ├── 002_create_wards_table.sql
    │   └── 003_create_guardian_wards_table.sql
    ├── device/
    │   └── 001_create_devices_table.sql
    ├── telemetry/
    │   └── 001_create_raw_metrics_table.sql
    ├── alert/
    │   └── 001_create_alerts_table.sql
    ├── ai-prediction/
    │   └── 001_create_predictions_table.sql
    ├── integration/
    │   └── 001_create_notifications_table.sql
    ├── dispatcher/
    │   ├── 001_create_emergency_calls_table.sql
    │   └── 002_create_dispatchers_table.sql
    ├── location/
    │   ├── 001_create_locations_table.sql
    │   └── 002_create_geofences_table.sql
    ├── billing/
    │   ├── 001_create_subscriptions_table.sql
    │   ├── 002_create_payments_table.sql
    │   └── 003_create_invoices_table.sql
    └── analytics/
        └── 001_create_reports_table.sql
```

## Использование

### Применить все миграции

```bash
npm run db:migrate
```

### Применить миграции для конкретного сервиса

```bash
npm run db:migrate up auth
npm run db:migrate up user
npm run db:migrate up device
```

### Откатить последнюю миграцию

```bash
npm run db:migrate down
npm run db:migrate down auth
```

## Формат миграций

Каждая миграция должна содержать:

```sql
-- UP
-- SQL для применения миграции
CREATE TABLE ...

-- DOWN
-- SQL для отката миграции
DROP TABLE ...
```

## Правила

1. Миграции выполняются в алфавитном порядке
2. Каждая миграция выполняется в транзакции
3. Откат возможен только для последней миграции
4. Миграции отслеживаются в таблице `migrations`

## Создание новой миграции

1. Создайте файл в соответствующей директории сервиса
2. Используйте формат: `XXX_description.sql` (XXX - номер)
3. Добавьте секции `-- UP` и `-- DOWN`
4. Запустите миграцию

## Пример

```sql
-- UP
CREATE TABLE IF NOT EXISTS example_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_example_name ON example_table(name);

-- DOWN
DROP INDEX IF EXISTS idx_example_name;
DROP TABLE IF EXISTS example_table;
```

