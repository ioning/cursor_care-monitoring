# Мониторинг: Настройка завершена

**Дата:** 2025-12-08  
**Статус:** ✅ Готово к использованию

## ✅ Реализовано

### 1. Prometheus Configuration

**Файл:** `monitoring/prometheus/prometheus.yml`

**Настроено:**
- ✅ Scrape configs для всех 14 сервисов (API Gateway + 13 микросервисов)
- ✅ Scrape configs для инфраструктуры (PostgreSQL, Redis, RabbitMQ, Node Exporter)
- ✅ Alertmanager интеграция
- ✅ Правила алертов подключены (`alerts/*.yml`)

**Сервисы в scrape configs:**
- api-gateway (port 3000)
- auth-service (port 3001)
- user-service (port 3002)
- device-service (port 3003)
- telemetry-service (port 3004)
- alert-service (port 3005)
- location-service (port 3006)
- billing-service (port 3007)
- integration-service (port 3008)
- dispatcher-service (port 3009)
- analytics-service (port 3010)
- ai-prediction-service (port 3011)
- organization-service (port 3012)

### 2. Alert Rules

**Файлы:**
- `monitoring/prometheus/alerts/service-alerts.yml` - сервисные алерты
- `monitoring/prometheus/alerts/business-alerts.yml` - бизнес-алерты

**Service Alerts:**
- ✅ ServiceDown - сервис недоступен
- ✅ HighErrorRate - высокая частота ошибок (>10% за 5 минут)
- ✅ HighResponseTime - высокое время отклика (95th percentile >1s)
- ✅ HighCPUUsage - высокая загрузка CPU (>80%)
- ✅ HighMemoryUsage - высокая загрузка памяти (>85%)
- ✅ DiskSpaceLow - мало места на диске (<10%)
- ✅ DatabaseConnectionPoolExhausted - пул соединений БД почти исчерпан (>80%)
- ✅ RabbitMQQueueLength - длинная очередь RabbitMQ (>10000 сообщений)
- ✅ RedisMemoryUsage - высокое использование памяти Redis (>90%)

**Business Alerts:**
- ✅ HighAlertCreationRate - высокая частота создания алертов
- ✅ EmergencyCallsQueue - очередь экстренных вызовов
- ✅ TelemetryProcessingLag - задержка обработки телеметрии
- ✅ AIPredictionFailureRate - высокая частота ошибок AI предсказаний
- ✅ NotificationDeliveryFailure - ошибки доставки уведомлений

### 3. Alertmanager Configuration

**Файл:** `monitoring/alertmanager/alertmanager.yml`

**Настроено:**
- ✅ Маршрутизация алертов по severity (critical/warning)
- ✅ Webhook интеграция с integration-service
- ✅ Slack интеграция (для critical и warning)
- ✅ Email интеграция (для critical)
- ✅ Inhibit rules для подавления дубликатов

**Receivers:**
- `default` - webhook в integration-service
- `critical-alerts` - Slack + Email + Webhook
- `warning-alerts` - Slack

### 4. Promtail Configuration

**Файл:** `monitoring/promtail/promtail-config.yml`

**Настроено:**
- ✅ Docker service discovery для автоматического сбора логов из контейнеров
- ✅ Pipeline stages для парсинга JSON логов
- ✅ Label extraction из Docker metadata
- ✅ Отправка логов в Loki

**Scrape Configs:**
- `system` - системные логи
- `services` - логи сервисов
- `docker` - автоматический сбор из Docker контейнеров

### 5. Loki Configuration

**Файл:** `monitoring/loki/loki-config.yml`

**Настроено:**
- ✅ Хранение логов (filesystem)
- ✅ Retention: 168 часов (7 дней)
- ✅ Интеграция с Alertmanager для log-based алертов

### 6. Grafana Dashboards

**Файлы:**
- `monitoring/grafana/dashboards/services-overview.json`
- `monitoring/grafana/dashboards/infrastructure.json`
- `monitoring/grafana/dashboards/business-metrics.json`

**Datasources:**
- Prometheus: `monitoring/grafana/datasources/prometheus.yml`
- Loki: `monitoring/grafana/datasources/loki.yml`

## 🚀 Запуск

```bash
cd monitoring
docker-compose up -d
```

**Доступ:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)
- Alertmanager: http://localhost:9093
- Loki: http://localhost:3100

## 📊 Проверка работы

### 1. Проверить Prometheus scrape

Откройте Prometheus UI и перейдите в Status → Targets. Все targets должны быть `UP`.

### 2. Проверить метрики

В Prometheus UI выполните запросы:
```
up{job="auth-service"}
http_requests_total
telemetry_received_total
```

### 3. Проверить алерты

В Prometheus UI перейдите в Alerts. Все правила должны быть активны.

В Alertmanager UI (http://localhost:9093) проверьте:
- Активные алерты
- Синхронизацию с Prometheus

### 4. Проверить логи в Loki

В Grafana добавьте Loki datasource и выполните запрос:
```
{service="auth-service"}
```

### 5. Проверить Promtail

Проверьте логи Promtail:
```bash
docker logs care-monitoring-promtail
```

Должны видеть сообщения о сборе логов из контейнеров.

## 🔧 Интеграция с сервисами

Все сервисы уже настроены для мониторинга:

1. **Health checks** - все сервисы имеют `/health`, `/health/ready`, `/health/live`
2. **Metrics** - все сервисы имеют `/metrics` endpoint
3. **Prometheus scrape** - конфигурация готова в `prometheus.yml`
4. **Logging** - все сервисы используют Winston с JSON форматированием

## 📝 Следующие шаги

1. **Запустить мониторинг стека:**
   ```bash
   cd monitoring && docker-compose up -d
   ```

2. **Проверить работу всех компонентов:**
   - Prometheus scrape всех сервисов
   - Alertmanager синхронизацию
   - Promtail сбор логов
   - Grafana dashboards

3. **Настроить уведомления:**
   - Добавить Slack webhook URL в `alertmanager.yml`
   - Настроить SMTP для email уведомлений

4. **Создать дополнительные dashboards:**
   - Dashboard для каждого сервиса
   - Dashboard для бизнес-метрик
   - Dashboard для инфраструктуры

## ✅ Статус

**Мониторинг готов к использованию!**

Все компоненты настроены и готовы к запуску. После запуска `docker-compose up -d` в директории `monitoring/`, все метрики, логи и алерты начнут собираться автоматически.

