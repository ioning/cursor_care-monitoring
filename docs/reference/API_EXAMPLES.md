# API Examples

Примеры использования API Care Monitoring System.

## Аутентификация

### Регистрация пользователя

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe",
    "phone": "+1234567890",
    "role": "guardian"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "guardian",
      "emailVerified": false
    }
  },
  "message": "Registration successful. Please check your email for verification code.",
  "requiresEmailVerification": true
}
```

### Вход в систему

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "fullName": "John Doe",
      "role": "guardian",
      "emailVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Обновление токена

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

### Получение текущего пользователя

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Управление подопечными

### Создание подопечного

```bash
curl -X POST http://localhost:3000/api/v1/users/wards \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Jane Doe",
    "dateOfBirth": "1950-01-01",
    "gender": "female",
    "medicalConditions": ["diabetes", "hypertension"]
  }'
```

### Получение списка подопечных

```bash
curl -X GET http://localhost:3000/api/v1/users/wards \
  -H "Authorization: Bearer TOKEN"
```

### Получение информации о подопечном

```bash
curl -X GET http://localhost:3000/api/v1/users/wards/{wardId} \
  -H "Authorization: Bearer TOKEN"
```

## Устройства

### Регистрация устройства

```bash
curl -X POST http://localhost:3000/api/v1/devices/register \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smart Watch 001",
    "deviceType": "watch",
    "serialNumber": "SW001234"
  }'
```

### Привязка устройства к подопечному

```bash
curl -X POST http://localhost:3000/api/v1/devices/{deviceId}/link \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wardId": "ward-uuid"
  }'
```

### Получение списка устройств

```bash
curl -X GET http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer TOKEN"
```

## Телеметрия

### Отправка телеметрии

```bash
curl -X POST http://localhost:3000/api/v1/telemetry \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "device-uuid",
    "wardId": "ward-uuid",
    "metricType": "heart_rate",
    "value": 75,
    "unit": "bpm",
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### Получение телеметрии

```bash
curl -X GET "http://localhost:3000/api/v1/telemetry?wardId={wardId}&limit=10&metricType=heart_rate" \
  -H "Authorization: Bearer TOKEN"
```

## Алерты

### Получение алертов

```bash
curl -X GET "http://localhost:3000/api/v1/alerts?wardId={wardId}&status=active" \
  -H "Authorization: Bearer TOKEN"
```

### Обновление статуса алерта

```bash
curl -X PATCH http://localhost:3000/api/v1/alerts/{alertId} \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolvedAt": "2024-01-15T10:35:00Z"
  }'
```

## Местоположение

### Отправка местоположения

```bash
curl -X POST http://localhost:3000/api/v1/locations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "wardId": "ward-uuid",
    "latitude": 55.7558,
    "longitude": 37.6173,
    "accuracy": 10,
    "timestamp": "2024-01-15T10:30:00Z"
  }'
```

### Получение последнего местоположения

```bash
curl -X GET "http://localhost:3000/api/v1/locations?wardId={wardId}&limit=1" \
  -H "Authorization: Bearer TOKEN"
```

## Биллинг

### Получение подписки

```bash
curl -X GET http://localhost:3000/api/v1/billing/subscription \
  -H "Authorization: Bearer TOKEN"
```

### Создание платежа

```bash
curl -X POST http://localhost:3000/api/v1/billing/payments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "RUB",
    "description": "Monthly subscription"
  }'
```

## Health Checks

### Проверка здоровья сервиса

```bash
curl -X GET http://localhost:3000/api/v1/health
```

**Ответ:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 3600,
  "service": "api-gateway"
}
```

### Readiness check

```bash
curl -X GET http://localhost:3000/api/v1/health/ready
```

### Liveness check

```bash
curl -X GET http://localhost:3000/api/v1/health/live
```

## Метрики

### Получение Prometheus метрик

```bash
curl -X GET http://localhost:3000/api/v1/metrics
```

## Обработка ошибок

### Примеры ошибок

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password must be longer than or equal to 8 characters"],
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

## Swagger документация

Интерактивная документация доступна по адресу:
- API Gateway: http://localhost:3000/api/docs
- Auth Service: http://localhost:3001/auth/docs
- User Service: http://localhost:3002/users/docs
- Device Service: http://localhost:3003/devices/docs
- Telemetry Service: http://localhost:3004/telemetry/docs
- Alert Service: http://localhost:3005/alerts/docs
- Location Service: http://localhost:3006/locations/docs
- Billing Service: http://localhost:3007/billing/docs
- Integration Service: http://localhost:3008/integration/docs
- Dispatcher Service: http://localhost:3009/dispatcher/docs
- Analytics Service: http://localhost:3010/analytics/docs
- AI Prediction Service: http://localhost:3011/ai-prediction/docs
- Organization Service: http://localhost:3012/organizations/docs

## Аутентификация в Swagger

Для тестирования защищенных endpoints в Swagger:

1. Откройте Swagger UI
2. Нажмите кнопку "Authorize"
3. Введите токен в формате: `Bearer YOUR_ACCESS_TOKEN`
4. Нажмите "Authorize" и "Close"

Теперь все запросы будут включать заголовок `Authorization: Bearer YOUR_ACCESS_TOKEN`.

