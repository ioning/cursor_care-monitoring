# Design: Dispatcher App

Код: `frontend/apps/dispatcher-app/` (Vue 3 + Vite + TS). Ключевые экраны:
- Login
- Dashboard (обзор вызовов/состояния SMP)
- Calls list & Call detail
- Map (расположение/маршруты)
- SMP flows (см. `docs/dispatcher/*.md`)

API: `src/api/*.ts`, state: Pinia (`src/stores/*`), realtime/hooks: `src/api/client.ts`.

