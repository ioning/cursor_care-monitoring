# Мониторинг системы Care Monitoring

Полная система мониторинга на основе Prometheus, Grafana, Loki и Alertmanager.

## Компоненты

### Prometheus
- Сбор метрик со всех сервисов
- Хранение временных рядов
- Правила алертов
- Интеграция с Alertmanager

### Grafana
- Визуализация метрик
- Дашборды для сервисов, инфраструктуры и бизнес-метрик
- Интеграция с Loki для логов

### Loki
- Агрегация логов
- Интеграция с Grafana
- Хранение логов

### Promtail
- Сбор логов из контейнеров
- Отправка в Loki

### Alertmanager
- Управление алертами
- Маршрутизация уведомлений
- Группировка и подавление

### Exporters
- **Node Exporter** - системные метрики
- **Postgres Exporter** - метрики PostgreSQL
- **Redis Exporter** - метрики Redis
- **RabbitMQ Exporter** - метрики RabbitMQ

## Запуск

```bash
cd monitoring
docker-compose up -d
```

## Доступ

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (admin/admin)
- **Alertmanager**: http://localhost:9093
- **Loki**: http://localhost:3100

## Дашборды Grafana

1. **Services Overview** - обзор всех сервисов
2. **Infrastructure** - метрики инфраструктуры
3. **Business Metrics** - бизнес-метрики

## Алерты

### Service Alerts
- Service Down
- High Error Rate
- High Response Time
- High CPU/Memory Usage
- Disk Space Low

### Business Alerts
- High Alert Creation Rate
- Emergency Calls Queue
- Telemetry Processing Lag
- AI Prediction Failure Rate
- Notification Delivery Failure

## Конфигурация

### Prometheus
- `prometheus/prometheus.yml` - основная конфигурация
- `prometheus/alerts/*.yml` - правила алертов

### Grafana
- `grafana/dashboards/*.json` - дашборды
- `grafana/datasources/*.yml` - источники данных

### Alertmanager
- `alertmanager/alertmanager.yml` - конфигурация уведомлений

### Loki
- `loki/loki-config.yml` - конфигурация Loki

## Метрики в сервисах

Все сервисы должны экспортировать метрики на `/metrics` endpoint.

Используйте `shared/libs/metrics.ts` для создания метрик:

```typescript
import { telemetryReceivedTotal } from '../../shared/libs/metrics';

// Record metric
telemetryReceivedTotal.inc({ metric_type: 'heart_rate' });
```

## Health Checks

Все сервисы должны иметь health check endpoints:
- `/health` - общий health check
- `/health/ready` - readiness check
- `/health/live` - liveness check
- `/metrics` - Prometheus метрики

## Интеграция с сервисами

Добавьте в каждый сервис:

```typescript
import { metricsMiddleware } from '../../shared/libs/metrics-middleware';
import { healthCheck, readinessCheck, livenessCheck } from '../../shared/libs/health-check';
import { getMetricsEndpoint } from '../../shared/controllers/metrics.controller';

// Middleware
app.use(metricsMiddleware);

// Endpoints
app.get('/health', healthCheck);
app.get('/health/ready', readinessCheck);
app.get('/health/live', livenessCheck);
app.get('/metrics', getMetricsEndpoint);
```

## Troubleshooting

### Prometheus не собирает метрики
- Проверьте, что сервисы доступны
- Проверьте конфигурацию в `prometheus.yml`
- Проверьте логи Prometheus

### Grafana не показывает данные
- Проверьте подключение к Prometheus
- Проверьте datasource в Grafana
- Проверьте запросы в дашбордах

### Алерты не работают
- Проверьте конфигурацию Alertmanager
- Проверьте правила в Prometheus
- Проверьте интеграции (Slack, Email)

## Дополнительная информация

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)

