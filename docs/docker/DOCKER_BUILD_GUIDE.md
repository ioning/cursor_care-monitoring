# Руководство по сборке Docker образов

Это руководство описывает процесс сборки Docker образов для всех микросервисов системы Care Monitoring.

## Структура Dockerfile

Все Dockerfile используют multi-stage build для оптимизации размера образов:

1. **Builder stage**: Компиляция TypeScript и сборка проекта
2. **Production stage**: Только production зависимости и скомпилированный код

## Особенности

- ✅ Multi-stage build для минимизации размера
- ✅ Alpine Linux для уменьшения размера образа
- ✅ Non-root пользователь для безопасности
- ✅ Health checks для мониторинга
- ✅ Оптимизированное кэширование слоев

## Сборка образов

### Сборка из корня проекта

Все Dockerfile ожидают, что сборка выполняется из корня проекта:

```bash
# Из корня проекта
docker build -f api-gateway/Dockerfile -t care-monitoring/api-gateway:latest .
docker build -f microservices/auth-service/Dockerfile -t care-monitoring/auth-service:latest .
docker build -f microservices/user-service/Dockerfile -t care-monitoring/user-service:latest .
docker build -f microservices/device-service/Dockerfile -t care-monitoring/device-service:latest .
docker build -f microservices/telemetry-service/Dockerfile -t care-monitoring/telemetry-service:latest .
docker build -f microservices/alert-service/Dockerfile -t care-monitoring/alert-service:latest .
docker build -f microservices/location-service/Dockerfile -t care-monitoring/location-service:latest .
docker build -f microservices/billing-service/Dockerfile -t care-monitoring/billing-service:latest .
docker build -f microservices/integration-service/Dockerfile -t care-monitoring/integration-service:latest .
docker build -f microservices/dispatcher-service/Dockerfile -t care-monitoring/dispatcher-service:latest .
docker build -f microservices/analytics-service/Dockerfile -t care-monitoring/analytics-service:latest .
docker build -f microservices/ai-prediction-service/Dockerfile -t care-monitoring/ai-prediction-service:latest .
docker build -f microservices/organization-service/Dockerfile -t care-monitoring/organization-service:latest .
```

### Скрипт для автоматической сборки

Создайте скрипт `scripts/build-docker.sh`:

```bash
#!/bin/bash

set -e

SERVICES=(
  "api-gateway"
  "microservices/auth-service"
  "microservices/user-service"
  "microservices/device-service"
  "microservices/telemetry-service"
  "microservices/alert-service"
  "microservices/location-service"
  "microservices/billing-service"
  "microservices/integration-service"
  "microservices/dispatcher-service"
  "microservices/analytics-service"
  "microservices/ai-prediction-service"
  "microservices/organization-service"
)

VERSION=${1:-latest}

for service in "${SERVICES[@]}"; do
  service_name=$(basename $service)
  image_name="care-monitoring/${service_name}:${VERSION}"
  
  echo "🔨 Building ${image_name}..."
  docker build -f ${service}/Dockerfile -t ${image_name} .
  echo "✅ Built ${image_name}"
done

echo "🎉 All images built successfully!"
```

Использование:
```bash
chmod +x scripts/build-docker.sh
./scripts/build-docker.sh latest
./scripts/build-docker.sh 1.0.0
```

## Порты сервисов

| Сервис | Порт | Health Check |
|--------|------|--------------|
| API Gateway | 3000 | `/api/v1/health` |
| Auth Service | 3001 | `/auth/health` |
| User Service | 3002 | `/users/health` |
| Device Service | 3003 | `/devices/health` |
| Telemetry Service | 3004 | `/telemetry/health` |
| Alert Service | 3005 | `/alerts/health` |
| Location Service | 3006 | `/locations/health` |
| Billing Service | 3007 | `/billing/health` |
| Integration Service | 3008 | `/integration/health` |
| Dispatcher Service | 3009 | `/dispatcher/health` |
| Analytics Service | 3010 | `/analytics/health` |
| AI Prediction Service | 3011 | `/ai-prediction/health` |
| Organization Service | 3012 | `/organizations/health` |

## Запуск контейнеров

### Одиночный сервис

```bash
docker run -d \
  --name auth-service \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/auth_db \
  -e REDIS_HOST=redis \
  -e JWT_SECRET=your-secret \
  care-monitoring/auth-service:latest
```

### Docker Compose

Создайте `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    image: care-monitoring/api-gateway:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      - auth-service
      - user-service

  auth-service:
    image: care-monitoring/auth-service:latest
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://user:pass@postgres:5432/auth_db
    depends_on:
      - postgres
      - redis

  # ... остальные сервисы
```

## Оптимизация

### Размер образов

Типичные размеры образов:
- **Builder stage**: ~500-800 MB
- **Production stage**: ~150-250 MB

### Кэширование слоев

Dockerfile оптимизирован для кэширования:
1. Сначала копируются `package.json` файлы
2. Устанавливаются зависимости
3. Затем копируется исходный код
4. Это позволяет переиспользовать слои при изменении только кода

