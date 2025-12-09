# Руководство по развертыванию

Полное руководство по развертыванию системы Care Monitoring в различных окружениях.

## Предварительные требования

### Для локальной разработки

- Node.js 18+ и npm/yarn/pnpm
- Docker и Docker Compose
- PostgreSQL 14+ (или через Docker)
- Redis 7+ (или через Docker)
- RabbitMQ 3.12+ (или через Docker)

### Для production

- Kubernetes 1.24+ кластер
- Helm 3.0+ (опционально)
- Ingress controller (Nginx или Traefik)
- Cert-manager для SSL сертификатов
- Мониторинг: Prometheus + Grafana

## Локальное развертывание (Development)

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/your-org/care-monitoring.git
cd care-monitoring
```

### Шаг 2: Настройка переменных окружения

```bash
# Копирование примеров (Linux/macOS)
cp infrastructure/env.example infrastructure/.env

# Или в PowerShell (Windows)
Copy-Item infrastructure/env.example infrastructure/.env

# Редактирование .env файла
nano infrastructure/.env  # Linux/macOS
# или
notepad infrastructure/.env  # Windows
```

**Примечание:** Docker Compose автоматически загружает переменные из `.env` файла в той же директории. Все значения имеют дефолтные, но рекомендуется настроить их для production.

### Шаг 3: Запуск инфраструктуры

```bash
cd infrastructure
docker-compose up -d
```

Проверка статуса:
```bash
docker-compose ps
```

Доступные сервисы:
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- RabbitMQ Management: `http://localhost:15672` (cms/cms)

### Шаг 4: Применение миграций БД

```bash
# Из корня проекта
npm run db:migrate

# Применение seed-данных
npm run db:seed
```

### Шаг 5: Установка зависимостей

```bash
# Установка всех зависимостей (монорепо)
npm install

# Или с использованием workspaces
npm install --workspaces
```

### Шаг 6: Запуск сервисов

**Вариант 1: Запуск всех сервисов через npm scripts**

```bash
# Запуск всех микросервисов в dev режиме
npm run dev:services

# Запуск API Gateway
npm run dev:gateway

# Запуск frontend приложений
npm run dev:frontend
```

**Вариант 2: Запуск отдельных сервисов**

```bash
# Auth Service
cd microservices/auth-service
npm run start:dev

# User Service
cd microservices/user-service
npm run start:dev

# И т.д.
```

### Шаг 7: Проверка работоспособности

```bash
# Health check API Gateway
curl http://localhost:3000/health

# Health check сервисов
curl http://localhost:3001/health  # Auth
curl http://localhost:3002/health  # User
```

## Docker развертывание

### Сборка образов

```bash
# Сборка всех образов
docker-compose -f infrastructure/docker-compose.prod.yml build

# Или отдельные сервисы
docker build -t care-monitoring/api-gateway:latest -f api-gateway/Dockerfile .
docker build -t care-monitoring/auth-service:latest -f microservices/auth-service/Dockerfile .
```

### Запуск через Docker Compose

```bash
cd infrastructure
docker-compose -f docker-compose.prod.yml up -d
```

## Kubernetes развертывание (Production)

### Предварительная настройка

1. **Создание namespace**

```bash
kubectl create namespace care-monitoring
kubectl create namespace care-monitoring-monitoring
```

2. **Создание Secrets**

```bash
# Database secrets
kubectl create secret generic db-secrets \
  --from-literal=postgres-user=cms_user \
  --from-literal=postgres-password=$(openssl rand -base64 24) \
  --namespace=care-monitoring

# JWT secrets
kubectl create secret generic jwt-secrets \
  --from-literal=jwt-secret=$(openssl rand -base64 32) \
  --from-literal=jwt-refresh-secret=$(openssl rand -base64 32) \
  --namespace=care-monitoring

# Payment provider secrets
kubectl create secret generic payment-secrets \
  --from-literal=yookassa-shop-id=your-shop-id \
  --from-literal=yookassa-secret-key=your-secret-key \
  --namespace=care-monitoring
```

### Развертывание инфраструктуры

```bash
# PostgreSQL (через Helm или манифесты)
helm install postgresql bitnami/postgresql \
  --namespace care-monitoring \
  --set auth.postgresPassword=$(openssl rand -base64 24)

# Redis
helm install redis bitnami/redis \
  --namespace care-monitoring \
  --set auth.password=$(openssl rand -base64 24)

# RabbitMQ
helm install rabbitmq bitnami/rabbitmq \
  --namespace care-monitoring \
  --set auth.username=cms \
  --set auth.password=$(openssl rand -base64 24)
```

### Развертывание микросервисов

```bash
# Применение всех манифестов
kubectl apply -f infrastructure/k8s/namespaces/
kubectl apply -f infrastructure/k8s/configmaps/
kubectl apply -f infrastructure/k8s/secrets/
kubectl apply -f infrastructure/k8s/deployments/
kubectl apply -f infrastructure/k8s/services/
kubectl apply -f infrastructure/k8s/ingress/
```

### Проверка развертывания

