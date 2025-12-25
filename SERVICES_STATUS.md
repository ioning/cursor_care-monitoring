# Статус сервисов Care Monitoring System

## ✅ Работающие сервисы (10/13)

1. **API Gateway** (порт 3000) - ✅ Работает
   - Health: http://localhost:3000/api/v1/health

2. **Auth Service** (порт 3001) - ✅ Работает
   - Health: http://localhost:3001/auth/health

3. **User Service** (порт 3002) - ✅ Работает
   - Health: http://localhost:3002/users/health

4. **Alert Service** (порт 3005) - ✅ Работает
   - Health: http://localhost:3005/alerts/health

5. **Billing Service** (порт 3007) - ✅ Работает
   - Health: http://localhost:3007/billing/health

6. **Integration Service** (порт 3008) - ✅ Работает
   - Health: http://localhost:3008/integrations/health

7. **Dispatcher Service** (порт 3009) - ✅ Работает
   - Health: http://localhost:3009/dispatcher/health

8. **Analytics Service** (порт 3010) - ✅ Работает
   - Health: http://localhost:3010/analytics/health

9. **AI Prediction Service** (порт 3011) - ✅ Работает
   - Health: http://localhost:3011/ai-predictions/health

## ❌ Не запущенные сервисы (4/13)

1. **Device Service** (порт 3003) - ❌ Не запущен
   - Health: http://localhost:3003/devices/health

2. **Telemetry Service** (порт 3004) - ❌ Не запущен
   - Health: http://localhost:3004/telemetry/health

3. **Location Service** (порт 3006) - ❌ Не запущен
   - Health: http://localhost:3006/locations/health
   - ⚠️ **ВАЖНО**: Этот сервис критичен для работы геозон и отслеживания локаций

4. **Organization Service** (порт 3012) - ❌ Не запущен
   - Health: http://localhost:3012/organizations/health

## Как запустить недостающие сервисы

### Вариант 1: Запустить все сервисы заново
```powershell
npm run dev:all
```

### Вариант 2: Запустить только недостающие сервисы
```powershell
# В отдельных терминалах:
npm run dev:device      # Device Service (3003)
npm run dev:telemetry   # Telemetry Service (3004)
npm run dev:location    # Location Service (3006)
npm run dev:organization # Organization Service (3012)
```

### Вариант 3: Проверить логи и перезапустить
Если сервисы завершились с ошибками, проверьте логи в терминале, где они запускались, и исправьте ошибки перед перезапуском.

## Проверка статуса

Для проверки статуса всех сервисов можно использовать:

```powershell
# Проверка портов
Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012 -ErrorAction SilentlyContinue | Select-Object LocalPort,State | Sort-Object LocalPort | Format-Table
```

## Примечания

- **Location Service** критичен для работы функций геозон и отслеживания местоположения подопечных
- Если Location Service не запущен, будут ошибки при получении локаций (ошибка 500 была исправлена, но сервис должен быть запущен)
- Все сервисы должны иметь доступ к:
  - PostgreSQL (порт 5432)
  - Redis (порт 6379)
  - RabbitMQ (порты 5672, 15672)

