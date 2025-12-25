# Правильный запуск API Gateway

## Проблема
При запуске `nest start --watch` возникает ошибка:
```
Error: Cannot find module 'C:\projects\cursor_care-monitoring\api-gateway\dist\main'
```

## Причина
NestJS собирает проект в `dist/api-gateway/src/main.js`, но для запуска нужен файл `dist/main.js` как обертка. При использовании `nest start --watch` файл создается асинхронно после компиляции.

## Решение

### Вариант 1: Использовать npm скрипты (рекомендуется)

```powershell
cd C:\projects\cursor_care-monitoring\api-gateway
npm run start:dev
```

Этот скрипт автоматически:
1. Запускает `watch-main.js` для отслеживания изменений
2. Запускает `nest start --watch` для компиляции и запуска
3. Автоматически создает `dist/main.js` когда файл собран

### Вариант 2: Сначала собрать проект

```powershell
cd C:\projects\cursor_care-monitoring\api-gateway
npm run build
npm run start:dev
```

### Вариант 3: Создать файл вручную

Если файл не создается автоматически:

```powershell
cd C:\projects\cursor_care-monitoring\api-gateway
node scripts/ensure-main.js
```

Затем запустить:
```powershell
npm run start:dev
```

## Проверка

После запуска проверьте:

1. **Файл создан:**
   ```powershell
   Test-Path dist\main.js
   # Должно вернуть True
   ```

2. **Содержимое файла:**
   ```powershell
   Get-Content dist\main.js
   # Должно показать: require('./api-gateway/src/main.js');
   ```

3. **API Gateway запущен:**
   - В консоли должно появиться: `API Gateway is running on: http://localhost:3000`
   - Проверьте в браузере: `http://localhost:3000/api/v1/health`

## Структура файлов

После успешной сборки:
```
api-gateway/
├── dist/
│   ├── main.js                    # ← Обертка (создается автоматически)
│   └── api-gateway/
│       └── src/
│           └── main.js            # ← Реальный файл (создается NestJS)
```

## Troubleshooting

### Файл не создается автоматически
1. Убедитесь, что `dist/api-gateway/src/main.js` существует
2. Запустите вручную: `node scripts/ensure-main.js`
3. Проверьте права доступа к папке `dist`

### Ошибка при запуске watch-main.js
- Убедитесь, что Node.js установлен
- Проверьте, что скрипт существует: `Test-Path scripts\watch-main.js`

### NestJS не компилирует файлы
- Очистите dist: `Remove-Item -Recurse -Force dist`
- Пересоберите: `npm run build`
- Запустите: `npm run start:dev`

## Дополнительная информация

- Скрипт `watch-main.js` отслеживает изменения и автоматически создает обертку
- Скрипт `ensure-main.js` создает файл один раз (используется в prestart/postbuild hooks)
- `concurrently` используется для параллельного запуска watch-main и nest start