```bash
# Статус подов
kubectl get pods -n care-monitoring

# Логи сервиса
kubectl logs -f deployment/api-gateway -n care-monitoring

# Проверка сервисов
kubectl get svc -n care-monitoring
```

## CI/CD Pipeline

### GitHub Actions

**Файл**: `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: care-monitoring/api-gateway:${{ github.sha }}

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=care-monitoring/api-gateway:${{ github.sha }} \
            -n care-monitoring-staging

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          kubectl set image deployment/api-gateway \
            api-gateway=care-monitoring/api-gateway:${{ github.sha }} \
            -n care-monitoring-production
```

## Миграции базы данных

### Применение миграций

```bash
# Локально
npm run db:migrate

# В Kubernetes
kubectl run db-migrate \
  --image=care-monitoring/migrate:latest \
  --restart=Never \
  --env="DATABASE_URL=postgresql://..." \
  --namespace=care-monitoring
```

### Откат миграций

```bash
npm run db:migrate:rollback
```

### Создание новой миграции

```bash
npm run db:migrate:create -- --name=add-new-feature
```

## Резервное копирование

### Автоматическое резервное копирование

**Скрипт**: `infrastructure/scripts/backup.sh`

```bash
#!/bin/bash
# Ежедневное резервное копирование всех БД

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Резервное копирование каждой БД
for DB in auth_db user_db device_db telemetry_db; do
  pg_dump -h postgres -U cms_user $DB > "$BACKUP_DIR/${DB}_${DATE}.sql"
done

# Сжатие
tar -czf "$BACKUP_DIR/backup_${DATE}.tar.gz" "$BACKUP_DIR/*_${DATE}.sql"

# Удаление старых бэкапов (старше 30 дней)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +30 -delete
```

### Восстановление из бэкапа

```bash
# Распаковка
tar -xzf backup_20240115_120000.tar.gz

# Восстановление БД
psql -h postgres -U cms_user auth_db < auth_db_20240115_120000.sql
```

## Мониторинг и логирование

### Настройка Prometheus

```bash
# Применение конфигурации Prometheus
kubectl apply -f monitoring/prometheus/

# Проверка сбора метрик
curl http://prometheus:9090/api/v1/targets
```

### Настройка Grafana

```bash
# Импорт дашбордов
kubectl apply -f monitoring/grafana/dashboards/

# Доступ к Grafana
kubectl port-forward svc/grafana 3000:3000 -n care-monitoring-monitoring
```

### Настройка Loki

```bash
# Применение конфигурации Loki
kubectl apply -f monitoring/loki/
```

## Масштабирование

### Горизонтальное масштабирование

```bash
# Увеличение количества реплик
kubectl scale deployment/api-gateway --replicas=3 -n care-monitoring
kubectl scale deployment/telemetry-service --replicas=5 -n care-monitoring
```

### Автоматическое масштабирование (HPA)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: care-monitoring
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Обновление системы

### Rolling Update

```bash
# Обновление образа
kubectl set image deployment/api-gateway \
  api-gateway=care-monitoring/api-gateway:v1.2.0 \
  -n care-monitoring

# Проверка статуса обновления
kubectl rollout status deployment/api-gateway -n care-monitoring

# Откат при проблемах
kubectl rollout undo deployment/api-gateway -n care-monitoring
```

### Blue-Green Deployment

```bash
# Развертывание новой версии (green)
kubectl apply -f infrastructure/k8s/deployments/api-gateway-green.yml

# Переключение трафика
kubectl patch service api-gateway \
  -p '{"spec":{"selector":{"version":"green"}}}' \
  -n care-monitoring
```

## Troubleshooting

### Проблемы с подключением к БД

```bash
# Проверка подключения
kubectl exec -it deployment/api-gateway -n care-monitoring -- \
  psql $DATABASE_URL -c "SELECT 1"

# Проверка логов
kubectl logs deployment/api-gateway -n care-monitoring | grep -i database
```

### Проблемы с RabbitMQ

```bash
# Проверка очередей
kubectl exec -it deployment/rabbitmq -n care-monitoring -- \
  rabbitmqctl list_queues

# Проверка соединений
kubectl exec -it deployment/rabbitmq -n care-monitoring -- \
  rabbitmqctl list_connections
```

### Проблемы с производительностью

```bash
# Проверка использования ресурсов
kubectl top pods -n care-monitoring

# Анализ метрик
kubectl port-forward svc/prometheus 9090:9090 -n care-monitoring-monitoring
# Открыть http://localhost:9090
```

## Чеклист развертывания

- [ ] Настроены все переменные окружения
- [ ] Применены миграции БД
- [ ] Применены seed-данные (для dev/staging)
- [ ] Настроены Secrets в Kubernetes
- [ ] Развернута инфраструктура (PostgreSQL, Redis, RabbitMQ)
- [ ] Развернуты все микросервисы
- [ ] Настроен Ingress и SSL
- [ ] Настроен мониторинг (Prometheus, Grafana)
- [ ] Настроено логирование (Loki)
- [ ] Настроены алерты (Alertmanager)
- [ ] Проведено тестирование всех endpoints
- [ ] Проверена работа WebSocket соединений
- [ ] Настроено резервное копирование
- [ ] Документированы процедуры восстановления

