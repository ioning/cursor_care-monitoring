# Инструкция по установке

Полная инструкция по установке всех зависимостей и настройке проекта Care Monitoring System.

## Системные требования

### Минимальные требования
- **ОС**: Windows 10 (версия 1903+) или Windows 11, Linux, macOS
- **CPU**: 4 ядра (64-bit процессор)
- **RAM**: 8 GB
- **Disk**: 20 GB свободного места
- **Интернет**: для загрузки зависимостей

### Рекомендуемые требования
- **ОС**: Windows 11 или Linux (Ubuntu 20.04+)
- **CPU**: 8+ ядер
- **RAM**: 16+ GB
- **Disk**: 100+ GB SSD

## Установка необходимого ПО

### 1. Node.js и npm

#### Windows
1. Скачайте LTS версию Node.js с [nodejs.org](https://nodejs.org/)
2. Запустите установщик
3. Убедитесь, что опция "Add to PATH" отмечена
4. Перезапустите терминал

**Проверка:**
```powershell
node --version  # Должно быть v18.x.x или выше
npm --version   # Должно быть 9.x.x или выше
```

#### Linux/macOS
```bash
# Через nvm (рекомендуется)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Проверка
node --version
npm --version
```

### 2. Docker и Docker Compose

#### Windows
1. Скачайте [Docker Desktop для Windows](https://www.docker.com/products/docker-desktop/)
2. Запустите установщик
3. Включите опцию "Use WSL 2 instead of Hyper-V" (рекомендуется)
4. Перезапустите компьютер
5. Запустите Docker Desktop из меню "Пуск"

#### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Перелогиньтесь для применения изменений группы
```

#### macOS
1. Скачайте [Docker Desktop для Mac](https://www.docker.com/products/docker-desktop/)
2. Установите и запустите

**Проверка:**
```bash
docker --version
docker compose version
docker run hello-world
```

### 3. Git

#### Windows
1. Скачайте Git с [git-scm.com](https://git-scm.com/download/win)
2. Запустите установщик с настройками по умолчанию

#### Linux
```bash
sudo apt-get update
sudo apt-get install git
```

#### macOS
```bash
# Через Homebrew
brew install git

# Или скачайте с git-scm.com
```

**Проверка:**
```bash
git --version
```

**Настройка Git (первый запуск):**
```bash
git config --global user.name "Ваше Имя"
git config --global user.email "your.email@example.com"
```

## Клонирование репозитория

```bash
# Перейдите в нужную директорию
cd C:\projects  # Windows
# или
cd ~/projects   # Linux/macOS

# Клонируйте репозиторий
git clone https://github.com/your-org/care-monitoring.git
cd care-monitoring
```

## Установка зависимостей проекта

### Автоматическая установка (рекомендуется)

#### Windows (PowerShell)
```powershell
# Настройка ExecutionPolicy (если требуется)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Запуск скрипта установки
.\scripts\install-all.ps1

# Или через npm
npm run install:all
```

#### Linux/macOS
```bash
chmod +x scripts/install-all.sh
./scripts/install-all.sh

# Или через npm
npm run install:all
```

**Время установки:** 10-20 минут (зависит от скорости интернета)

### Ручная установка

Если автоматическая установка не работает, выполните установку вручную:

```bash
# 1. Сначала установите shared пакет (обязательно!)
cd shared
npm install
cd ..

# 2. Установите realtime пакет
cd frontend/packages/realtime
npm install
cd ../../..

# 3. Установите api-gateway
cd api-gateway
npm install
cd ..

# 4. Установите каждый микросервис
cd microservices/auth-service && npm install && cd ../..
cd microservices/user-service && npm install && cd ../..
cd microservices/device-service && npm install && cd ../..
# ... и так далее для всех сервисов

# 5. Установите frontend приложения
cd frontend/apps/guardian-app && npm install && cd ../../..
cd frontend/apps/dispatcher-app && npm install && cd ../../..
cd frontend/apps/admin-app && npm install && cd ../../..
cd frontend/apps/landing-app && npm install && cd ../../..
```

## Настройка переменных окружения

### Создание .env файлов

Все `.env` файлы должны быть созданы из шаблонов `env.example`.

#### Автоматическое создание (PowerShell)
```powershell
# Создать все .env файлы из примеров
Get-ChildItem -Recurse -Filter "env.example" | ForEach-Object {
    $envFile = Join-Path $_.DirectoryName ".env"
    if (-not (Test-Path $envFile)) {
        Copy-Item $_.FullName $envFile
        Write-Host "Created: $envFile"
    }
}
```

#### Автоматическое создание (Bash)
```bash
# Создать все .env файлы из примеров
find . -name "env.example" -type f | while read f; do
    envFile="${f%.example}"
    if [ ! -f "$envFile" ]; then
        cp "$f" "$envFile"
        echo "Created: $envFile"
    fi
done
```

#### Ручное создание

Необходимо создать `.env` файлы для следующих компонентов:

- `infrastructure/.env`
- `api-gateway/.env`
- `microservices/auth-service/.env`
- `microservices/user-service/.env`
- `microservices/device-service/.env`
- `microservices/telemetry-service/.env`
- `microservices/alert-service/.env`
- `microservices/location-service/.env`
- `microservices/billing-service/.env`
- `microservices/integration-service/.env`
- `microservices/dispatcher-service/.env`
- `microservices/analytics-service/.env`
- `microservices/ai-prediction-service/.env`
- `microservices/organization-service/.env`
- `frontend/apps/guardian-app/.env`
- `frontend/apps/dispatcher-app/.env`
- `frontend/apps/admin-app/.env`
- `frontend/apps/landing-app/.env`

**Команда для копирования:**
```bash
# Windows (PowerShell)
Copy-Item infrastructure/env.example infrastructure/.env

# Linux/macOS
cp infrastructure/env.example infrastructure/.env
```

### Важные настройки

#### 1. JWT_SECRET

**КРИТИЧЕСКИ ВАЖНО:** `JWT_SECRET` должен быть **одинаковым** во всех сервисах, которые используют JWT:

- API Gateway
- Auth Service
- User Service
- Device Service
- Alert Service
- Location Service
- Billing Service
- Dispatcher Service
- Analytics Service

**Рекомендуемое значение для development:**
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
```

**ВНИМАНИЕ:** В production используйте криптографически стойкий случайный ключ длиной не менее 32 символов!

#### 2. Database настройки

В файле `infrastructure/.env`:
```env
POSTGRES_USER=cms_user
POSTGRES_PASSWORD=cms_password  # Измените на безопасный пароль!
POSTGRES_DB=care_monitoring
```

#### 3. RabbitMQ настройки

В файле `infrastructure/.env`:
```env
RABBITMQ_DEFAULT_USER=cms
RABBITMQ_DEFAULT_PASS=cms  # Измените на безопасный пароль!
```

## Проверка установки

### 1. Проверка версий

```bash
node --version    # v18.x.x или выше
npm --version     # 9.x.x или выше
docker --version
docker compose version
git --version
```

### 2. Проверка структуры проекта

```bash
# Должны существовать следующие директории
ls api-gateway
ls microservices
ls frontend
ls infrastructure
ls shared
```

### 3. Проверка установленных зависимостей

```bash
# Проверка нескольких ключевых компонентов
test -d shared/node_modules && echo "shared OK" || echo "shared MISSING"
test -d api-gateway/node_modules && echo "api-gateway OK" || echo "api-gateway MISSING"
test -d microservices/auth-service/node_modules && echo "auth-service OK" || echo "auth-service MISSING"
```

### 4. Проверка .env файлов

```bash
# Проверка наличия основных .env файлов
test -f infrastructure/.env && echo "infrastructure/.env OK" || echo "infrastructure/.env MISSING"
test -f api-gateway/.env && echo "api-gateway/.env OK" || echo "api-gateway/.env MISSING"
```

## Решение проблем

### Проблемы с Node.js

**Ошибка: "node: command not found"**
- Перезапустите терминал
- Проверьте PATH: `echo $PATH` (Linux/macOS) или `$env:PATH` (PowerShell)
- Переустановите Node.js с включенной опцией "Add to PATH"

### Проблемы с Docker

**Ошибка: "Cannot connect to Docker daemon"**
- Убедитесь, что Docker Desktop запущен (Windows/macOS)
- Проверьте статус: `docker ps`
- Перезапустите Docker Desktop

**Ошибка: "WSL 2 installation is incomplete" (Windows)**
```powershell
wsl --install
wsl --update
# Перезапустите компьютер
```

### Проблемы с PowerShell (Windows)

**Ошибка: "execution of scripts is disabled"**
```powershell
# Настройка ExecutionPolicy (от имени администратора)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Или для одной команды
powershell -ExecutionPolicy Bypass -File scripts/install-all.ps1
```

### Проблемы с npm

**Медленная установка пакетов**
```bash
# Используйте зеркало (если основное медленное)
npm config set registry https://registry.npmmirror.com

# Очистка кэша
npm cache clean --force
```

**Ошибка: "EPERM: operation not permitted"**
```bash
# Закройте все процессы, использующие node_modules
# Или удалите и переустановите
rm -rf node_modules
npm install
```

### Проблемы с путями (Windows)

**Ошибка: "Path too long"**

Включите длинные пути в Windows:
```powershell
# В PowerShell от имени администратора
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

Или используйте более короткие пути:
```powershell
# Установите проект ближе к корню диска
# Например: C:\dev\care-monitoring
```

## Следующие шаги

После успешной установки перейдите к инструкции по запуску проекта:

📖 [Инструкция по запуску проекта](STARTUP.md)

