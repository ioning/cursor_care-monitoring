# Исправление проблемы с dist/main.js

## Проблема
API Gateway не может запуститься из-за отсутствия файла `dist/main.js`:
```
Error: Cannot find module 'C:\projects\cursor_care-monitoring\api-gateway\dist\main'
```

## Причина
NestJS собирает проект в `dist/api-gateway/src/main.js`, но для запуска нужен файл `dist/main.js` как обертка.

## Решение

### Автоматическое исправление
Скрипт `ensure-main.js` должен создавать обертку автоматически, но иногда нужно запустить его вручную:

```powershell
cd C:\projects\cursor_care-monitoring\api-gateway
node scripts/ensure-main.js
```

### Ручное создание
Если скрипт не работает, создайте файл `dist/main.js` вручную:

```javascript
require('./api-gateway/src/main.js');
```

### Проверка
Убедитесь, что файл создан:
```powershell
Test-Path dist\main.js
# Должно вернуть True
```

## Предотвращение проблемы

### Вариант 1: Запуск через npm скрипты
Всегда используйте npm скрипты, которые автоматически запускают `ensure-main`:

```powershell
npm run start:dev
# или
npm run dev
```

### Вариант 2: Сборка перед запуском
Если запускаете напрямую через `nest start`, сначала соберите проект:

```powershell
npm run build
npm run start:dev
```

### Вариант 3: Использование watch-main.js
Для автоматического обновления файла при изменениях можно использовать `watch-main.js`:

```powershell
node scripts/watch-main.js
```

## Структура файлов

После сборки структура должна быть:
```
api-gateway/
├── dist/
│   ├── main.js                    # ← Обертка (создается скриптом)
│   └── api-gateway/
│       └── src/
│           └── main.js            # ← Реальный файл (создается NestJS)
```

## Дополнительная информация

- Скрипт `ensure-main.js` запускается автоматически через `prestart` hook
- В режиме разработки (`nest start --watch`) файл может не создаваться сразу
- После первой компиляции файл должен появиться автоматически

