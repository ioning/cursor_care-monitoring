# Multi-Tenancy Architecture (B2B)

## Обзор

Система поддерживает multi-tenancy архитектуру для изолированных аккаунтов организаций. Каждая организация (диспетчерская служба) имеет полностью изолированные данные: своих подопечных, опекунов, диспетчеров и настройки.

## Концепция

### Организация (Organization/Tenant)

Организация - это изолированный аккаунт, который может содержать:
- **Подопечных (Wards)** - людей, за которыми ведется мониторинг
- **Опекунов (Guardians)** - родственников или ухаживающих лиц
- **Диспетчеров (Dispatchers)** - сотрудников диспетчерской службы
- **Администраторов организации** - управляющих аккаунтом

### Изоляция данных

Все данные изолированы на уровне организации:
- Пользователи видят только данные своей организации
- Запросы автоматически фильтруются по `organization_id`
- Невозможно получить доступ к данным другой организации

## Архитектура

### 1. Модель данных

#### Таблица Organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- Уникальный идентификатор
  status VARCHAR(20) DEFAULT 'trial',
  subscription_tier VARCHAR(20) DEFAULT 'basic',
  subscription_plan_id UUID,
  max_wards INTEGER, -- Лимит подопечных
  max_dispatchers INTEGER, -- Лимит диспетчеров
  max_guardians INTEGER, -- Лимит опекунов
  features JSONB DEFAULT '{}', -- Доступные функции
  settings JSONB DEFAULT '{}', -- Настройки организации
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Обновление таблицы Users

```sql
ALTER TABLE users ADD COLUMN organization_id UUID;
CREATE UNIQUE INDEX idx_users_email_organization ON users(email, organization_id);
```

**Важно**: Email теперь уникален в рамках организации, но может повторяться в разных организациях.

### 2. JWT токены

JWT токены теперь включают `organizationId`:

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  role: "dispatcher",
  organizationId: "org-123", // ID организации
  tenantId: "org-123" // Для обратной совместимости
}
```

### 3. Tenant Guard

Автоматическая проверка изоляции через `TenantGuard`:

```typescript
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('wards')
export class WardController {
  // Все запросы автоматически фильтруются по organizationId
}
```

### 4. Фильтрация в репозиториях

Все репозитории автоматически фильтруют данные по `organization_id`:

```typescript
async findByWardId(wardId: string, tenantId: string) {
  return db.query(
    'SELECT * FROM wards WHERE id = $1 AND organization_id = $2',
    [wardId, tenantId]
  );
}
```

## Тарифные планы

### Уровни подписки

1. **Basic** - Базовый план
   - До 10 подопечных
   - Базовые функции мониторинга
   - Без AI аналитики

2. **Professional** - Профессиональный план
   - До 100 подопечных
   - AI аналитика
   - Интеграция с СМП
   - Расширенная отчетность

3. **Enterprise** - Корпоративный план
   - Неограниченное количество подопечных
   - Все функции
   - White-label
   - API доступ
   - Выделенная поддержка

4. **Custom** - Индивидуальный план
   - Настраиваемые лимиты
   - Индивидуальные функции
   - Персональный менеджер

### Управление тарифами

Тарифы назначаются на уровне организации:

```typescript
await organizationService.updateSubscription(
  organizationId,
  SubscriptionTier.ENTERPRISE,
  customPlanId
);
```

## Использование

### Создание организации

```typescript
const organization = await organizationService.createOrganization({
  name: "Диспетчерская служба №1",
  slug: "dispatcher-1",
  subscriptionTier: SubscriptionTier.PROFESSIONAL,
  maxWards: 100,
  maxDispatchers: 10,
  trialDays: 30
});
```

### Создание пользователя в организации

```typescript
const user = await userRepository.create({
  email: "dispatcher@example.com",
  passwordHash: hashedPassword,
  fullName: "Иван Иванов",
  role: UserRole.DISPATCHER,
  organizationId: organization.id
});
```

### Проверка лимитов

```typescript
const limits = await organizationService.checkLimits(
  organizationId,
  'wards'
);