### Multi-stage build

Преимущества:
- Уменьшение размера финального образа
- Исключение dev зависимостей из production
- Более быстрая сборка при переиспользовании кэша

## Безопасность

### Non-root пользователь

Все контейнеры запускаются от пользователя `nodejs` (UID 1001) вместо root.

### Минимальные привилегии

- Только необходимые порты открыты
- Нет установки дополнительных пакетов в production stage
- Минимальный базовый образ (Alpine Linux)

### Health Checks

Все сервисы имеют health checks для мониторинга состояния:
- Интервал: 30 секунд
- Timeout: 3 секунды
- Start period: 40 секунд (время на запуск)
- Retries: 3

## Troubleshooting

### Проблема: Ошибка при сборке shared пакета

**Решение:** Убедитесь, что сборка выполняется из корня проекта и shared пакет существует.

### Проблема: Ошибка "Cannot find module @care-monitoring/shared"

**Решение:** Проверьте, что shared пакет правильно скопирован в `node_modules/@care-monitoring/shared/`.

### Проблема: Health check не проходит

**Решение:** 
1. Проверьте, что сервис запустился (логи контейнера)
2. Убедитесь, что health endpoint существует
3. Проверьте правильность порта в health check

### Проблема: Большой размер образа

**Решение:**
1. Проверьте `.dockerignore` файл
2. Убедитесь, что используется `npm ci --production`
3. Проверьте, что не копируются dev зависимости

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Build Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: |
          ./scripts/build-docker.sh ${{ github.sha }}
      
      - name: Push to registry
        run: |
          docker push care-monitoring/api-gateway:${{ github.sha }}
          # ... остальные сервисы
```

## Тестирование образов

### Локальное тестирование

```bash
# Сборка
docker build -f microservices/auth-service/Dockerfile -t test-auth .

# Запуск
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/auth_db \
  test-auth

# Проверка health
curl http://localhost:3001/auth/health
```

### Проверка размера

```bash
docker images | grep care-monitoring
```

## Рекомендации

1. **Тегирование**: Используйте семантическое версионирование
2. **Registry**: Используйте Docker Hub или приватный registry
3. **Сканирование**: Используйте `docker scan` для проверки уязвимостей
4. **Мониторинг**: Настройте мониторинг health checks
5. **Логирование**: Настройте централизованное логирование

## Дополнительные ресурсы

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Security scanning](https://docs.docker.com/engine/scan/)



Это руководство описывает процесс сборки Docker образов для всех микросервисов системы Care Monitoring.

## Структура Dockerfile

Все Dockerfile используют multi-stage build для оптимизации размера образов:

1. **Builder stage**: Компиляция TypeScript и сборка проекта
2. **Production stage**: Только production зависимости и скомпилированный код

## Особенности

- ✅ Multi-stage build для минимизации размера
- ✅ Alpine Linux для уменьшения размера образа
- ✅ Non-root пользователь для безопасности
- ✅ Health checks для мониторинга
- ✅ Оптимизированное кэширование слоев

## Сборка образов

### Сборка из корня проекта

Все Dockerfile ожидают, что сборка выполняется из корня проекта:

```bash
# Из корня проекта
docker build -f api-gateway/Dockerfile -t care-monitoring/api-gateway:latest .
docker build -f microservices/auth-service/Dockerfile -t care-monitoring/auth-service:latest .
docker build -f microservices/user-service/Dockerfile -t care-monitoring/user-service:latest .
docker build -f microservices/device-service/Dockerfile -t care-monitoring/device-service:latest .
docker build -f microservices/telemetry-service/Dockerfile -t care-monitoring/telemetry-service:latest .
docker build -f microservices/alert-service/Dockerfile -t care-monitoring/alert-service:latest .
docker build -f microservices/location-service/Dockerfile -t care-monitoring/location-service:latest .
docker build -f microservices/billing-service/Dockerfile -t care-monitoring/billing-service:latest .
docker build -f microservices/integration-service/Dockerfile -t care-monitoring/integration-service:latest .
docker build -f microservices/dispatcher-service/Dockerfile -t care-monitoring/dispatcher-service:latest .
docker build -f microservices/analytics-service/Dockerfile -t care-monitoring/analytics-service:latest .
docker build -f microservices/ai-prediction-service/Dockerfile -t care-monitoring/ai-prediction-service:latest .
docker build -f microservices/organization-service/Dockerfile -t care-monitoring/organization-service:latest .
```

### Скрипт для автоматической сборки

Создайте скрипт `scripts/build-docker.sh`:

```bash
#!/bin/bash

set -e

SERVICES=(
  "api-gateway"
  "microservices/auth-service"
  "microservices/user-service"
  "microservices/device-service"
  "microservices/telemetry-service"
  "microservices/alert-service"
  "microservices/location-service"
  "microservices/billing-service"
  "microservices/integration-service"
  "microservices/dispatcher-service"
  "microservices/analytics-service"
  "microservices/ai-prediction-service"
  "microservices/organization-service"
)

