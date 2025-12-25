# Статус сервисов Care Monitoring System

**Последнее обновление:** 25.12.2025 21:45

## ✅ Работающие сервисы (5/13)

1. **API Gateway** (порт 3000) - ✅ Работает
   - Health: http://localhost:3000/api/v1/health
   - Статус: Порт открыт, но health endpoint может быть недоступен

2. **Auth Service** (порт 3001) - ✅ Работает
   - Health: http://localhost:3001/auth/health

3. **Alert Service** (порт 3005) - ✅ Работает
   - Health: http://localhost:3005/alerts/health

4. **Billing Service** (порт 3007) - ✅ Работает
   - Health: http://localhost:3007/billing/health

5. **Dispatcher Service** (порт 3009) - ✅ Работает
   - Health: http://localhost:3009/dispatcher/health

## ❌ Не запущенные сервисы (8/13)

1. **User Service** (порт 3002) - ❌ Не запущен
   - Health: http://localhost:3002/users/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

2. **Device Service** (порт 3003) - ❌ Не запущен
   - Health: http://localhost:3003/devices/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

3. **Telemetry Service** (порт 3004) - ❌ Не запущен
   - Health: http://localhost:3004/telemetry/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

4. **Location Service** (порт 3006) - ❌ Не запущен
   - Health: http://localhost:3006/locations/health
   - ⚠️ **ВАЖНО**: Этот сервис критичен для работы геозон и отслеживания локаций
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

5. **Integration Service** (порт 3008) - ❌ Не запущен
   - Health: http://localhost:3008/integrations/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

6. **Analytics Service** (порт 3010) - ❌ Не запущен
   - Health: http://localhost:3010/analytics/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

7. **AI Prediction Service** (порт 3011) - ❌ Не запущен
   - Health: http://localhost:3011/ai-predictions/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

8. **Organization Service** (порт 3012) - ❌ Не запущен
   - Health: http://localhost:3012/organizations/health
   - **Действие:** Запущен в новом окне PowerShell, проверьте ошибки в окне

## Как проверить статус

Для проверки статуса всех сервисов можно использовать:

```powershell
# Запустите скрипт проверки
cd cursor_care-monitoring
powershell -ExecutionPolicy Bypass -File check-services.ps1
```

Или вручную проверьте порты:

```powershell
Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalPort,State | Sort-Object LocalPort | Format-Table
```

## Как запустить недостающие сервисы

Все сервисы были запущены в отдельных окнах PowerShell. Если они не запустились, проверьте ошибки в соответствующих окнах.

### Запуск отдельных сервисов:

```powershell
# В отдельных терминалах или через скрипт:
npm run dev:user          # User Service (3002)
npm run dev:device        # Device Service (3003)
npm run dev:telemetry     # Telemetry Service (3004)
npm run dev:location      # Location Service (3006)
npm run dev:integration   # Integration Service (3008)
npm run dev:analytics     # Analytics Service (3010)
npm run dev:ai-prediction # AI Prediction Service (3011)
npm run dev:organization  # Organization Service (3012)
```

## Исправленные проблемы

- ✅ Исправлена ошибка TypeScript в `api-gateway/src/controllers/telemetry.controller.ts` (строки 70-72) - добавлен тип `any` для объекта `transformed`

## Примечания

- **Location Service** критичен для работы функций геозон и отслеживания местоположения подопечных
- Все сервисы должны иметь доступ к:
  - PostgreSQL (порт 5432) ✅
  - Redis (порт 6379) ✅
  - RabbitMQ (порты 5672, 15672) ✅
- Инфраструктурные сервисы (PostgreSQL, Redis, RabbitMQ) работают через Docker Compose
