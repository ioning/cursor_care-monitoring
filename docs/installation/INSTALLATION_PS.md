# Инструкция по установке Care Monitoring System (PowerShell версия)

Пошаговая инструкция по установке всех зависимостей и настройке окружения для Windows PowerShell.

## 📋 Содержание

1. [Системные требования](#системные-требования)
2. [Установка Node.js и npm](#установка-nodejs-и-npm)
3. [Установка Docker](#установка-docker)
4. [Установка зависимостей проекта](#установка-зависимостей-проекта)
5. [Настройка окружения](#настройка-окружения)
6. [Проверка установки](#проверка-установки)

---

## Системные требования

### Минимальные требования

- **ОС**: Windows 10/11 (рекомендуется с WSL2)
- **CPU**: 4 ядра
- **RAM**: 8 GB
- **Disk**: 20 GB свободного места
- **Интернет**: для загрузки зависимостей

### Рекомендуемые требования

- **ОС**: Windows 11 (с WSL2)
- **CPU**: 8+ ядер
- **RAM**: 16+ GB
- **Disk**: 100+ GB SSD
- **Интернет**: стабильное соединение

---

## Установка Node.js и npm

### Windows (рекомендуемые способы)

#### Через официальный установщик

1. Скачайте LTS версию с [nodejs.org](https://nodejs.org/)
2. Запустите установщик
3. Следуйте инструкциям
4. Перезапустите терминал PowerShell

#### Через Chocolatey

```powershell
# Установка Chocolatey (если не установлен)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iwr https://community.chocolatey.org/install.ps1 -UseBasicParsing | iex

# Установка Node.js
choco install nodejs-lts

# Проверка
node --version
npm --version
```

#### Через Winget

```powershell
# Поиск доступных версий Node.js
winget search Microsoft.NodeJS

# Установка LTS версии
winget install Microsoft.NodeJS.LTS

# Проверка
node --version
npm --version
```

### Проверка установки

```powershell
node --version  # Должно быть v18.x.x или выше
npm --version   # Должно быть 9.x.x или выше
```

---

## Установка Docker

### Windows

1. Скачайте [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Запустите установщик
3. Следуйте инструкциям
4. Включите опцию "Use WSL 2 instead of Hyper-V" (рекомендуется)
5. Перезапустите компьютер

### Проверка установки Docker

```powershell
docker --version
docker compose version
docker run hello-world
```

### Настройка WSL 2 (рекомендуется)

```powershell
# Включение компонента WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Включение компонента Virtual Machine Platform
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Перезагрузка компьютера
Restart-Computer

# После перезагрузки установите WSL 2 ядро с:
# https://aka.ms/wsl2kernel

# Установите дистрибутив Linux (например, Ubuntu)
wsl --install -d Ubuntu

# Убедитесь, что WSL 2 используется по умолчанию
wsl --set-default-version 2
```

---

## Установка зависимостей проекта

### 1. Клонирование репозитория

```powershell
# Замените <repository-url> на реальный URL вашего репозитория
git clone https://github.com/your-username/care-monitoring.git
cd care-monitoring
```

### 2. Установка npm зависимостей

**Важно:** Проект использует `file:` протокол вместо workspaces для лучшей совместимости.

**Вариант A: Автоматическая установка (рекомендуется)**

```powershell
.\scripts\install-all.ps1
```

**Вариант B: Ручная установка**

```powershell
# 1. Сначала установите shared пакет (обязательно!)
Set-Location shared
npm install
Set-Location ..

# 2. Установите realtime пакет
Set-Location frontend/packages/realtime
npm install
Set-Location ../../..

# 3. Установите api-gateway
Set-Location api-gateway
npm install
Set-Location ..

# 4. Установите каждый микросервис
$services = @(
    "auth-service", "user-service", "device-service", "telemetry-service",
    "alert-service", "ai-prediction-service", "integration-service",
    "location-service", "billing-service", "analytics-service",
    "organization-service", "dispatcher-service"
)

foreach ($service in $services) {
    Write-Host "Installing $service..." -ForegroundColor Yellow
    Set-Location "microservices/$service"
    npm install
    Set-Location ../..
}

# 5. Установите frontend приложения
$apps = @("guardian-app", "admin-app", "dispatcher-app", "landing-app")
foreach ($app in $apps) {
    Write-Host "Installing $app..." -ForegroundColor Yellow
    Set-Location "frontend/apps/$app"
    npm install
    Set-Location ../../..
}
```

**Время установки:** 10-15 минут (зависит от скорости интернета)

**Примечание:** Каждый сервис имеет свои `node_modules`, что обеспечивает изоляцию зависимостей.

### 3. Проверка установки

```powershell
# Проверка структуры
Get-ChildItem

# Должны быть видны:
# - api-gateway/
# - microservices/
# - shared/
# - frontend/
# - node_modules/
# - package.json
```

---

## Настройка окружения

### 1. Создание файлов .env

```powershell
# Корневой .env (если файл .env.example существует)
if (Test-Path .env.example) {
    Copy-Item .env.example .env
} else {
    Write-Host "Файл .env.example не найден. Создайте .env файл вручную" -ForegroundColor Yellow
    New-Item -Path .env -ItemType File
}

# Инфраструктура
if (Test-Path infrastructure/env.example) {
    Copy-Item infrastructure/env.example infrastructure/.env
}

# API Gateway
if (Test-Path api-gateway/.env.example) {
    Copy-Item api-gateway/.env.example api-gateway/.env
}

# Каждый микросервис
$services = @(
    "auth-service", "user-service", "device-service", "telemetry-service",
    "alert-service", "location-service", "billing-service", "integration-service",
    "dispatcher-service", "analytics-service", "ai-prediction-service"
)

foreach ($service in $services) {
    $exampleFile = "microservices/$service/.env.example"
    $envFile = "microservices/$service/.env"
    if (Test-Path $exampleFile) {
        Copy-Item $exampleFile $envFile
        Write-Host "Создан $envFile"
    } else {
        Write-Host "Файл $exampleFile не найден" -ForegroundColor Yellow
    }
}
```

### 2. Настройка переменных

Отредактируйте `.env` файлы с вашими настройками:

```powershell
# Открыть основной .env в редакторе по умолчанию
Invoke-Item .env

# Или использовать VS Code (если установлен)
code .env
```

**Минимальные настройки для development:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password

REDIS_HOST=localhost
REDIS_PORT=6379

RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=cms
RABBITMQ_PASSWORD=cms

JWT_SECRET=dev-secret-change-in-production
```

---

## Проверка установки

### 1. Проверка версий

```powershell
# Node.js и npm
node --version
npm --version

# Docker
docker --version
docker compose version

# Git
git --version
```

### 2. Проверка структуры проекта

```powershell
# Должны существовать директории
Get-ChildItem -Directory | Where-Object { $_.Name -in @('api-gateway', 'microservices', 'shared', 'frontend', 'infrastructure') }

# Должны быть установлены зависимости
if (Test-Path node_modules) {
    Write-Host "Зависимости установлены успешно" -ForegroundColor Green
} else {
    Write-Host "Зависимости не установлены" -ForegroundColor Red
}
```

### 3. Проверка Docker

```powershell
# Запуск тестового контейнера
docker run hello-world

# Проверка Docker Compose
docker compose version
```

### 4. Проверка npm workspace

```powershell
# Список workspace
npm run --workspaces --silent echo

# Или
npm ls --workspaces --depth=0
```

---

## Следующие шаги

После успешной установки:

1. **Запустите инфраструктуру:**
   ```powershell
   npm run dev:infra
   ```

2. **Примените миграции:**
   ```powershell
   npm run db:migrate
   ```

3. **Запустите сервисы:**
   ```powershell
   npm run dev:all
   ```

4. **Стартуйте фронтенд‑приложения при необходимости (в отдельных терминалах PowerShell):**
   ```powershell
   # Терминал 1 - Guardian App
   cd frontend/apps/guardian-app; npm run dev        # http://localhost:5173

   # Терминал 2 - Dispatcher App  
   cd frontend/apps/dispatcher-app; npm run dev      # http://localhost:5174

   # Терминал 3 - Admin App
   cd frontend/apps/admin-app; npm run dev           # http://localhost:5185
   ```

**Подробная инструкция:** [../deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md)

---

## Troubleshooting (PowerShell)

### Проблемы с Node.js

**Ошибка: "node: command not found"**

```powershell
# Проверьте установку
Get-Command node

# Если не найдено, проверьте PATH
$env:PATH
```

**Неверная версия Node.js**

```powershell
# Используйте nvm-windows для управления версиями
# Скачайте с: https://github.com/coreybutler/nvm-windows

nvm install 18
nvm use 18
```

### Проблемы с Docker

**Ошибка: "Docker Desktop is not running"**

```powershell
# Запустите Docker Desktop
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

# Или проверьте статус
Get-Process -Name "Docker Desktop" -ErrorAction SilentlyContinue
```

**Ошибка прав доступа в WSL**

```powershell
# Проверьте WSL дистрибутивы
wsl --list --verbose

# Убедитесь, что используется WSL 2
wsl --set-version Ubuntu 2
```

### Проблемы с npm

**Ошибка: "Permission denied"**

```powershell
# Запустите PowerShell от имени администратора
Start-Process PowerShell -Verb RunAs

# Или исправьте права
npm config set prefix "$env:APPDATA\npm"
$env:Path += ";$env:APPDATA\npm"
```

**Медленная установка**

```powershell
# Используйте другой registry
npm config set registry https://registry.npmmirror.com

# Или используйте yarn
npm install -g yarn
yarn install
```

### Проблемы с зависимостями

**Ошибка: "Module not found"**

```powershell
# Очистка и переустановка
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

**Конфликты версий**

```powershell
# Обновление npm
npm install -g npm@latest

# Очистка кэша
npm cache clean --force
```

### Проблемы с путями в PowerShell

**Ошибки с символами "<", ">"**

```powershell
# Всегда используйте реальные значения вместо <placeholder>
# Неправильно:
git clone <repository-url>

# Правильно:
git clone https://github.com/username/repository.git
```

**Проблемы с кодировкой**

```powershell
# Установите правильную кодировку для PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

## Дополнительная помощь

- [../deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - Руководство по развертыванию
- [README.md](README.md) - Общая информация
- [docs/development/DEVELOPMENT.md](../development/DEVELOPMENT.md) - Руководство по разработке

---

**Последнее обновление:** 2025-11-18

```powershell
# Обновление npm
npm install -g npm@latest

# Очистка кэша
npm cache clean --force
```

### Проблемы с путями в PowerShell

**Ошибки с символами "<", ">"**

```powershell
# Всегда используйте реальные значения вместо <placeholder>
# Неправильно:
git clone <repository-url>

# Правильно:
git clone https://github.com/username/repository.git
```

**Проблемы с кодировкой**

```powershell
# Установите правильную кодировку для PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

## Дополнительная помощь

- [../deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - Руководство по развертыванию
- [README.md](README.md) - Общая информация
- [docs/development/DEVELOPMENT.md](../development/DEVELOPMENT.md) - Руководство по разработке

---

**Последнее обновление:** 2025-11-18

```powershell
# Обновление npm
npm install -g npm@latest

# Очистка кэша
npm cache clean --force
```

### Проблемы с путями в PowerShell

**Ошибки с символами "<", ">"**

```powershell
# Всегда используйте реальные значения вместо <placeholder>
# Неправильно:
git clone <repository-url>

# Правильно:
git clone https://github.com/username/repository.git
```

**Проблемы с кодировкой**

```powershell
# Установите правильную кодировку для PowerShell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

## Дополнительная помощь

- [../deployment/DEPLOYMENT.md](../deployment/DEPLOYMENT.md) - Руководство по развертыванию
- [README.md](README.md) - Общая информация
- [docs/development/DEVELOPMENT.md](../development/DEVELOPMENT.md) - Руководство по разработке

---

**Последнее обновление:** 2025-11-18