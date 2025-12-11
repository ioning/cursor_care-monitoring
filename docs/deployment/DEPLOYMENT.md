# Deployment Guide

Полное руководство: `docs/deployment/deployment-guide.md`. Здесь — чек-листы и краткие шаги.

## Предварительные требования
- Docker + Docker Compose
- Node.js 18+ (для локальных скриптов и миграций)
- Скопировать `env.example` → `.env` для gateway, всех сервисов и фронтов; заполнить секреты.

## Локально (dev)
1) Поднять инфраструктуру: `npm run dev:infra`  
2) Установить зависимости: `npm install` (при необходимости `npm run install:all`)  
3) Применить миграции: `npm run db:migrate`  
4) Запуск сервисов/фронтов: `npm run dev:all`  
5) Health: http://localhost:3000/health

## Staging (чек-лист)
- Образы собраны и загружены в реестр (`docker-publish` workflow или вручную).
- `.env` для всех сервисов заполнены staging-секретами (JWT, DB, Redis, RabbitMQ, SMTP/SMS/Push).
- БД: создана/инициализирована, миграции применены: `npm run db:migrate`.
- Compose/оркестратор: `docker-compose.services.yml` (либо Helm/манифесты) задеплоен.
- Мониторинг: Prometheus/Grafana/Alertmanager/Loki подняты и конфигурированы.
- Health-check: gateway `/health`, сервисные health endpoints — зеленые.
- Бэкапы: включены для БД.

## Production (чек-лист)
- Образы помечены версиями (semver/commit sha) и загружены в prod-реестр.
- Секреты и ключи — только из секрет-хранилища (без .env в VCS).
- TLS/HTTPS на входе (ingress/reverse-proxy), HSTS/CSP/CORS настроены.
- DB/Redis/RabbitMQ — отказоустойчивые инстансы; бэкапы настроены и проверены.
- Миграции прогнаны на отдельном шаге деплоя (run migrations job).
- Rate limiting и защита от brute-force на gateway.
- Мониторинг и алерты активны (SLO/SLI по latency/error rate/queue depth/DB health).
- Логи в централизованное хранилище (Loki/ELK), correlation-id прокинут.
- Runbook и troubleshooting доступны on-call.

