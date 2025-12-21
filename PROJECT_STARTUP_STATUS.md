# Статус запуска проекта

**Дата:** 2025-12-19 23:20

## ✅ Выполнено

1. **Инфраструктура запущена:**
   - PostgreSQL (порт 5432) - ✅ Running
   - Redis (порт 6379) - ✅ Running
   - RabbitMQ (порт 5672) - ✅ Running

2. **Миграции БД применены:**
   - Все миграции для всех сервисов успешно применены

3. **Дефолтные пользователи созданы:**
   - ✅ `admin@care-monitoring.ru` / `14081979` (admin)
   - ✅ `test@example.com` / `Test1234!` (guardian)
   - ✅ `guardian@care-monitoring.ru` / `guardian123` (guardian)
   - ✅ `ward@care-monitoring.ru` / `ward123` (ward)
   - ✅ `dispatcher@care-monitoring.ru` / `dispatcher123` (dispatcher)
   - ✅ `org-admin@care-monitoring.ru` / `orgadmin123` (organization_admin)

4. **Сервисы запущены:**
   - ✅ API Gateway (порт 3000) - LISTENING
   - ✅ Auth Service (порт 3001) - LISTENING
   - ✅ User Service (порт 3002) - LISTENING
   - ✅ Device Service (порт 3003) - LISTENING
   - ✅ Telemetry Service (порт 3004) - LISTENING

## 🔍 Проверка авторизации

### Успешные логины:
- ✅ **admin** - `admin@care-monitoring.ru` / `14081979`
- ✅ **guardian** - `guardian@care-monitoring.ru` / `guardian123`

### Проблемы:
- ⚠️ **ward** - `ward@care-monitoring.ru` - 500 Internal Server Error
- ⚠️ **dispatcher** - `dispatcher@care-monitoring.ru` - Ошибка подключения
- ⚠️ **organization_admin** - `org-admin@care-monitoring.ru` - Ошибка подключения

## 📝 Примечания

1. Все дефолтные пользователи успешно созданы в базе данных через seed-скрипт
2. Основные сервисы (API Gateway, Auth, User, Device, Telemetry) запущены и слушают порты
3. Авторизация работает для ролей `admin` и `guardian`
4. Для ролей `ward`, `dispatcher` и `organization_admin` требуется дополнительная проверка и возможная настройка

## 🔍 Проверка запуска элементов

### Автоматическая проверка

```powershell
# Проверка всех элементов проекта
.\scripts\check-services.ps1

# Проверка только инфраструктуры
.\scripts\check-services.ps1 -Type infra

# Проверка только бэкенд сервисов
.\scripts\check-services.ps1 -Type backend

# Проверка только фронтенд приложений
.\scripts\check-services.ps1 -Type frontend

# Проверка конкретного сервиса
.\scripts\check-services.ps1 -Type service -ServiceName auth

# Проверка конкретного порта
.\scripts\check-services.ps1 -Type port -Port 3001
```

### Ручная проверка

Подробные инструкции по проверке отдельных элементов см. в [CHECKING_SERVICES.md](./docs/development/CHECKING_SERVICES.md)

## 🚀 Команды для управления

```bash
# Запуск всех сервисов
npm run dev:all

# Применение миграций
npm run db:migrate

# Создание дефолтных пользователей
npm run db:seed

# Остановка инфраструктуры
docker-compose -f infrastructure/docker-compose.yml down
```

## 📋 Дефолтные учетные данные

Полный список дефолтных пользователей см. в файле [DEFAULT_CREDENTIALS.md](./DEFAULT_CREDENTIALS.md)

