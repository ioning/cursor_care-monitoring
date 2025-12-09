# Миграция с Workspaces на file: протокол

**Дата**: 2024-01-15  
**Причина**: Проблемы с установкой пакетов при использовании npm workspaces

## Проблема

Текущая конфигурация использует npm workspaces, что может вызывать:
- Ошибки установки зависимостей
- Проблемы с разрешением путей на Windows
- Сложности с TypeScript путями
- Долгая установка всех зависимостей сразу

## Решение

Заменить workspaces на использование `file:` протокола для локальных пакетов. Это позволит:
- ✅ Каждому сервису иметь свои node_modules
- ✅ Упростить установку зависимостей
- ✅ Избежать проблем с разрешением путей
- ✅ Улучшить совместимость с разными ОС

---

## План миграции

### Шаг 1: Обновление корневого package.json

**Было:**
```json
{
  "workspaces": [
    "api-gateway",
    "microservices/*",
    "shared",
    "frontend/apps/*",
    "frontend/packages/*"
  ]
}
```

**Станет:**
```json
{
  "private": true,
  "scripts": {
    // Скрипты остаются без изменений
  }
}
```

### Шаг 2: Обновление shared/package.json

Добавить поля для корректной работы как пакета:

```json
{
  "name": "@care-monitoring/shared",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./libs/*": "./libs/*",
    "./guards/*": "./guards/*",
    "./middleware/*": "./middleware/*",
    "./types/*": "./types/*"
  }
}
```

### Шаг 3: Обновление зависимостей в микросервисах

**Было (неявная зависимость через workspace):**
```json
{
  "dependencies": {
    // shared доступен через workspace
  }
}
```

**Станет:**
```json
{
  "dependencies": {
    "@care-monitoring/shared": "file:../../shared"
  }
}
```

### Шаг 4: Обновление frontend пакетов

**Было:**
```json
{
  "dependencies": {
    "@care-monitoring/realtime": "0.1.0"
  }
}
```

**Станет:**
```json
{
  "dependencies": {
    "@care-monitoring/realtime": "file:../../packages/realtime"
  }
}
```

---

## Детальная миграция по пакетам

### 1. Shared пакет

**Файл:** `shared/package.json`

