# Quickstart

Детально: см. `README.md` и `docs/quickstart/multi-tenancy-setup.md`. Ниже короткая версия.

```
# Клонирование
git clone <repo> && cd care-monitoring

# Установка зависимостей
npm install

# Запуск инфраструктуры (Postgres, Redis, RabbitMQ)
npm run dev:infra

# Применить миграции
npm run db:migrate

# Запуск сервисов и фронтендов (gateway + ms + fe)
npm run dev:all
```

Env-файлы: скопируйте `env.example` → `.env` (или `.env.local`) в каждом сервисе/приложении.

