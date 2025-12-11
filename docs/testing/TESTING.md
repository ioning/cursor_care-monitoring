# Testing Guide

## Команды
- Все тесты: `npm test` (из корня; при наличии локальных конфигов).
- Покрытие: `npm run test:coverage` (если определено в сервисах).
- Миграции перед интеграционными: `npm run db:migrate`.

## Уровни тестов
- Unit: сервисы/модули в микросервисах и фронтах.
- Integration: взаимодействие сервисов с БД/клиентами.
- E2E: ключевые флоу (auth, telemetry ingest → AI → alert → notification, billing guard, guardian dashboard).

## Что покрыть E2E (минимум)
1) Auth: регистрация/логин/refresh/roles.
2) Telemetry: POST /telemetry → событие → AI → RiskAlert → Alert/Integration.
3) Billing: ограничение доступа при отсутствии подписки.
4) Guardian dashboard: выдача данных телеметрии/алертов в FE.

## Генерация/данные
- Seed/фикстуры: использовать `database/migrations/*` и `tests` фикстуры (при наличии).
- Тестовая БД: отделить от prod/stage (см. `docker-compose.test.yml`).

## Репорты и качество
- Минимальная цель покрытия: 80%+ по критичным сервисам.
- Репорты coverage в CI артефакты (добавить в workflow при необходимости).

## CI
- `ci.yml` выполняет lint/test/build.
- Добавить публикацию coverage (например, `coverage/` как artifact) по мере необходимости.