VERSION=${1:-latest}

for service in "${SERVICES[@]}"; do
  service_name=$(basename $service)
  image_name="care-monitoring/${service_name}:${VERSION}"
  
  echo "🔨 Building ${image_name}..."
  docker build -f ${service}/Dockerfile -t ${image_name} .
  echo "✅ Built ${image_name}"
done

echo "🎉 All images built successfully!"
```

Использование:
```bash
chmod +x scripts/build-docker.sh
./scripts/build-docker.sh latest
./scripts/build-docker.sh 1.0.0
```

## Порты сервисов

| Сервис | Порт | Health Check |
|--------|------|--------------|
| API Gateway | 3000 | `/api/v1/health` |
| Auth Service | 3001 | `/auth/health` |
| User Service | 3002 | `/users/health` |
| Device Service | 3003 | `/devices/health` |
| Telemetry Service | 3004 | `/telemetry/health` |
| Alert Service | 3005 | `/alerts/health` |
| Location Service | 3006 | `/locations/health` |
| Billing Service | 3007 | `/billing/health` |
| Integration Service | 3008 | `/integration/health` |
| Dispatcher Service | 3009 | `/dispatcher/health` |
| Analytics Service | 3010 | `/analytics/health` |
| AI Prediction Service | 3011 | `/ai-prediction/health` |
| Organization Service | 3012 | `/organizations/health` |

## Запуск контейнеров

### Одиночный сервис

```bash
docker run -d \
  --name auth-service \
  -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/auth_db \
  -e REDIS_HOST=redis \
  -e JWT_SECRET=your-secret \
  care-monitoring/auth-service:latest
```

### Docker Compose

Создайте `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    image: care-monitoring/api-gateway:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    depends_on:
      - auth-service
      - user-service

  auth-service:
    image: care-monitoring/auth-service:latest
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=postgresql://user:pass@postgres:5432/auth_db
    depends_on:
      - postgres
      - redis

  # ... остальные сервисы
```

## Оптимизация

### Размер образов

Типичные размеры образов:
- **Builder stage**: ~500-800 MB
- **Production stage**: ~150-250 MB

### Кэширование слоев

Dockerfile оптимизирован для кэширования:
1. Сначала копируются `package.json` файлы
2. Устанавливаются зависимости
3. Затем копируется исходный код
4. Это позволяет переиспользовать слои при изменении только кода

### Multi-stage build

Преимущества:
- Уменьшение размера финального образа
- Исключение dev зависимостей из production
- Более быстрая сборка при переиспользовании кэша

## Безопасность

### Non-root пользователь

Все контейнеры запускаются от пользователя `nodejs` (UID 1001) вместо root.

### Минимальные привилегии

- Только необходимые порты открыты
- Нет установки дополнительных пакетов в production stage
- Минимальный базовый образ (Alpine Linux)

### Health Checks

Все сервисы имеют health checks для мониторинга состояния:
- Интервал: 30 секунд
- Timeout: 3 секунды
- Start period: 40 секунд (время на запуск)
- Retries: 3

## Troubleshooting

### Проблема: Ошибка при сборке shared пакета

**Решение:** Убедитесь, что сборка выполняется из корня проекта и shared пакет существует.

### Проблема: Ошибка "Cannot find module @care-monitoring/shared"

**Решение:** Проверьте, что shared пакет правильно скопирован в `node_modules/@care-monitoring/shared/`.

### Проблема: Health check не проходит

**Решение:** 
1. Проверьте, что сервис запустился (логи контейнера)
2. Убедитесь, что health endpoint существует
3. Проверьте правильность порта в health check

### Проблема: Большой размер образа

**Решение:**
1. Проверьте `.dockerignore` файл
2. Убедитесь, что используется `npm ci --production`
3. Проверьте, что не копируются dev зависимости

## CI/CD интеграция

### GitHub Actions пример

```yaml
name: Build Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build images
        run: |
          ./scripts/build-docker.sh ${{ github.sha }}
      
      - name: Push to registry
        run: |
          docker push care-monitoring/api-gateway:${{ github.sha }}
          # ... остальные сервисы
```

## Тестирование образов

### Локальное тестирование

```bash
# Сборка
docker build -f microservices/auth-service/Dockerfile -t test-auth .

# Запуск
docker run -p 3001:3001 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/auth_db \
  test-auth

# Проверка health
curl http://localhost:3001/auth/health
```

### Проверка размера

```bash
docker images | grep care-monitoring
```

## Рекомендации

1. **Тегирование**: Используйте семантическое версионирование
2. **Registry**: Используйте Docker Hub или приватный registry
3. **Сканирование**: Используйте `docker scan` для проверки уязвимостей
4. **Мониторинг**: Настройте мониторинг health checks
5. **Логирование**: Настройте централизованное логирование

## Дополнительные ресурсы

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Security scanning](https://docs.docker.com/engine/scan/)