```json
{
  "name": "@care-monitoring/shared",
  "version": "0.1.0",
  "description": "Shared libraries and utilities",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./libs/database": "./libs/database.ts",
    "./libs/logger": "./libs/logger.ts",
    "./libs/redis": "./libs/redis.ts",
    "./libs/rabbitmq": "./libs/rabbitmq.ts",
    "./libs/retry": "./libs/retry.ts",
    "./libs/circuit-breaker": "./libs/circuit-breaker.ts",
    "./guards/jwt-auth.guard": "./guards/jwt-auth.guard.ts",
    "./guards/tenant.guard": "./guards/tenant.guard.ts",
    "./middleware/tenant.middleware": "./middleware/tenant.middleware.ts",
    "./types/common.types": "./types/common.types.ts",
    "./types/event.types": "./types/event.types.ts"
  },
  "dependencies": {
    "pg": "^8.11.3",
    "redis": "^4.6.12",
    "amqplib": "^0.10.3",
    "winston": "^3.11.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "prom-client": "^15.1.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.9",
    "@types/amqplib": "^0.10.4",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

**Создать:** `shared/index.ts` для экспорта всех модулей:

```typescript
// Re-export all shared modules
export * from './libs/database';
export * from './libs/logger';
export * from './libs/redis';
export * from './libs/rabbitmq';
export * from './libs/retry';
export * from './libs/circuit-breaker';
export * from './guards/jwt-auth.guard';
export * from './guards/tenant.guard';
export * from './middleware/tenant.middleware';
export * from './types/common.types';
export * from './types/event.types';
```

### 2. Микросервисы

Для каждого микросервиса в `microservices/*/package.json`:

```json
{
  "dependencies": {
    "@care-monitoring/shared": "file:../../shared",
    // остальные зависимости
  }
}
```

**Пример:** `microservices/auth-service/package.json`

```json
{
  "name": "@care-monitoring/auth-service",
  "version": "0.1.0",
  "dependencies": {
    "@care-monitoring/shared": "file:../../shared",
    "@nestjs/common": "^10.3.0",
    // ...
  }
}
```

### 3. Frontend приложения

Для каждого frontend приложения в `frontend/apps/*/package.json`:

```json
{
  "dependencies": {
    "@care-monitoring/realtime": "file:../../packages/realtime",
    // остальные зависимости
  }
}
```

**Пример:** `frontend/apps/guardian-app/package.json`

```json
{
  "dependencies": {
    "@care-monitoring/realtime": "file:../../packages/realtime",
    "vue": "^3.3.11",
    // ...
  }
}
```

### 4. Realtime пакет

**Файл:** `frontend/packages/realtime/package.json`

```json
{
  "name": "@care-monitoring/realtime",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./vue": "./src/vue.ts"
  },
  "dependencies": {
    "mitt": "^3.0.1"
  }
}
```

---

## Обновление импортов

### В микросервисах

**Было:**
```typescript
import { createLogger } from '../../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../../shared/libs/database';
```

**Станет:**
```typescript
import { createLogger } from '@care-monitoring/shared/libs/logger';
import { createDatabaseConnection } from '@care-monitoring/shared/libs/database';
```

Или через index:
```typescript
import { createLogger, createDatabaseConnection } from '@care-monitoring/shared';
```

### В frontend приложениях

**Было:**
```typescript
import { createRealtimeClient } from '@care-monitoring/realtime';
```

**Остается (без изменений):**
```typescript
import { createRealtimeClient } from '@care-monitoring/realtime';
```

---

## TypeScript конфигурация

### Обновление tsconfig.json в микросервисах

**Было:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Станет:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@care-monitoring/shared": ["../../shared"],
      "@care-monitoring/shared/*": ["../../shared/*"]
    }
  }
}
```

### Обновление tsconfig.json в frontend приложениях

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@care-monitoring/realtime": ["../../packages/realtime/src"],
      "@care-monitoring/realtime/*": ["../../packages/realtime/src/*"]
    }
  }
}
```

---

## Процесс установки после миграции

### Вариант 1: Установка каждого сервиса отдельно

```bash
# 1. Установить shared пакет
cd shared
npm install

# 2. Установить каждый микросервис
cd ../microservices/auth-service
npm install

cd ../user-service
npm install
# и т.д.

# 3. Установить frontend пакеты
cd ../../frontend/packages/realtime
npm install

# 4. Установить frontend приложения
cd ../apps/guardian-app
npm install
```

### Вариант 2: Скрипт для автоматической установки

Создать `scripts/install-all.sh` (или `.ps1` для Windows):

```bash
#!/bin/bash

echo "Installing shared package..."
cd shared && npm install && cd ..

echo "Installing microservices..."
for service in microservices/*/; do
  echo "Installing $service..."
  cd "$service" && npm install && cd ../..
done

echo "Installing frontend packages..."
cd frontend/packages/realtime && npm install && cd ../../..

echo "Installing frontend apps..."
for app in frontend/apps/*/; do
  echo "Installing $app..."
  cd "$app" && npm install && cd ../../..
done

