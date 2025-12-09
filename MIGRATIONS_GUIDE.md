# Migrations Guide

Основное: `database/README.md`, миграции в `database/migrations/*`, запуск через `scripts/migrate.ts` / `scripts/migrate.js`.

## Запуск
```
npm run db:migrate        # apply
npm run db:migrate:up     # step up
npm run db:migrate:down   # rollback
```

## Где править
- SQL миграции разложены по сервисам в `database/migrations/<service>/`.
- При добавлении миграции — обновите соответствующий сервис (репозиторий/ORM), чтобы схема совпадала.

