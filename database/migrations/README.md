# Database Migrations Guide

## Обзор

Система миграций позволяет версионировать схему базы данных и применять изменения последовательно.

## Команды

### Применить все миграции

```bash
npm run db:migrate
# или
npm run db:migrate:up
```

### Применить миграции для конкретного сервиса

```bash
npm run db:migrate up auth
npm run db:migrate up user
npm run db:migrate up device
npm run db:migrate up telemetry
npm run db:migrate up alert
npm run db:migrate up ai-prediction
npm run db:migrate up integration
npm run db:migrate up dispatcher
npm run db:migrate up location
npm run db:migrate up billing
npm run db:migrate up analytics
```

### Откатить последнюю миграцию

```bash
npm run db:migrate:down
# или для конкретного сервиса
npm run db:migrate down auth
```

## Структура миграций

Каждая миграция должна содержать две секции:

1. **-- UP** - SQL для применения миграции
2. **-- DOWN** - SQL для отката миграции (опционально)

## Пример миграции

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

## Правила именования

- Формат: `XXX_description.sql`
- XXX - трехзначный номер (001, 002, 003...)
- description - краткое описание на английском
- Примеры:
  - `001_create_users_table.sql`
  - `002_add_email_index.sql`
  - `003_add_phone_verification.sql`

## Best Practices

1. **Всегда используйте IF NOT EXISTS** для CREATE
2. **Всегда используйте IF EXISTS** для DROP
3. **Создавайте индексы отдельно** от таблиц
4. **Используйте транзакции** (автоматически)
5. **Тестируйте откат** перед коммитом
6. **Не изменяйте существующие миграции** - создавайте новые

## Отслеживание миграций

Миграции отслеживаются в таблице `migrations` в каждой базе данных:

```sql
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Миграция не применяется

1. Проверьте, что файл находится в правильной директории
2. Проверьте формат файла (-- UP и -- DOWN)
3. Проверьте логи ошибок

### Ошибка при откате

1. Убедитесь, что миграция содержит секцию -- DOWN
2. Проверьте, что SQL для отката корректен
3. Откат возможен только для последней миграции

### Конфликт миграций

Если две миграции имеют одинаковый номер, будет применена первая по алфавиту. Переименуйте файлы для правильного порядка.