echo "Installation complete!"
```

---

## Преимущества file: протокола

1. **Изоляция зависимостей** - каждый сервис имеет свои node_modules
2. **Простота установки** - нет необходимости в workspace-aware менеджерах
3. **Совместимость** - работает с npm, yarn, pnpm
4. **Меньше проблем** - избегаем багов workspace разрешения
5. **Гибкость** - можно легко переключаться между локальными и опубликованными версиями

## Недостатки

1. **Дублирование зависимостей** - каждый сервис устанавливает свои зависимости
2. **Больше места на диске** - больше node_modules папок
3. **Ручная установка** - нужно устанавливать каждый сервис отдельно (или использовать скрипт)

---

## Проверка после миграции

### 1. Проверить установку

```bash
# В каждом сервисе
cd microservices/auth-service
npm list @care-monitoring/shared
# Должно показать: @care-monitoring/shared@0.1.0 -> file:../../shared
```

### 2. Проверить импорты

```bash
# Запустить TypeScript проверку
npx tsc --noEmit
```

### 3. Проверить запуск

```bash
# Запустить сервис
npm run start:dev
```

---

## Откат изменений

Если нужно вернуться к workspaces:

1. Восстановить `workspaces` в корневом `package.json`
2. Удалить `file:` зависимости из всех `package.json`
3. Удалить все `node_modules` и `package-lock.json`
4. Запустить `npm install` в корне

---

## Автоматизация миграции

Скрипт для автоматической миграции всех package.json файлов:

```javascript
// scripts/migrate-to-file-protocol.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Найти все package.json файлы
const packageFiles = glob.sync('**/package.json', {
  ignore: ['**/node_modules/**', 'package.json'] // Игнорировать корневой
});

packageFiles.forEach(file => {
  const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dir = path.dirname(file);
  
  // Добавить shared зависимость для микросервисов
  if (dir.startsWith('microservices/') || dir === 'api-gateway') {
    if (!packageJson.dependencies) packageJson.dependencies = {};
    packageJson.dependencies['@care-monitoring/shared'] = 'file:../../shared';
  }
  
  // Добавить realtime зависимость для frontend приложений
  if (dir.startsWith('frontend/apps/')) {
    if (!packageJson.dependencies) packageJson.dependencies = {};
    packageJson.dependencies['@care-monitoring/realtime'] = 'file:../../packages/realtime';
  }
  
  fs.writeFileSync(file, JSON.stringify(packageJson, null, 2) + '\n');
});

