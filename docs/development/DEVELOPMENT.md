# Development Guide

Подробный процесс: `docs/development/development-workflow.md`. Ниже кратко.

- Стиль кода: TypeScript, NestJS, Vue 3, React Native; ESLint/Prettier.
- Workflow: feature-ветки → PR → review → CI.
- Тесты: jest; запускаются из корня (`npm test`) и покомпонентно.
- Монорепо: `shared/` (библиотеки, типы), `api-gateway/`, `microservices/`, `frontend/apps/`, `mobile/`.
- Локальный запуск: `npm run dev:all` (gateway + ms + все фронты), см. `package.json`.

