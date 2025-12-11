# Microservices Overview

Расположение: `microservices/` и `api-gateway/`.

- Auth Service — регистрация/логин/JWT/refresh, org-scoped пользователи.
- User Service — CRUD ward/guardian, связка с организациями.
- Device Service — регистрация устройств, ключи.
- Telemetry Service — приём телеметрии, валидация, publish `TelemetryReceived`.
- AI Prediction Service — обработка телеметрии, эвристика → `PredictionGenerated`/`RiskAlert`.
- Alert Service — управление алертами, статусы.
- Integration Service — адаптеры уведомлений (sms/push/email/telegram заглушки).
- Dispatcher Service — карточки вызовов, статусы, локация.
- Location Service — геозоны/координаты.
- Billing Service — планы/подписки, ограничения.
- Analytics Service — отчёты/метрики.
- Organization Service — multi-tenancy (организации, лимиты).
- API Gateway — прокси/агрегация, guards, health.

