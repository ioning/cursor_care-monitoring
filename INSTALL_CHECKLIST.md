# Installation Checklist

> Статусы обновляются по мере выполнения `npm install` в каждом важном пакете монорепозитория.

## Корень
- [x] `.` — `npm install` ✅

## Общие сервисы
- [⚠️] `api-gateway` — `npm install` (проблема с symlink на Windows, node_modules существует)
- [x] `shared` — `npm install` ✅

## Микросервисы
- [⚠️] `microservices/ai-prediction-service` — `npm install` (проблема с symlink)
- [ ] `microservices/alert-service` — `npm install` ❌
- [ ] `microservices/analytics-service` — `npm install` ❌
- [x] `microservices/auth-service` — `npm install` ✅
- [ ] `microservices/billing-service` — `npm install` ❌
- [ ] `microservices/device-service` — `npm install` ❌
- [ ] `microservices/dispatcher-service` — `npm install` ❌
- [ ] `microservices/integration-service` — `npm install` ❌
- [ ] `microservices/location-service` — `npm install` ❌
- [ ] `microservices/organization-service` — `npm install` ❌
- [ ] `microservices/telemetry-service` — `npm install` ❌
- [x] `microservices/user-service` — `npm install` ✅

## Frontend
- [x] `frontend/apps/landing-app` — `npm install` ✅
- [x] `frontend/apps/guardian-app` — `npm install` ✅
- [x] `frontend/apps/dispatcher-app` — `npm install` ✅
- [x] `frontend/apps/admin-app` — `npm install` ✅

## Mobile
- [x] `mobile/ward-app` — `npm install` ✅

## Примечания
- ⚠️ api-gateway имеет проблему с symlink на Windows (EISDIR), но node_modules существует. Можно использовать `npm link` или установить через администратора.

