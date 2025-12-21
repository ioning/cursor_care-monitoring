# Исправление отсутствующих зависимостей

## Проблема

При запуске сервисов возникали ошибки компиляции TypeScript:

```
error TS2307: Cannot find module '@nestjs/passport' or its corresponding type declarations.
error TS2307: Cannot find module 'passport-jwt' or its corresponding type declarations.
```

## Причина

Некоторые сервисы использовали `@nestjs/passport` и `passport-jwt` в коде, но не имели этих зависимостей в своих `package.json` файлах.

## Исправление

### 1. API Gateway

Добавлены зависимости в `api-gateway/package.json`:

```json
"dependencies": {
  "@nestjs/passport": "^10.0.3",
  "passport-jwt": "^4.0.1"
},
"devDependencies": {
  "@types/passport-jwt": "^4.0.1"
}
```

### 2. AI Prediction Service

Добавлены зависимости в `microservices/ai-prediction-service/package.json`:

```json
"dependencies": {
  "@nestjs/passport": "^10.0.3",
  "passport-jwt": "^4.0.1"
},
"devDependencies": {
  "@types/passport-jwt": "^4.0.1"
}
```

## Установка зависимостей

После добавления зависимостей в `package.json`, выполните:

```powershell
# Для API Gateway
cd api-gateway
npm install

# Для AI Prediction Service
cd microservices/ai-prediction-service
npm install
```

Или установите все зависимости сразу:

```powershell
npm run install:all
```

## Проверка

После установки зависимостей попробуйте запустить сервисы:

```powershell
# Запуск всех сервисов
npm run dev:all

# Или отдельные сервисы
npm run dev:gateway
npm run dev:ai-prediction
```

## Статус

- ✅ API Gateway - зависимости добавлены и установлены
- ✅ AI Prediction Service - зависимости добавлены и установлены
- ✅ Остальные сервисы - уже имеют необходимые зависимости

## Примечание

Если вы видите подобные ошибки в других сервисах, проверьте:

1. Использует ли сервис `@nestjs/passport` или `passport-jwt` в коде
2. Есть ли эти зависимости в `package.json`
3. Установлены ли зависимости через `npm install`

