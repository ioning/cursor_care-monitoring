# Запуск Docker Desktop

## Проблема

При попытке запустить инфраструктуру вы можете увидеть ошибку:

```
error during connect: Get "http://%2F%2F.%2Fpipe%2FdockerDesktopLinuxEngine/...": 
open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified.
```

Это означает, что **Docker Desktop не запущен**.

## Решение

### 1. Запустите Docker Desktop

- Откройте меню **Пуск** (Start)
- Найдите и запустите **Docker Desktop**
- Дождитесь полной инициализации (иконка Docker в системном трее перестанет мигать)

### 2. Проверьте, что Docker работает

```powershell
# Проверка статуса Docker
docker ps

# Если Docker запущен, вы увидите список контейнеров (может быть пустым)
# Если Docker не запущен, вы увидите ошибку подключения
```

### 3. Запустите инфраструктуру

После того, как Docker Desktop полностью запустится:

```powershell
npm run dev:infra
```

Это запустит:
- PostgreSQL (порт 5432)
- Redis (порт 6379)
- RabbitMQ (порт 5672)
- RabbitMQ Management UI (порт 15672)

### 4. Проверьте статус

```powershell
# Автоматическая проверка
.\scripts\check-services.ps1 -Type infra

# Или вручную
docker ps
```

## Автоматическая проверка

Скрипт `check-services.ps1` автоматически проверяет статус Docker:

```powershell
.\scripts\check-services.ps1 -Type infra
```

Если Docker не запущен, скрипт покажет предупреждение и инструкции.

## Дополнительная информация

- **RabbitMQ Management UI**: http://localhost:15672
  - Логин: `cms`
  - Пароль: `cms`

- **Проверка портов инфраструктуры**:
  ```powershell
  Test-NetConnection -ComputerName localhost -Port 5432  # PostgreSQL
  Test-NetConnection -ComputerName localhost -Port 6379  # Redis
  Test-NetConnection -ComputerName localhost -Port 5672   # RabbitMQ
  Test-NetConnection -ComputerName localhost -Port 15672  # RabbitMQ Management
  ```

## Остановка инфраструктуры

```powershell
npm run dev:infra:down
```

Или:

```powershell
cd infrastructure
docker-compose down
```

