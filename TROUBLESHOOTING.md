# Troubleshooting Guide

## Быстрые проверки
- Gateway health: `curl -f http://<gateway_host>:3000/health`
- Логи: `docker-compose -f docker-compose.services.yml logs -f <service>`
- Очереди: RabbitMQ UI (`:15672`), проверить длины и dead-letter.
- БД: `psql` к нужной DB, проверить соединение/схему.

## Типовые проблемы

### Миграции не применяются / ошибки схемы
- Убедиться, что все БД существуют (см. `scripts/migrate.ts` список).
- Запуск: `npm run db:migrate` или `npm run db:migrate up <service>`.
- Проверить переменные `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD`.

### Нет телеметрии / растут очереди
- Проверить `telemetry-service` и `ai-prediction-service` логи.
- Проверить очереди RabbitMQ, наличие потребителей.
- Временный фоллбек: снизить частоту публикации, масштабировать консьюмеры.

### Алерты/уведомления не доходят
- Проверить `alert-service` и `integration-service` логи.
- Провайдеры-заглушки: убедиться, что включены нужные адаптеры (email/sms/push/telegram).

### Высокая задержка AI
- Проверить нагрузку CPU на `ai-prediction-service`.
- Включить деградацию (пороговые правила) при недоступности модели.

### Ошибки аутентификации/авторизации
- Проверить истечение/рассинхронизацию JWT/refresh.
- Проверить настройки CORS, audience/issuer в JWT-конфиге.

### Биллинг блокирует функционал
- Проверить данные подписок, актуальность subscription.guard.
- Временно ослабить guard для критичных эндпойнтов (документировать!).

## Инструменты
- Мониторинг: Grafana/Prometheus (latency/error rate/CPU/memory).
- Логи: Loki/ELK; включите correlation-id в запросах.
- Профайлинг нагрузки: k6/JMeter для API, временно.

