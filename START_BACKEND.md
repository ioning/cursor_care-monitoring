# Инструкция по запуску бэкенда

## Проблема
Фронтенд не может подключиться к бэкенду на `localhost:3000` - сервер не запущен.

## Решение

### Вариант 1: Запуск всех сервисов (рекомендуется)

```powershell
# 1. Убедитесь, что инфраструктура запущена
cd C:\projects\cursor_care-monitoring
npm run dev:infra

# 2. Примените миграции БД (если еще не применены)
npm run db:migrate

# 3. Запустите все сервисы (API Gateway + микросервисы + фронтенд)
npm run dev:all
```

Эта команда запустит:
- API Gateway на порту 3000
- Все микросервисы (3001-3012)
- Все фронтенд приложения (5173-5176)

### Вариант 2: Запуск только API Gateway (для быстрого тестирования)

```powershell
cd C:\projects\cursor_care-monitoring\api-gateway

# Установите зависимости (если еще не установлены)
npm install

# Запустите API Gateway
npm run start:dev
```

API Gateway будет доступен на `http://localhost:3000`

### Вариант 3: Запуск через Docker Compose

```powershell
cd C:\projects\cursor_care-monitoring
docker-compose -f docker-compose.services.yml up -d
```

Это запустит все сервисы в Docker контейнерах.

## Проверка запуска

### Проверить, что API Gateway запущен:
```powershell
# Проверка порта
netstat -ano | findstr :3000

# Или проверка через браузер/curl
curl http://localhost:3000/api/v1/health
```

### Проверить статус всех сервисов:
```powershell
# Проверка Docker контейнеров
docker ps

# Проверка портов
netstat -ano | findstr "3000 3001 3002 3003 3004 3005"
```

## Настройка переменных окружения

Убедитесь, что в каждом сервисе есть файл `.env`:

1. **API Gateway**: `api-gateway/.env`
   - Скопируйте из `api-gateway/env.example`
   - Проверьте `PORT=3000`
   - Проверьте `CORS_ORIGIN` включает порт вашего фронтенда

2. **Микросервисы**: каждый должен иметь свой `.env` файл
   - Скопируйте из соответствующего `env.example`

## Решение проблем

### Порт 3000 занят
```powershell
# Найти процесс, использующий порт 3000
netstat -ano | findstr :3000

# Остановить процесс (замените PID на реальный)
taskkill /PID <PID> /F
```

### Ошибки подключения к БД
Убедитесь, что инфраструктура запущена:
```powershell
docker ps
# Должны быть запущены: postgres, redis, rabbitmq
```

### WebSocket не работает
Проверьте, что:
1. API Gateway запущен
2. В `api-gateway/.env` правильно настроен `CORS_ORIGIN`
3. Фронтенд использует правильный URL: `ws://localhost:3000/ws/admin`

## Быстрая проверка

После запуска проверьте:
1. ✅ API Gateway: http://localhost:3000/api/v1/health
2. ✅ WebSocket: попробуйте подключиться к `ws://localhost:3000/ws/admin`
3. ✅ Фронтенд: обновите страницу в браузере

## Дополнительная информация

- Полная документация: `README.md`
- Быстрый старт: `QUICKSTART.md`
- Статус сервисов: `FRONTEND_BACKEND_STATUS.md`

