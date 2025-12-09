# Care Monitoring Admin App

Административная панель для Care Monitoring System. Реализует ключевые сценарии из `disign_app_admin.md`:

- **Реакция на системный инцидент**: раздел `Инциденты` с действиями SRE, таймлайном и контекстной панелью.
- **Анализ бизнес-метрик за месяц**: раздел `Аналитика` с KPI, динамикой MRR/ARR и популярностью функций.
- **Масштабное управление ролями**: раздел `Пользователи` с расширенными фильтрами, массовыми операциями и матрицей прав.

## Технологии

- Vue 3 + Vite
- Pinia с сохранением состояния
- Vue Router
- ApexCharts для визуализаций
- WebSocket-слой для live-метрик (см. `services/realtime.service.ts`)

## Запуск

```bash
cd frontend/apps/admin-app
npm install
npm run dev
```

По умолчанию приложение ожидает API на `http://localhost:3000/api/v1/admin`. Для работы без бекенда установите переменную `VITE_USE_MOCKS=true` в `.env`.

## Структура

- `src/api` — слой API с моками.
- `src/stores` — Pinia stores по доменам (system, users, analytics, incidents, billing, settings, ai-models).
- `src/components` — виджеты для дашбордов, таблиц, контекстных панелей.
- `src/views` — страницы для всех разделов из документа.

## Реалтайм

`realtime.service.ts` подключается к `VITE_WS_URL` (по умолчанию `ws://localhost:3000/ws/admin`) и пробрасывает события через composable `useRealtimeChannel`.

## Shortcut'ы

`useShortcuts` обрабатывает горячие клавиши (например, `Shift+H` обновляет системный дашборд). Определено в `src/composables/useShortcuts.ts`.

