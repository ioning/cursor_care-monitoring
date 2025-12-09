# Runbook (операционное)

## Контакты/ответственность
- On-call команда: укажите ответственных и каналы связи.
- Доступы: секректы/ключи в секрет-хранилище; доступ в мониторинг и лог-хранилище.

## Критические флоу
- Auth → User → API Gateway
- Telemetry ingest: Device/Mobile → Telemetry → MQ → AI Prediction → Alert → Integration
- Billing guard: subscription.guard в gateway

## Обычные операции
- Проверка health: `GET /health` на gateway и сервисах.
- Миграции: `npm run db:migrate` (для всех БД) или `npm run db:migrate up <service>`.
- Рестарт сервиса (docker-compose): `docker-compose -f docker-compose.services.yml restart <service>`.

## Инциденты (шаблон действий)
1) Оценить влияние: какие сервисы/фронты неработоспособны, время обнаружения.
2) Диагностика:
   - Логи сервиса: `docker-compose -f docker-compose.services.yml logs -f <service>`
   - Метрики: Grafana/Prometheus (latency/error rate/CPU/memory/queue depth)
   - Сообщения/очереди: RabbitMQ management UI (длины очередей).
3) Смягчение:
   - Перезапуск контейнера/сервиса.
   - Отключить интеграции/уведомления, если спамят.
   - Увеличить ресурсы/реплики (если k8s).
4) Устранение причины:
   - Применить фикс/конфиг.
   - Прогнать миграции, если schema drift.
5) Коммуникация:
   - Статус-канал, ETA, кто в работе.

## Распространённые проблемы и решения
- **Миграции падают**: проверить доступ к DB, права, существование целевых БД; перезапустить `npm run db:migrate`; см. `database/migrations/*`.
- **Очереди растут**: проверить RabbitMQ, консьюмеры (ai-prediction, alert, integration), наличие редрлага; масштабировать консьюмеры.
- **Высокая задержка AI**: проверить ai-prediction-service логи, нагрузку CPU; включить деградацию (пороговые правила) если предусмотрено.
- **Биллинг блокирует фичи**: проверить subscription.guard конфиг и данные подписок; временно ослабить guard для критичных путей.
- **Rate limiting/429**: скорректировать лимиты на gateway, проверить аномальный трафик.

## Post-incident
- Собрать таймлайн, RCA, action items.
- Добавить алерты/метрики, тесты регрессии.

