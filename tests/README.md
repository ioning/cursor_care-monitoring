# Тестирование

Руководство по тестированию проекта Care Monitoring System.

## Структура тестов

```
tests/
├── integration/          # Integration тесты
│   ├── auth.integration.test.ts
│   └── telemetry.integration.test.ts
└── e2e/                  # E2E тесты
    └── api.e2e.test.ts

microservices/
└── */src/**/__tests__/   # Unit тесты для каждого сервиса
```

## Запуск тестов

### Все тесты

```bash
npm test
```

### Unit тесты

```bash
npm run test:unit
```

### Integration тесты

```bash
npm run test:integration
```

### E2E тесты

```bash
npm run test:e2e
```

### С покрытием

```bash
npm run test:coverage
```

### В режиме watch

```bash
npm run test:watch
```

## Требования

### Переменные окружения

Создайте `.env.test` файл:

```env
TEST_DB_HOST=localhost
TEST_DB_PORT=5432
TEST_DB_NAME=test_db
TEST_DB_USER=cms_user
TEST_DB_PASSWORD=cms_password
TEST_REDIS_HOST=localhost
TEST_REDIS_PORT=6379
```

### Запуск тестовой инфраструктуры

```bash
docker-compose -f docker-compose.test.yml up -d
```

## Покрытие

Целевое покрытие: **70%**

Текущее покрытие можно проверить:

```bash
npm run test:coverage
```

Отчет будет в `coverage/` директории.

## Best Practices

1. **Unit тесты**
   - Тестируйте изолированно
   - Используйте моки для зависимостей
   - Быстрые тесты (< 100ms)

2. **Integration тесты**
   - Тестируйте взаимодействие компонентов
   - Используйте тестовую БД
   - Очищайте данные после тестов

3. **E2E тесты**
   - Тестируйте полные сценарии
   - Используйте реальную инфраструктуру
   - Медленные тесты допустимы

## Моки и утилиты

Используйте утилиты из `shared/test-utils/`:

- `test-helpers.ts` - генераторы тестовых данных
- `mocks.ts` - моки для зависимостей
- `setup.ts` - настройка тестового окружения

## Примеры

### Unit тест

```typescript
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('should login user', async () => {
    const result = await authService.login('email', 'password');
    expect(result).toHaveProperty('accessToken');
  });
});
```

### Integration тест

```typescript
import request from 'supertest';

describe('Auth API', () => {
  it('should register user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);
  });
});
```

## Troubleshooting

### Тесты не запускаются

1. Проверьте, что все зависимости установлены
2. Проверьте переменные окружения
3. Проверьте, что тестовая БД запущена

### Тесты падают

1. Проверьте логи
2. Проверьте подключение к БД
3. Проверьте моки

