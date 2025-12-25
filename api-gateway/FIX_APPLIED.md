# Исправление проблемы с dist/main.js - ПРИМЕНЕНО

## Проблема
API Gateway не мог запуститься из-за ошибки:
```
Error: Cannot find module 'C:\projects\cursor_care-monitoring\api-gateway\dist\main'
```

## Причина
`nest start --watch` использует поле `"main"` из `package.json` для определения точки входа. Ранее оно указывало на `dist/main.js`, который создавался асинхронно скриптом `watch-main.js`, но `nest start` пытался запустить его до создания.

## Решение

### 1. Изменен `package.json`
- **Было**: `"main": "dist/main.js"`
- **Стало**: `"main": "dist/api-gateway/src/main.js"`

Теперь `nest start --watch` использует файл, который создается напрямую NestJS при компиляции.

### 2. Обновлен скрипт `start`
- **Было**: `"start": "node dist/main.js"`
- **Стало**: `"start": "node dist/api-gateway/src/main.js"`

### 3. Установлен `concurrently`
Для параллельного запуска `watch-main.js` и `nest start --watch` в режиме разработки.

### 4. Улучшены скрипты
- `ensure-main.js` - создает обертку `dist/main.js` (для обратной совместимости)
- `watch-main.js` - отслеживает изменения и автоматически создает обертку

## Использование

### Режим разработки (рекомендуется)
```powershell
cd C:\projects\cursor_care-monitoring\api-gateway
npm run start:dev
```

Этот скрипт:
1. Запускает `watch-main.js` для создания обертки `dist/main.js` (если нужна)
2. Запускает `nest start --watch` для компиляции и запуска

### Продакшн
```powershell
npm run build
npm start
```

## Проверка

После запуска проверьте:
1. API Gateway доступен: `http://localhost:3000/api/v1/health`
2. Swagger документация: `http://localhost:3000/api/docs`
3. Файл `dist/main.js` создан (для обратной совместимости)

## Структура файлов

```
api-gateway/
├── dist/
│   ├── main.js                    # ← Обертка (создается watch-main.js, опционально)
│   └── api-gateway/
│       └── src/
│           └── main.js            # ← Основной файл (используется nest start)
```

## Дополнительная информация

- `dist/main.js` теперь опционален - используется только для обратной совместимости
- Основной файл: `dist/api-gateway/src/main.js` (создается NestJS напрямую)
- `watch-main.js` продолжает работать для создания обертки, если она нужна

