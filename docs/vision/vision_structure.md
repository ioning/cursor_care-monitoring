# Vision: Project Structure

Актуальное дерево (сокращено):
```
care-monitoring-system/
├── infrastructure/        # docker-compose, scripts
├── api-gateway/           # NestJS gateway
├── microservices/         # auth, user, device, telemetry, ai-prediction, alert, integration, dispatcher, location, billing, analytics, organization
├── shared/                # общие библиотеки/типы
├── frontend/              # apps: guardian, dispatcher, admin, landing; packages/realtime
├── mobile/                # ward-app (React Native)
├── monitoring/            # Prometheus, Grafana, Loki, Alertmanager
├── database/              # migrations per service
├── docs/                  # документация
└── scripts/               # вспомогательные скрипты
```

Скрипт `generate_structure.py` использует этот файл как источник структуры.

