# История миграций

## 2024-01-15 - Начальные миграции

### Auth Service
- `001_create_users_table.sql` - Создание таблицы пользователей
- `002_create_sessions_table.sql` - Создание таблицы сессий

### User Service
- `001_create_users_table.sql` - Создание таблицы пользователей (read-only)
- `002_create_wards_table.sql` - Создание таблицы подопечных
- `003_create_guardian_wards_table.sql` - Создание связи опекунов и подопечных

### Device Service
- `001_create_devices_table.sql` - Создание таблицы устройств

### Telemetry Service
- `001_create_raw_metrics_table.sql` - Создание таблицы метрик

### Alert Service
- `001_create_alerts_table.sql` - Создание таблицы алертов

### AI Prediction Service
- `001_create_predictions_table.sql` - Создание таблицы предсказаний

### Integration Service
- `001_create_notifications_table.sql` - Создание таблицы уведомлений

### Dispatcher Service
- `001_create_emergency_calls_table.sql` - Создание таблицы экстренных вызовов
- `002_create_dispatchers_table.sql` - Создание таблицы диспетчеров

### Location Service
- `001_create_locations_table.sql` - Создание таблицы местоположений
- `002_create_geofences_table.sql` - Создание таблицы геозон

### Billing Service
- `001_create_subscriptions_table.sql` - Создание таблицы подписок
- `002_create_payments_table.sql` - Создание таблицы платежей
- `003_create_invoices_table.sql` - Создание таблицы счетов

### Analytics Service
- `001_create_reports_table.sql` - Создание таблицы отчетов

**Всего создано: 19 миграций**

