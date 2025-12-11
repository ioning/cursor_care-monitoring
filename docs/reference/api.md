# API Specification

> **Примечание:** Для примеров использования API см. [API Examples](./API_EXAMPLES.md)

Базовые entrypoints через API Gateway (`api-gateway/`):
- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- Telemetry: `POST /telemetry`
- AI: `POST /ai/predict/fall`, `POST /ai/predict/health-risks`
- Alerts: `GET /alerts`, `POST /alerts/:id/ack`
- Guardian dashboard: `GET /guardian/dashboard`

Примеры: `docs/api/examples.md`. События MQ описаны в `docs/events/rabbitmq-events.md`.

