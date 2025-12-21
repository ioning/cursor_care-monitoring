# API Gateway

## Запуск

### Для разработки (рекомендуется)
Используйте `nest start --watch`, который компилирует TypeScript на лету:

```bash
npm run dev
# или
npm run start:dev
# или
npm run start:watch
```

### Для продакшена
Сначала скомпилируйте проект, затем запустите:

```bash
npm run build
npm start
# или
npm run start:prod
```

## Важно

⚠️ **Не используйте `nest start` без `--watch`** - это вызовет ошибку "Cannot find module 'dist/main'", так как в монорепозитории файлы компилируются в `dist/api-gateway/src/main.js`, а не в `dist/main.js`.

Всегда используйте:
- `npm run dev` - для разработки с автоперезагрузкой
- `npm start` - для запуска скомпилированной версии (после `npm run build`)

