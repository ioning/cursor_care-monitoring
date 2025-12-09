# Monitoring Guide

Подробности: `monitoring/README.md`, дашборды/конфиги в `monitoring/prometheus`, `monitoring/grafana`, `monitoring/loki`, `monitoring/promtail`, `monitoring/alertmanager`.

- Метрики: Prometheus скрапит сервисы; добавьте экспорты метрик в сервисах.
- Логи: Loki + Promtail; сервисы пишут в stdout (JSON), promtail подхватывает.
- Дашборды: Grafana JSON в `monitoring/grafana/`.
- Алерты: Alertmanager конфиг в `monitoring/alertmanager/alertmanager.yml`.

