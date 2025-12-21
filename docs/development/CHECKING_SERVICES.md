# Проверка запуска отдельных элементов проекта

Это руководство поможет вам проверить статус запуска различных компонентов системы Care Monitoring.

## Быстрая проверка

### Автоматическая проверка всех элементов

```powershell
# Из корня проекта
.\scripts\check-services.ps1
```

Или с указанием типа проверки:

```powershell
# Только инфраструктура
.\scripts\check-services.ps1 -Type infra

# Только бэкенд сервисы
.\scripts\check-services.ps1 -Type backend

# Только фронтенд приложения
.\scripts\check-services.ps1 -Type frontend

# Конкретный сервис
.\scripts\check-services.ps1 -Type service -ServiceName auth

# Конкретный порт
.\scripts\check-services.ps1 -Type port -Port 3001
```

## Ручная проверка элементов

### 1. Инфраструктура

#### PostgreSQL (порт 5432)

```powershell
# Проверка порта
Test-NetConnection -ComputerName localhost -Port 5432

# Проверка через Docker
docker ps | Select-String postgres
```

#### Redis (порт 6379)

```powershell
# Проверка порта
Test-NetConnection -ComputerName localhost -Port 6379

# Проверка через Docker
docker ps | Select-String redis
```

#### RabbitMQ (порт 5672)

```powershell
# Проверка порта
Test-NetConnection -ComputerName localhost -Port 5672

# Проверка веб-интерфейса (порт 15672)
Invoke-WebRequest -Uri "http://localhost:15672" -UseBasicParsing
```

**Учетные данные RabbitMQ:**
- Логин: `cms`
- Пароль: `cms`

### 2. Бэкенд сервисы

Все микросервисы имеют health check endpoints на пути `/health` (кроме API Gateway, который использует `/api/v1/health`).

#### API Gateway (порт 3000)

```powershell
# Health check
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" | Select-Object StatusCode, Content

# Swagger документация
Start-Process "http://localhost:3000/api/docs"
```

#### Микросервисы (порты 3001-3012)

```powershell
# Auth Service (3001)
Invoke-WebRequest -Uri "http://localhost:3001/health"

# User Service (3002)
Invoke-WebRequest -Uri "http://localhost:3002/health"

# Device Service (3003)
Invoke-WebRequest -Uri "http://localhost:3003/health"

# Telemetry Service (3004)
Invoke-WebRequest -Uri "http://localhost:3004/health"

# Alert Service (3005)
Invoke-WebRequest -Uri "http://localhost:3005/health"

# Location Service (3006)
Invoke-WebRequest -Uri "http://localhost:3006/health"

# Billing Service (3007)
Invoke-WebRequest -Uri "http://localhost:3007/health"

# Integration Service (3008)
Invoke-WebRequest -Uri "http://localhost:3008/health"

# Dispatcher Service (3009)
Invoke-WebRequest -Uri "http://localhost:3009/health"

# Analytics Service (3010)
Invoke-WebRequest -Uri "http://localhost:3010/health"

# AI Prediction Service (3011)
Invoke-WebRequest -Uri "http://localhost:3011/health"

# Organization Service (3012)
Invoke-WebRequest -Uri "http://localhost:3012/health"
```

#### Формат ответа health check

```json
{
  "status": "healthy",
  "timestamp": "2025-12-19T23:20:00.000Z",
  "service": "auth-service",
  "checks": {
    "database": "up",
    "redis": "up",
    "rabbitmq": "up"
  }
}
```

### 3. Фронтенд приложения

#### Guardian App (порт 5173)

```powershell
# Проверка доступности
Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing

# Открыть в браузере
Start-Process "http://localhost:5173"
```

#### Dispatcher App (порт 5174)

```powershell
Invoke-WebRequest -Uri "http://localhost:5174" -UseBasicParsing
Start-Process "http://localhost:5174"
```

#### Admin App (порт 5175)

```powershell
Invoke-WebRequest -Uri "http://localhost:5175" -UseBasicParsing
Start-Process "http://localhost:5175"
```

#### Landing App (порт 5176)

```powershell
Invoke-WebRequest -Uri "http://localhost:5176" -UseBasicParsing
Start-Process "http://localhost:5176"
```

## Проверка процессов

### Количество Node.js процессов

```powershell
Get-Process -Name node | Measure-Object | Select-Object Count
```

### Процессы на конкретных портах

```powershell
# Все слушающие порты в диапазоне 3000-3100
Get-NetTCPConnection -State Listen | Where-Object { 
    $_.LocalPort -ge 3000 -and $_.LocalPort -le 3100 
} | Select-Object LocalPort, State, OwningProcess | Format-Table

# Процесс на конкретном порту
$port = 3001
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connection) {
    Get-Process -Id $connection.OwningProcess
}
```

### Docker контейнеры

```powershell
# Список всех контейнеров
docker ps

# Статус инфраструктуры
docker-compose -f infrastructure/docker-compose.yml ps
```