console.log('Migration complete!');
```

---

**Статус**: Готово к применению  
**Риск**: Низкий (легко откатить)  
**Время миграции**: 30-60 минут



**Дата**: 2024-01-15  
**Причина**: Проблемы с установкой пакетов при использовании npm workspaces

## Проблема

Текущая конфигурация использует npm workspaces, что может вызывать:
- Ошибки установки зависимостей
- Проблемы с разрешением путей на Windows
- Сложности с TypeScript путями
- Долгая установка всех зависимостей сразу

## Решение

Заменить workspaces на использование `file:` протокола для локальных пакетов. Это позволит:
- ✅ Каждому сервису иметь свои node_modules
- ✅ Упростить установку зависимостей
- ✅ Избежать проблем с разрешением путей
- ✅ Улучшить совместимость с разными ОС

---

## План миграции

### Шаг 1: Обновление корневого package.json

**Было:**
```json
{
  "workspaces": [
    "api-gateway",
    "microservices/*",
    "shared",
    "frontend/apps/*",
    "frontend/packages/*"
  ]
}
```

**Станет:**
```json
{
  "private": true,
  "scripts": {
    // Скрипты остаются без изменений
  }
}
```

### Шаг 2: Обновление shared/package.json

Добавить поля для корректной работы как пакета:

```json
{
  "name": "@care-monitoring/shared",
  "version": "0.1.0",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./libs/*": "./libs/*",
    "./guards/*": "./guards/*",
    "./middleware/*": "./middleware/*",
    "./types/*": "./types/*"
  }
}
```

### Шаг 3: Обновление зависимостей в микросервисах

**Было (неявная зависимость через workspace):**
```json
{
  "dependencies": {
    // shared доступен через workspace
  }
}
```

**Станет:**
```json
{
  "dependencies": {
    "@care-monitoring/shared": "file:../../shared"
  }
}
```

### Шаг 4: Обновление frontend пакетов

**Было:**
```json
{
  "dependencies": {
    "@care-monitoring/realtime": "0.1.0"
  }
}
```

**Станет:**
```json
{
  "dependencies": {
    "@care-monitoring/realtime": "file:../../packages/realtime"
  }
}
```

---

## Детальная миграция по пакетам

### 1. Shared пакет

**Файл:** `shared/package.json`

```json
{
  "name": "@care-monitoring/shared",
  "version": "0.1.0",
  "description": "Shared libraries and utilities",
  "main": "index.ts",
  "types": "index.ts",
  "exports": {
    ".": "./index.ts",
    "./libs/database": "./libs/database.ts",
    "./libs/logger": "./libs/logger.ts",
    "./libs/redis": "./libs/redis.ts",
    "./libs/rabbitmq": "./libs/rabbitmq.ts",
    "./libs/retry": "./libs/retry.ts",
    "./libs/circuit-breaker": "./libs/circuit-breaker.ts",
    "./guards/jwt-auth.guard": "./guards/jwt-auth.guard.ts",
    "./guards/tenant.guard": "./guards/tenant.guard.ts",
    "./middleware/tenant.middleware": "./middleware/tenant.middleware.ts",
    "./types/common.types": "./types/common.types.ts",
    "./types/event.types": "./types/event.types.ts"
  },
  "dependencies": {
    "pg": "^8.11.3",
    "redis": "^4.6.12",
    "amqplib": "^0.10.3",
    "winston": "^3.11.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/passport": "^10.0.3",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "prom-client": "^15.1.0"
  },
  "devDependencies": {
    "@types/pg": "^8.10.9",
    "@types/amqplib": "^0.10.4",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

**Создать:** `shared/index.ts` для экспорта всех модулей:

```typescript
// Re-export all shared modules
export * from './libs/database';
export * from './libs/logger';
export * from './libs/redis';
export * from './libs/rabbitmq';
export * from './libs/retry';
export * from './libs/circuit-breaker';
export * from './guards/jwt-auth.guard';
export * from './guards/tenant.guard';
export * from './middleware/tenant.middleware';
export * from './types/common.types';
export * from './types/event.types';
```

### 2. Микросервисы

Для каждого микросервиса в `microservices/*/package.json`:

```json
{
  "dependencies": {
    "@care-monitoring/shared": "file:../../shared",
    // остальные зависимости
  }
}
```

**Пример:** `microservices/auth-service/package.json`

```json
{
  "name": "@care-monitoring/auth-service",
  "version": "0.1.0",
  "dependencies": {
    "@care-monitoring/shared": "file:../../shared",
    "@nestjs/common": "^10.3.0",
    // ...
  }
}
```

### 3. Frontend приложения

Для каждого frontend приложения в `frontend/apps/*/package.json`:

```json
{
  "dependencies": {
    "@care-monitoring/realtime": "file:../../packages/realtime",
    // остальные зависимости
  }
}
```

**Пример:** `frontend/apps/guardian-app/package.json`

```json
{
  "dependencies": {
    "@care-monitoring/realtime": "file:../../packages/realtime",
    "vue": "^3.3.11",
    // ...
  }
}
```

### 4. Realtime пакет

**Файл:** `frontend/packages/realtime/package.json`

```json
{
  "name": "@care-monitoring/realtime",
  "version": "0.1.0",
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./vue": "./src/vue.ts"
  },
  "dependencies": {
    "mitt": "^3.0.1"
  }
}
```

---

## Обновление импортов

### В микросервисах

**Было:**
```typescript
import { createLogger } from '../../../../shared/libs/logger';
import { createDatabaseConnection } from '../../../../shared/libs/database';
```

**Станет:**
```typescript
import { createLogger } from '@care-monitoring/shared/libs/logger';
import { createDatabaseConnection } from '@care-monitoring/shared/libs/database';
```

Или через index:
```typescript
import { createLogger, createDatabaseConnection } from '@care-monitoring/shared';
```

### В frontend приложениях

**Было:**
```typescript
import { createRealtimeClient } from '@care-monitoring/realtime';
```

**Остается (без изменений):**
```typescript
import { createRealtimeClient } from '@care-monitoring/realtime';
```

---

## TypeScript конфигурация

### Обновление tsconfig.json в микросервисах

**Было:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Станет:**
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@care-monitoring/shared": ["../../shared"],
      "@care-monitoring/shared/*": ["../../shared/*"]
    }
  }
}
```

### Обновление tsconfig.json в frontend приложениях

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@care-monitoring/realtime": ["../../packages/realtime/src"],
      "@care-monitoring/realtime/*": ["../../packages/realtime/src/*"]
    }
  }
}
```

---

## Процесс установки после миграции

### Вариант 1: Установка каждого сервиса отдельно

```bash
# 1. Установить shared пакет
cd shared
npm install

# 2. Установить каждый микросервис
cd ../microservices/auth-service
npm install

cd ../user-service
npm install
# и т.д.

# 3. Установить frontend пакеты
cd ../../frontend/packages/realtime
npm install

# 4. Установить frontend приложения
cd ../apps/guardian-app
npm install
```

### Вариант 2: Скрипт для автоматической установки

Создать `scripts/install-all.sh` (или `.ps1` для Windows):

```bash
#!/bin/bash

echo "Installing shared package..."
cd shared && npm install && cd ..

echo "Installing microservices..."
for service in microservices/*/; do
  echo "Installing $service..."
  cd "$service" && npm install && cd ../..
done

echo "Installing frontend packages..."
cd frontend/packages/realtime && npm install && cd ../../..

echo "Installing frontend apps..."
for app in frontend/apps/*/; do
  echo "Installing $app..."
  cd "$app" && npm install && cd ../../..
done

echo "Installation complete!"
```

---

## Преимущества file: протокола

1. **Изоляция зависимостей** - каждый сервис имеет свои node_modules
2. **Простота установки** - нет необходимости в workspace-aware менеджерах
3. **Совместимость** - работает с npm, yarn, pnpm
4. **Меньше проблем** - избегаем багов workspace разрешения
5. **Гибкость** - можно легко переключаться между локальными и опубликованными версиями

## Недостатки

1. **Дублирование зависимостей** - каждый сервис устанавливает свои зависимости
2. **Больше места на диске** - больше node_modules папок
3. **Ручная установка** - нужно устанавливать каждый сервис отдельно (или использовать скрипт)

---

## Проверка после миграции

### 1. Проверить установку

```bash
# В каждом сервисе
cd microservices/auth-service
npm list @care-monitoring/shared
# Должно показать: @care-monitoring/shared@0.1.0 -> file:../../shared
```

### 2. Проверить импорты

```bash
# Запустить TypeScript проверку
npx tsc --noEmit
```

### 3. Проверить запуск

```bash
# Запустить сервис
npm run start:dev
```

---

## Откат изменений

Если нужно вернуться к workspaces:

1. Восстановить `workspaces` в корневом `package.json`
2. Удалить `file:` зависимости из всех `package.json`
3. Удалить все `node_modules` и `package-lock.json`
4. Запустить `npm install` в корне

---

## Автоматизация миграции

Скрипт для автоматической миграции всех package.json файлов:

```javascript
// scripts/migrate-to-file-protocol.js
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Найти все package.json файлы
const packageFiles = glob.sync('**/package.json', {
  ignore: ['**/node_modules/**', 'package.json'] // Игнорировать корневой
});

packageFiles.forEach(file => {
  const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
  const dir = path.dirname(file);
  
  // Добавить shared зависимость для микросервисов
  if (dir.startsWith('microservices/') || dir === 'api-gateway') {
    if (!packageJson.dependencies) packageJson.dependencies = {};
    packageJson.dependencies['@care-monitoring/shared'] = 'file:../../shared';
  }
  
  // Добавить realtime зависимость для frontend приложений
  if (dir.startsWith('frontend/apps/')) {
    if (!packageJson.dependencies) packageJson.dependencies = {};
    packageJson.dependencies['@care-monitoring/realtime'] = 'file:../../packages/realtime';
  }
  
  fs.writeFileSync(file, JSON.stringify(packageJson, null, 2) + '\n');
});

console.log('Migration complete!');
```

---

**Статус**: Готово к применению  
**Риск**: Низкий (легко откатить)  
**Время миграции**: 30-60 минут







