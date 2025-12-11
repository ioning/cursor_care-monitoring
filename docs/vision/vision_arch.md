# Vision: Architecture

- Основная схема: см. последовательности в `docs/diagrams/component-interactions.md`.
- Микросервисы: `microservices/*` + `api-gateway/`; обмен через REST и RabbitMQ.
- Данные: Postgres (по сервисам), Redis (кэш/сессии), RabbitMQ (events/queues).
- Frontend: Vue 3 (guardian/dispatcher/admin/landing), Mobile: React Native.
- Multi-tenancy: описано в `docs/architecture/multi-tenancy.md` и `docs/implementation/multi-tenancy-implementation.md`.