if (!limits.canCreate) {
  throw new Error(`Limit reached: ${limits.current}/${limits.limit}`);
}
```

## Безопасность

### Изоляция данных

1. **На уровне БД**: Все запросы включают `WHERE organization_id = ?`
2. **На уровне приложения**: `TenantGuard` проверяет доступ
3. **На уровне JWT**: `organizationId` в токене

### Защита от утечек данных

- Невозможно получить доступ к данным другой организации
- Все запросы автоматически фильтруются
- Администраторы системы могут видеть все организации (только для поддержки)

## Миграция существующих данных

### Для существующих пользователей

1. Создается дефолтная организация "Default"
2. Все существующие пользователи привязываются к этой организации
3. `organization_id` может быть `NULL` для обратной совместимости

### Скрипт миграции

```sql
-- Создать дефолтную организацию
INSERT INTO organizations (id, name, slug, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default', 'default', 'active');

-- Привязать существующих пользователей
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;
```

## API Endpoints

### Organization Service

```
POST   /organizations              - Создать организацию
GET    /organizations/:id          - Получить организацию
PUT    /organizations/:id          - Обновить организацию
GET    /organizations/:id/stats    - Статистика организации
POST   /organizations/:id/subscription - Обновить подписку
```

### Автоматическая фильтрация

Все endpoints автоматически фильтруют данные по `organizationId` из JWT токена:

```
GET /wards              - Только подопечные организации
GET /alerts             - Только алерты организации
GET /dispatchers        - Только диспетчеры организации
```

## Примеры использования

### Создание B2B аккаунта

```typescript
// 1. Создать организацию
const org = await organizationService.createOrganization({
  name: "Медицинский центр",
  slug: "medical-center-1",
  subscriptionTier: SubscriptionTier.ENTERPRISE,
  maxWards: 500,
  trialDays: 14
});

// 2. Создать администратора организации
const admin = await userService.createUser({
  email: "admin@medical-center.ru",
  fullName: "Главный администратор",
  role: UserRole.ORGANIZATION_ADMIN,
  organizationId: org.id
});

// 3. Создать диспетчеров
for (const dispatcherData of dispatchers) {
  await userService.createUser({
    ...dispatcherData,
    role: UserRole.DISPATCHER,
    organizationId: org.id
  });
}
```

### Работа с данными организации

```typescript
// Все запросы автоматически фильтруются по organizationId из JWT
@UseGuards(JwtAuthGuard, TenantGuard)
@Get('wards')
async getWards(@Request() req) {
  // req.tenantId автоматически установлен TenantGuard
  return this.wardService.getWards(req.tenantId);
}
```

## Мониторинг и аналитика

### Статистика организации

```typescript
const stats = await organizationService.getOrganizationStats(orgId);
// {
//   totalWards: 45,
//   totalDispatchers: 5,
//   totalGuardians: 120,
//   activeSubscriptions: 1
// }
```

### Использование лимитов

```typescript
const usage = await organizationService.checkLimits(orgId, 'wards');
// {
//   current: 45,
//   limit: 100,
//   canCreate: true
// }
```

## Заключение

Multi-tenancy архитектура обеспечивает:
- ✅ Полную изоляцию данных между организациями
- ✅ Гибкие тарифные планы
- ✅ Масштабируемость для B2B
- ✅ Безопасность на всех уровнях
- ✅ Простоту управления организациями



## Обзор

Система поддерживает multi-tenancy архитектуру для изолированных аккаунтов организаций. Каждая организация (диспетчерская служба) имеет полностью изолированные данные: своих подопечных, опекунов, диспетчеров и настройки.

## Концепция

### Организация (Organization/Tenant)

Организация - это изолированный аккаунт, который может содержать:
- **Подопечных (Wards)** - людей, за которыми ведется мониторинг
- **Опекунов (Guardians)** - родственников или ухаживающих лиц
- **Диспетчеров (Dispatchers)** - сотрудников диспетчерской службы
- **Администраторов организации** - управляющих аккаунтом

### Изоляция данных

Все данные изолированы на уровне организации:
- Пользователи видят только данные своей организации
- Запросы автоматически фильтруются по `organization_id`
- Невозможно получить доступ к данным другой организации

## Архитектура

### 1. Модель данных

#### Таблица Organizations

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- Уникальный идентификатор
  status VARCHAR(20) DEFAULT 'trial',
  subscription_tier VARCHAR(20) DEFAULT 'basic',
  subscription_plan_id UUID,
  max_wards INTEGER, -- Лимит подопечных
  max_dispatchers INTEGER, -- Лимит диспетчеров
  max_guardians INTEGER, -- Лимит опекунов
  features JSONB DEFAULT '{}', -- Доступные функции
  settings JSONB DEFAULT '{}', -- Настройки организации
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Обновление таблицы Users

```sql
ALTER TABLE users ADD COLUMN organization_id UUID;
CREATE UNIQUE INDEX idx_users_email_organization ON users(email, organization_id);
```

**Важно**: Email теперь уникален в рамках организации, но может повторяться в разных организациях.

### 2. JWT токены

JWT токены теперь включают `organizationId`:

```typescript
{
  sub: "user-id",
  email: "user@example.com",
  role: "dispatcher",
  organizationId: "org-123", // ID организации
  tenantId: "org-123" // Для обратной совместимости
}
```

### 3. Tenant Guard

Автоматическая проверка изоляции через `TenantGuard`:

```typescript
@UseGuards(JwtAuthGuard, TenantGuard)
@Controller('wards')
export class WardController {
  // Все запросы автоматически фильтруются по organizationId
}
```

### 4. Фильтрация в репозиториях

Все репозитории автоматически фильтруют данные по `organization_id`:

```typescript
async findByWardId(wardId: string, tenantId: string) {
  return db.query(
    'SELECT * FROM wards WHERE id = $1 AND organization_id = $2',
    [wardId, tenantId]
  );
}
```

## Тарифные планы

### Уровни подписки

1. **Basic** - Базовый план
   - До 10 подопечных
   - Базовые функции мониторинга
   - Без AI аналитики

2. **Professional** - Профессиональный план
   - До 100 подопечных
   - AI аналитика
   - Интеграция с СМП
   - Расширенная отчетность

3. **Enterprise** - Корпоративный план
   - Неограниченное количество подопечных
   - Все функции
   - White-label
   - API доступ
   - Выделенная поддержка

4. **Custom** - Индивидуальный план
   - Настраиваемые лимиты
   - Индивидуальные функции
   - Персональный менеджер

### Управление тарифами

Тарифы назначаются на уровне организации:

```typescript
await organizationService.updateSubscription(
  organizationId,
  SubscriptionTier.ENTERPRISE,
  customPlanId
);
```

## Использование

### Создание организации

```typescript
const organization = await organizationService.createOrganization({
  name: "Диспетчерская служба №1",
  slug: "dispatcher-1",
  subscriptionTier: SubscriptionTier.PROFESSIONAL,
  maxWards: 100,
  maxDispatchers: 10,
  trialDays: 30
});
```

### Создание пользователя в организации

```typescript
const user = await userRepository.create({
  email: "dispatcher@example.com",
  passwordHash: hashedPassword,
  fullName: "Иван Иванов",
  role: UserRole.DISPATCHER,
  organizationId: organization.id
});
```

### Проверка лимитов

```typescript
const limits = await organizationService.checkLimits(
  organizationId,
  'wards'
);

if (!limits.canCreate) {
  throw new Error(`Limit reached: ${limits.current}/${limits.limit}`);
}
```

## Безопасность

### Изоляция данных

1. **На уровне БД**: Все запросы включают `WHERE organization_id = ?`
2. **На уровне приложения**: `TenantGuard` проверяет доступ
3. **На уровне JWT**: `organizationId` в токене

### Защита от утечек данных

- Невозможно получить доступ к данным другой организации
- Все запросы автоматически фильтруются
- Администраторы системы могут видеть все организации (только для поддержки)

## Миграция существующих данных

### Для существующих пользователей

1. Создается дефолтная организация "Default"
2. Все существующие пользователи привязываются к этой организации
3. `organization_id` может быть `NULL` для обратной совместимости

### Скрипт миграции

```sql
-- Создать дефолтную организацию
INSERT INTO organizations (id, name, slug, status)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default', 'default', 'active');

-- Привязать существующих пользователей
UPDATE users 
SET organization_id = '00000000-0000-0000-0000-000000000000'
WHERE organization_id IS NULL;
```

## API Endpoints

### Organization Service

```
POST   /organizations              - Создать организацию
GET    /organizations/:id          - Получить организацию
PUT    /organizations/:id          - Обновить организацию
GET    /organizations/:id/stats    - Статистика организации
POST   /organizations/:id/subscription - Обновить подписку
```

### Автоматическая фильтрация

Все endpoints автоматически фильтруют данные по `organizationId` из JWT токена:

```
GET /wards              - Только подопечные организации
GET /alerts             - Только алерты организации
GET /dispatchers        - Только диспетчеры организации
```

## Примеры использования

### Создание B2B аккаунта

```typescript
// 1. Создать организацию
const org = await organizationService.createOrganization({
  name: "Медицинский центр",
  slug: "medical-center-1",
  subscriptionTier: SubscriptionTier.ENTERPRISE,
  maxWards: 500,
  trialDays: 14
});

// 2. Создать администратора организации
const admin = await userService.createUser({
  email: "admin@medical-center.ru",
  fullName: "Главный администратор",
  role: UserRole.ORGANIZATION_ADMIN,
  organizationId: org.id
});

// 3. Создать диспетчеров
for (const dispatcherData of dispatchers) {
  await userService.createUser({
    ...dispatcherData,
    role: UserRole.DISPATCHER,
    organizationId: org.id
  });
}
```

### Работа с данными организации

```typescript
// Все запросы автоматически фильтруются по organizationId из JWT
@UseGuards(JwtAuthGuard, TenantGuard)
@Get('wards')
async getWards(@Request() req) {
  // req.tenantId автоматически установлен TenantGuard
  return this.wardService.getWards(req.tenantId);
}
```

## Мониторинг и аналитика

### Статистика организации

```typescript
const stats = await organizationService.getOrganizationStats(orgId);
// {
//   totalWards: 45,
//   totalDispatchers: 5,
//   totalGuardians: 120,
//   activeSubscriptions: 1
// }
```

### Использование лимитов

```typescript
const usage = await organizationService.checkLimits(orgId, 'wards');
// {
//   current: 45,
//   limit: 100,
//   canCreate: true
// }
```

## Заключение

Multi-tenancy архитектура обеспечивает:
- ✅ Полную изоляцию данных между организациями
- ✅ Гибкие тарифные планы
- ✅ Масштабируемость для B2B
- ✅ Безопасность на всех уровнях
- ✅ Простоту управления организациями







