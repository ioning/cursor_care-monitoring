# Quickstart

Краткое руководство для быстрого старта. Для подробных инструкций смотрите:

- **[Инструкция по установке](INSTALLATION.md)** - Полная инструкция по установке всех зависимостей
- **[Инструкция по запуску](STARTUP.md)** - Подробная инструкция по запуску проекта
- **[Развертывание на сервере](PRODUCTION_DEPLOYMENT.md)** - Развертывание на production сервере

## Быстрый старт

```bash
# 1. Клонирование репозитория
git clone <repo> && cd care-monitoring

# 2. Установка зависимостей
npm run install:all
# или вручную: npm install в каждом каталоге

# 3. Создание .env файлов (из env.example)
# Windows (PowerShell):
Get-ChildItem -Recurse -Filter "env.example" | ForEach-Object {
    Copy-Item $_.FullName (Join-Path $_.DirectoryName ".env")
}

# Linux/macOS:
find . -name "env.example" -exec sh -c 'cp "$1" "${1%.example}"' _ {} \;

# 4. Запуск инфраструктуры (Postgres, Redis, RabbitMQ)
npm run dev:infra

# 5. Применение миграций базы данных
npm run db:migrate

# 6. Запуск всех сервисов (gateway + микросервисы + frontend)
npm run dev:all
```

## Проверка работоспособности

```bash
# Health check API Gateway
curl http://localhost:3000/health

# Откройте в браузере:
# - Guardian App: http://localhost:5173
# - Dispatcher App: http://localhost:5174
# - Admin App: http://localhost:5185
# - Landing App: http://localhost:5175
```

## Важно

- Все `.env` файлы создаются из `env.example` - не забудьте настроить их!
- **JWT_SECRET** должен быть одинаковым во всех сервисах
- Docker Desktop должен быть запущен перед запуском инфраструктуры

