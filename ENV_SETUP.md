# Настройка переменных окружения (.env файлы)

## Проблема

При запуске сервисов вы можете увидеть ошибку:

```
Error: Required environment variable JWT_SECRET is not set
```

Это означает, что отсутствует файл `.env` или в нем не установлены необходимые переменные.

## Решение

### Автоматическое создание .env файлов

Создайте `.env` файлы из примеров для всех сервисов:

```powershell
# Из корня проекта
cd c:\projects\cursor_care-monitoring

# Для API Gateway
cd api-gateway
Copy-Item env.example .env

# Для каждого микросервиса
cd microservices\auth-service
Copy-Item env.example .env

cd ..\user-service
Copy-Item env.example .env

# И так далее для всех сервисов...
```

### Важно: JWT_SECRET должен совпадать

**Критически важно:** `JWT_SECRET` должен быть **одинаковым** во всех сервисах, которые используют JWT:

- API Gateway
- Auth Service
- User Service
- Device Service
- Alert Service
- Location Service
- Billing Service
- Dispatcher Service
- Analytics Service

### Рекомендуемое значение

Используйте безопасный секретный ключ длиной не менее 32 символов:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**ВНИМАНИЕ:** В production используйте криптографически стойкий случайный ключ!

### Проверка совпадения JWT_SECRET

Убедитесь, что `JWT_SECRET` одинаковый во всех `.env` файлах:

```powershell
# Проверить JWT_SECRET в API Gateway
Get-Content api-gateway\.env | Select-String "JWT_SECRET"

# Проверить JWT_SECRET в Auth Service
Get-Content microservices\auth-service\.env | Select-String "JWT_SECRET"

# Они должны совпадать!
```

## Быстрое решение

Если вы видите ошибку `JWT_SECRET is not set`:

1. **Создайте .env файл** (если его нет):
   ```powershell
   cd api-gateway
   Copy-Item env.example .env
   ```

2. **Проверьте значение JWT_SECRET**:
   ```powershell
   Get-Content .env | Select-String "JWT_SECRET"
   ```

3. **Если значение "please-change-me"**, обновите его:
   ```powershell
   (Get-Content .env) -replace 'JWT_SECRET=please-change-me', 'JWT_SECRET=your-super-secret-jwt-key-change-in-production' | Set-Content .env
   ```

4. **Убедитесь, что JWT_SECRET совпадает** во всех сервисах

5. **Перезапустите сервис**

## Список необходимых .env файлов

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

## Скрипт для создания всех .env файлов

Вы можете использовать скрипт для автоматического создания всех .env файлов:

```powershell
# Создать все .env файлы из примеров
Get-ChildItem -Recurse -Filter "env.example" | ForEach-Object {
    $envFile = $_.FullName -replace '\.example$', ''
    if (-not (Test-Path $envFile)) {
        Copy-Item $_.FullName $envFile
        Write-Host "Created: $envFile"
    } else {
        Write-Host "Already exists: $envFile"
    }
}
```

## Дополнительная информация

- Все `.env` файлы находятся в `.gitignore` и не коммитятся в репозиторий
- Используйте `.env.example` как шаблон для создания `.env` файлов
- В production используйте безопасные системы управления секретами (Kubernetes Secrets, AWS Secrets Manager, etc.)

## См. также

- [environment-variables.md](./docs/configuration/environment-variables.md) - Полная документация по переменным окружения