## Запуск отдельных элементов

### Инфраструктура

```powershell
# Запуск
npm run dev:infra

# Остановка
npm run dev:infra:down
```

### Отдельные сервисы

```powershell
# API Gateway
npm run dev:gateway

# Auth Service
npm run dev:auth

# User Service
npm run dev:user

# Device Service
npm run dev:device

# Telemetry Service
npm run dev:telemetry

# Alert Service
npm run dev:alert

# Location Service
npm run dev:location

# Billing Service
npm run dev:billing

# Integration Service
npm run dev:integration

# Dispatcher Service
npm run dev:dispatcher-service

# Analytics Service
npm run dev:analytics

# AI Prediction Service
npm run dev:ai-prediction

# Organization Service
npm run dev:organization
```

### Все бэкенд сервисы

```powershell
npm run dev:services
```

### Фронтенд приложения

```powershell
# Guardian App
npm run dev:guardian

# Dispatcher App
npm run dev:dispatcher

# Admin App
npm run dev:admin

# Landing App
npm run dev:landing

# Все фронтенд приложения
npm run dev:frontend
```

### Все элементы сразу

```powershell
npm run dev:all
```

## Диагностика проблем

### Сервис не отвечает на health check

**Возможные причины:**
1. Сервис еще компилируется (первый запуск может занять 1-2 минуты)
2. Ошибки при компиляции TypeScript
3. Ошибки подключения к БД
4. Отсутствие .env файлов
5. Порт занят другим процессом

**Решение:**
1. Подождите 1-2 минуты для полной инициализации
2. Проверьте логи в консоли, где запущен сервис
3. Убедитесь, что все .env файлы созданы
4. Проверьте подключение к БД: `docker ps | Select-String postgres`
5. Проверьте, не занят ли порт: `Get-NetTCPConnection -LocalPort <порт>`

### Порт занят

```powershell
# Найти процесс на порту
$port = 3000
$connection = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($connection) {
    $process = Get-Process -Id $connection.OwningProcess
    Write-Host "Порт $port занят процессом: $($process.Name) (PID: $($process.Id))"
    
    # Остановить процесс (осторожно!)
    # Stop-Process -Id $process.Id
}
```

### Ошибки компиляции

```powershell
# Пересобрать один сервис
cd microservices/auth-service
npm run build

# Или пересобрать все
cd C:\projects\cursor_care-monitoring
# (если есть скрипт build:all)
```

### Проверка логов

Логи сервисов выводятся в консоль, где была запущена команда. Для каждого сервиса можно запустить отдельный терминал:

```powershell
# В отдельном терминале для каждого сервиса
cd microservices/auth-service
npm run start:dev
```

## Таблица портов

| Компонент | Порт | Health Endpoint | Команда запуска |
|-----------|------|-----------------|-----------------|
| API Gateway | 3000 | `/api/v1/health` | `npm run dev:gateway` |
| Auth Service | 3001 | `/health` | `npm run dev:auth` |
| User Service | 3002 | `/health` | `npm run dev:user` |
| Device Service | 3003 | `/health` | `npm run dev:device` |
| Telemetry Service | 3004 | `/health` | `npm run dev:telemetry` |
| Alert Service | 3005 | `/health` | `npm run dev:alert` |
| Location Service | 3006 | `/health` | `npm run dev:location` |
| Billing Service | 3007 | `/health` | `npm run dev:billing` |
| Integration Service | 3008 | `/health` | `npm run dev:integration` |
| Dispatcher Service | 3009 | `/health` | `npm run dev:dispatcher-service` |
| Analytics Service | 3010 | `/health` | `npm run dev:analytics` |
| AI Prediction Service | 3011 | `/health` | `npm run dev:ai-prediction` |
| Organization Service | 3012 | `/health` | `npm run dev:organization` |
| Guardian App | 5173 | `/` | `npm run dev:guardian` |
| Dispatcher App | 5174 | `/` | `npm run dev:dispatcher` |
| Admin App | 5175 | `/` | `npm run dev:admin` |
| Landing App | 5176 | `/` | `npm run dev:landing` |
| PostgreSQL | 5432 | - | `docker-compose up -d` |
| Redis | 6379 | - | `docker-compose up -d` |
| RabbitMQ | 5672 | - | `docker-compose up -d` |
| RabbitMQ Management | 15672 | `/` | `docker-compose up -d` |

## Полезные скрипты

### Проверка всех элементов одной командой

```powershell
.\scripts\check-services.ps1
```

### Проверка интеграции фронтенд-бэкенд

```powershell
.\test-frontend-backend.ps1
```

## См. также

- [PROJECT_STARTUP_STATUS.md](../PROJECT_STARTUP_STATUS.md) - Текущий статус запуска проекта
- [SERVICES_STATUS.md](../SERVICES_STATUS.md) - Детальный статус сервисов
- [QUICKSTART.md](../QUICKSTART.md) - Быстрый старт проекта

