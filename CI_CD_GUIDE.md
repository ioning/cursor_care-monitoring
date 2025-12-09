# CI/CD Guide

Полные детали: добавьте/уточните CI конфигурации (например, `.github/workflows/*`). Пока используйте обзор.

- Сборка/тесты: запуск unit/integration (`npm test`, `npm run test:coverage`).
- Линт/типизация: ESLint/TS при сборке сервисов и фронтов.
- Миграции: перед деплоем `npm run db:migrate`.
- Сборка образов: Dockerfile в каждом сервисе/приложении.
- Мониторинг/алерты: подключение к Prometheus/Alertmanager (см. `monitoring/`).

