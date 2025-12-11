# Docker Deployment Guide

## Предварительные требования
- Docker + Docker Compose
- Скопировать `env.example` → `.env` для `api-gateway` и всех сервисов/фронтов:
  - Bash: `find . -name "env.example" -type f -print0 | while IFS= read -r -d '' f; do cp "$f" "${f%/*}/.env"; done`
  - PowerShell: `Get-ChildItem -Recurse -Filter env.example | ForEach-Object { Copy-Item $_.FullName -Destination (Join-Path $_.DirectoryName ".env") -Force }`
  - Заполнить значения (секреты, строки подключения и т.д.).

## Вариант A: собрать локально и запустить
1) Сборка всех образов (по умолчанию registry префикс `care-monitoring`):
   - Bash: `./scripts/build-docker.sh latest`
   - PowerShell: `powershell -ExecutionPolicy Bypass -File scripts/build-docker.ps1 latest`
   - Кастомный реестр: `DOCKER_REGISTRY=myregistry.io/team ./scripts/build-docker.sh 1.0.0`
2) Поднять инфраструктуру + сервисы:
   ```
   docker-compose -f docker-compose.services.yml up --build -d
   ```
3) Применить миграции (если ещё не применены):
   ```
   npm run db:migrate
   ```
4) Проверка:
   - API Gateway health: http://localhost:3000/health
   - RabbitMQ UI: http://localhost:15672 (cms/cms)

Остановка/очистка:
```
docker-compose -f docker-compose.services.yml down
```

## Вариант B: использовать готовые образы из реестра
1) Установить переменную реестра (если нужно):
   - Bash: `export DOCKER_REGISTRY=myregistry.io/team`
   - PowerShell: `$env:DOCKER_REGISTRY="myregistry.io/team"`
2) Обновить `image:` секции в `docker-compose.services.yml` либо переопределить через `docker-compose -f docker-compose.services.yml pull`.
3) Запуск:
   ```
   docker-compose -f docker-compose.services.yml up -d
   ```

## Мониторинг/логирование
- Prometheus/Grafana/Loki/Alertmanager описаны в `monitoring/`. Поднять при необходимости дополнительным compose или добавить сервисы туда.

## Полезные команды
- Логи сервиса: `docker-compose -f docker-compose.services.yml logs -f api-gateway`
- Пересобрать один сервис: `docker-compose -f docker-compose.services.yml build api-gateway`
- Список контейнеров: `docker ps`
- Список образов: `docker images | grep care-monitoring`


