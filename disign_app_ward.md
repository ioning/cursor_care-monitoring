# Design: Ward App

Код: `mobile/ward-app/` (React Native + TS). Ключевые флоу:
- Авторизация
- Отправка телеметрии (HR, шаги и т.п.) через API-клиент
- SOS/Distress кнопка (создание критичного события)
- Offline buffer + retry при восстановлении сети

UI: базовые экраны React Native; навигация — React Navigation; состояние — Redux Toolkit.

