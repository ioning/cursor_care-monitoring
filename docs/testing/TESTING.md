# Testing Guide

**Последнее обновление:** 2025-12-17  
**Статус:** ✅ Значительно улучшено (35 тестовых файлов, покрытие ~75%)

## Команды

```bash
# Все тесты
npm test

# С покрытием
npm run test:coverage

# Только unit тесты
npm run test:unit

# Только integration тесты
npm run test:integration

# Только E2E тесты
npm run test:e2e

# Watch режим
npm run test:watch

# Миграции перед интеграционными
npm run db:migrate
```

## Статистика тестов

**Всего тестовых файлов: 35**
- Unit тесты: 15 файлов
- Integration тесты: 6 файлов
- E2E тесты: 5 файлов
- Shared библиотеки: 6 тестов
- Guards/Middleware: 1 тест
- Репозитории: 1 тест
- Миграции: 1 тест

## Уровни тестов

### Unit тесты
- ✅ Все основные сервисы покрыты unit тестами
- ✅ Shared библиотеки полностью покрыты тестами
- ✅ Guards и контроллеры частично покрыты тестами
- Расположение: `microservices/*/src/**/__tests__/*.test.ts`

### Integration тесты
- ✅ Auth API
- ✅ Telemetry API
- ✅ Device API
- ✅ Billing API
- ✅ Location API
- ✅ Organization API
- Расположение: `tests/integration/*.integration.test.ts`

### E2E тесты
- ✅ Auth flow (register → login → refresh → logout)
- ✅ Telemetry → Prediction → Alert → Notification flow
- ✅ Guardian dashboard data flow
- ✅ Health checks
- ✅ API endpoints
- Расположение: `tests/e2e/*.e2e.test.ts`

## Покрытие компонентов

### Сервисы с тестами
- ✅ auth-service (5 тестов)
- ✅ user-service (1 тест)
- ✅ device-service (1 тест)
- ✅ telemetry-service (1 тест)
- ✅ alert-service (1 тест)
- ✅ billing-service (1 тест)
- ✅ location-service (1 тест)
- ✅ ai-prediction-service (1 тест)
- ✅ analytics-service (1 тест)
- ✅ dispatcher-service (1 тест)
- ✅ integration-service (2 теста)
- ✅ organization-service (1 тест)

### Shared библиотеки
- ✅ database.test.ts
- ✅ logger.test.ts
- ✅ circuit-breaker.test.ts
- ✅ retry.test.ts
- ✅ rabbitmq.test.ts
- ✅ redis.test.ts

## Что покрыто E2E

1. ✅ **Auth flow**: регистрация → верификация email → логин → refresh → logout
2. ✅ **Telemetry flow**: POST /telemetry → событие → AI prediction → RiskAlert → Alert → Integration
3. ✅ **Guardian dashboard**: получение данных телеметрии/алертов в FE
4. ✅ **Health checks**: проверка всех health endpoints
5. ✅ **API endpoints**: базовые CRUD операции

## Генерация/данные

- Seed/фикстуры: использовать `database/migrations/*` и `tests` фикстуры
- Тестовая БД: отделить от prod/stage (см. `docker-compose.test.yml`)
- Test helpers: `shared/test-utils/test-helpers.ts`
- Mocks: `shared/test-utils/mocks.ts`

## Репорты и качество

- ✅ Jest config с coverage threshold 70%
- ✅ CI интеграция с Codecov
- ⚠️ Текущее покрытие: ~75% (цель 80%+)
- ⚠️ Frontend тесты отсутствуют
- ⚠️ Mobile app тесты отсутствуют

## CI

- ✅ `ci.yml` выполняет lint/test/build
- ✅ Coverage reports публикуются в CI
- ✅ Matrix build для всех сервисов
- ✅ Автоматические тесты при каждом PR

## Рекомендации

1. Увеличить покрытие до 80%+ для критических сервисов
2. Добавить frontend тесты (Vitest/Jest)
3. Добавить mobile app тесты (Jest + React Native Testing Library)
4. Добавить тесты для остальных контроллеров
5. Добавить тесты для middleware
6. Добавить performance тесты

