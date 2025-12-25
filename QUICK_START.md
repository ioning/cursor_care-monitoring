# Быстрый запуск для решения ошибки подключения

## Проблема
Ошибка `ERR_CONNECTION_REFUSED` на `localhost:3000` означает, что **API Gateway не запущен**.

## Решение

### Вариант 1: Запуск всех сервисов одновременно (рекомендуется)

Откройте **новое окно PowerShell** в корне проекта и выполните:

```powershell
npm run dev:all
```

Это запустит:
- ✅ API Gateway (порт 3000)
- ✅ Все микросервисы (auth, user, device, и т.д.)
- ✅ Frontend приложения

### Вариант 2: Запуск по отдельности

**Терминал 1 - API Gateway:**
```powershell
npm run dev:gateway
```

**Терминал 2 - Микросервисы:**
```powershell
npm run dev:services
```

**Терминал 3 - Frontend (опционально, если нужно):**
```powershell
npm run dev:frontend
```

## Проверка

После запуска подождите **15-30 секунд** и проверьте:

1. **API Gateway работает:**
   - Откройте в браузере: http://localhost:3000/api/v1/health
   - Должен вернуться JSON с `status: "ok"`

2. **WebSocket доступен:**
   - Ошибки WebSocket в консоли должны исчезнуть
   - Соединение должно установиться автоматически

## Важно

⚠️ **Перед запуском убедитесь, что:**

1. Docker Desktop запущен (для инфраструктуры: PostgreSQL, Redis, RabbitMQ)
   ```powershell
   docker ps
   ```
   Должны быть видны контейнеры `postgres`, `redis`, `rabbitmq`

2. Если Docker не запущен:
   ```powershell
   npm run dev:infra
   ```

3. Миграции применены:
   ```powershell
   npm run db:migrate
   ```

## Если ошибки продолжаются

1. Проверьте логи в терминале, где запущен API Gateway
2. Убедитесь, что порт 3000 свободен:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
   ```
3. Проверьте, что все зависимости установлены:
   ```powershell
   cd api-gateway
   npm install
   ```

