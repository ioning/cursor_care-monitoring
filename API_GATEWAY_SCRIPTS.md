# Скрипты для запуска API Gateway

## Доступные команды

### Из корня проекта

```powershell
npm run dev:gateway
```

Это запустит API Gateway с компиляцией и запуском один раз.

### Из директории api-gateway

```powershell
cd api-gateway

# Разработка с автоматической перезагрузкой
npm run dev

# Компиляция и запуск один раз
npm run start:dev

# Обычный запуск (без компиляции)
npm start

# Продакшн режим
npm run start:prod
```

## Разница между командами

### `npm run dev`
- Использует `nest start --watch`
- Автоматически перезагружает сервис при изменении файлов
- Удобно для активной разработки
- Не требует ручной перезагрузки

### `npm run start:dev`
- Компилирует TypeScript в JavaScript (`npm run build`)
- Запускает скомпилированный код один раз
- Подходит для проверки после изменений
- Требует ручной перезагрузки при изменениях

### `npm start`
- Запускает без компиляции
- Требует предварительной компиляции через `npm run build`
- Используется реже

## Рекомендации

Для разработки используйте:
```powershell
cd api-gateway
npm run dev
```

Это обеспечит автоматическую перезагрузку при изменениях кода.

## Проверка работы

После запуска API Gateway будет доступен на:
- **API**: http://localhost:3000
- **Health check**: http://localhost:3000/api/v1/health
- **Swagger документация**: http://localhost:3000/api/docs

Проверьте статус:
```powershell
.\scripts\check-services.ps1 -Type service -ServiceName api-gateway
```

