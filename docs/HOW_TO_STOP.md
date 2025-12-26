# 🛑 Как остановить проект

## Остановка всех приложений целиком

### Способ 1: Через PowerShell (Windows)

```powershell
# Остановить все Node.js процессы
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Или остановить процессы на конкретных портах
Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012,5174,5175,5185 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

### Способ 2: Через терминалы (ручная остановка)

Если приложения запущены в отдельных терминалах:
- Нажмите `Ctrl+C` в каждом терминале
- Или закройте терминалы

### Способ 3: Через Task Manager (Windows)

1. Откройте Диспетчер задач (`Ctrl+Shift+Esc`)
2. Найдите процессы `node.exe`
3. Выберите все и нажмите "Завершить задачу"

### Способ 4: Через скрипт (рекомендуется)

```powershell
# Остановить все приложения
.\scripts\stop-all.ps1

# Или через npm:
npm run stop:all
```

### Способ 5: Через npm команды

```bash
# Остановить все
npm run stop:all

# Остановить только фронтенд
npm run stop:frontend

# Остановить только бэкенд
npm run stop:backend
```

---

## Частичная остановка

### Через скрипт (удобно):

```powershell
# Остановить только фронтенд
.\scripts\stop-all.ps1 -Frontend

# Остановить только бэкенд
.\scripts\stop-all.ps1 -Backend

# Остановить только API Gateway
.\scripts\stop-all.ps1 -Gateway

# Остановить только микросервисы (без Gateway)
.\scripts\stop-all.ps1 -Services

# Остановить конкретный порт
.\scripts\stop-all.ps1 -Port 3004
```

### Вручную через PowerShell:

### Остановить только фронтенд приложения

```powershell
# Остановить процессы на портах фронтенда
Get-NetTCPConnection -LocalPort 5174,5175,5185 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

**Или в терминалах:**
- Найдите терминалы с `npm run dev:guardian`, `npm run dev:dispatcher`, `npm run dev:admin`
- Нажмите `Ctrl+C` в каждом

### Остановить только бэкенд сервисы

```powershell
# Остановить процессы на портах микросервисов
Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

**Или в терминалах:**
- Найдите терминалы с `npm run dev:gateway`, `npm run dev:services`
- Нажмите `Ctrl+C` в каждом

### Остановить конкретный сервис

#### По порту:

```powershell
# Например, остановить API Gateway (порт 3000)
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# Или telemetry-service (порт 3004)
Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

#### По имени процесса:

```powershell
# Найти процесс по пути
Get-Process node | Where-Object { $_.Path -like "*telemetry-service*" } | Stop-Process -Force
```

### Остановить конкретное фронтенд приложение

```powershell
# Guardian App (порт 5174)
Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# Dispatcher App (порт 5175)
Get-NetTCPConnection -LocalPort 5175 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

---

## Проверка что остановлено

### Проверить какие порты заняты:

```powershell
# Все порты проекта
Get-NetTCPConnection -LocalPort 3000,3001,3002,3003,3004,3005,3006,3007,3008,3009,3010,3011,3012,5174,5175,5185 -ErrorAction SilentlyContinue | 
    Select-Object LocalPort, State, OwningProcess | Format-Table

# Или проверить конкретный порт
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
```

### Проверить запущенные Node.js процессы:

```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | 
    Select-Object Id, ProcessName, Path | Format-Table
```

---

## Порты проекта

### Бэкенд сервисы:
- **3000** - API Gateway
- **3001** - Auth Service
- **3002** - User Service
- **3003** - Device Service
- **3004** - Telemetry Service
- **3005** - Location Service
- **3006** - Alert Service
- **3007** - AI Prediction Service
- **3008** - Integration Service
- **3009** - Dispatcher Service
- **3010** - Billing Service
- **3011** - Analytics Service
- **3012** - Organization Service

### Фронтенд приложения:
- **5174** - Guardian App (было 5173)
- **5175** - Dispatcher App (было 5174) / Landing App
- **5185** - Admin App

---

## Полезные команды

### Найти процесс по порту:

```powershell
# Узнать какой процесс использует порт
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess
Get-Process -Id <PID> | Select-Object Id, ProcessName, Path
```

### Остановить процесс по ID:

```powershell
Stop-Process -Id <PID> -Force
```

### Остановить все процессы Node.js:

```powershell
Get-Process -Name node | Stop-Process -Force
```

---

## Рекомендации

1. **Перед остановкой:** Сохраните все несохраненные изменения
2. **После остановки:** Проверьте, что порты свободны перед повторным запуском
3. **При проблемах:** Используйте `-Force` для принудительной остановки
4. **Для разработки:** Останавливайте только нужные части проекта

---

## Примеры использования

### Остановить все и перезапустить:

```powershell
# Остановить все
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Подождать 2 секунды
Start-Sleep -Seconds 2

# Запустить заново
npm run dev:all
```

### Остановить только фронтенд, оставить бэкенд:

```powershell
# Остановить фронтенд
Get-NetTCPConnection -LocalPort 5174,5175,5185 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# Бэкенд продолжит работать
```

### Остановить конкретный сервис для перезапуска:

```powershell
# Остановить telemetry-service
Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue | 
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

# Запустить заново
npm run dev:telemetry
```

