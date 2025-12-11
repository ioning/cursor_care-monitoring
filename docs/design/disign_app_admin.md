# Design: Admin App

Код: `frontend/apps/admin-app/` (Vue 3 + Vite + TS). Ключевые экраны:
- Dashboard (health, критичные алерты)
- Users (управление ролями)
- Billing/Analytics (подписки, метрики)
- Settings (feature flags, системные настройки)
- AI Models (регистрация/версии)

API: `src/api/*.ts`, state: Pinia (`src/stores/*`), realtime: `src/services/realtime.service.ts`.

