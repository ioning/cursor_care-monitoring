# Архитектура связывания опекунов, подопечных, организаций и диспетчеров

## Обзор

Система Care Monitoring использует многоуровневую архитектуру для управления связями между пользователями, подопечными и организациями.

## 1. Связывание опекуна и подопечного

### 1.1. Кто кого добавляет?

**Опекун создает подопечного:**
- Опекун (пользователь с ролью `guardian`) может создать нового подопечного через API `POST /users/wards`
- При создании подопечного автоматически создается связь между опекуном и подопечным в таблице `guardian_wards`
- Опекун становится **первичным опекуном** (`is_primary = true`) для созданного подопечного

**Опекун может связать существующего подопечного:**
- Если подопечный уже существует (создан другим опекуном), текущий опекун может связать его через API `POST /users/wards/link`
- Это позволяет нескольким опекунам следить за одним подопечным (семейный доступ)

### 1.2. Структура данных

#### Таблица `wards` (Подопечные)
```sql
CREATE TABLE wards (
  id UUID PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  medical_info TEXT,
  emergency_contact TEXT,
  organization_id UUID,  -- Принадлежность к организации
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### Таблица `guardian_wards` (Связь опекун-подопечный)
```sql
CREATE TABLE guardian_wards (
  id UUID PRIMARY KEY,
  guardian_id UUID NOT NULL,  -- ID пользователя с ролью guardian
  ward_id UUID NOT NULL REFERENCES wards(id),
  relationship VARCHAR(50) DEFAULT 'ward',
  relationship_type VARCHAR(50),  -- ward, spouse, child, parent, sibling, etc.
  is_primary BOOLEAN DEFAULT FALSE,  -- Первичный опекун
  access_level VARCHAR(50) DEFAULT 'full',  -- full, limited, view_only
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ
);
```

### 1.3. Процесс создания подопечного

```
1. Опекун отправляет POST /users/wards с данными подопечного
2. User Service создает запись в таблице wards
3. Автоматически создается связь в guardian_wards:
   - guardian_id = ID текущего опекуна
   - ward_id = ID созданного подопечного
   - is_primary = true (первый опекун становится первичным)
   - relationship = 'ward' (по умолчанию)
4. Подопечный автоматически привязывается к организации опекуна
```

### 1.4. Семейный доступ

Система поддерживает **множественных опекунов** для одного подопечного:

- **Первичный опекун** (`is_primary = true`):
  - Может управлять другими опекунами
  - Имеет полный доступ ко всем данным
  - Может изменять настройки подопечного

- **Вторичные опекуны**:
  - Могут иметь ограниченный доступ (`access_level = 'limited'` или `'view_only'`)
  - Могут быть временными (`temporary_primary_guardian = true`)
  - Тип связи указывается в `relationship_type` (spouse, child, parent, etc.)

## 2. Организации (Multi-tenancy)

### 2.1. Создание организаций

**Кто создает организации:**
- **Администратор системы** (`admin`) или **Администратор организации** (`organization_admin`) через Organization Service
- API: `POST /organizations`

**Процесс:**
```
1. Администратор создает организацию через API
2. Указывается:
   - name: Название организации
   - slug: Уникальный идентификатор (URL-friendly)
   - subscription_tier: Уровень подписки (basic, professional, enterprise)
   - max_wards, max_dispatchers, max_guardians: Лимиты
3. Создается запись в таблице organizations
```

### 2.2. Структура организации

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  subscription_tier VARCHAR(20),  -- basic, professional, enterprise
  max_wards INTEGER,  -- Лимит подопечных
  max_dispatchers INTEGER,  -- Лимит диспетчеров
  max_guardians INTEGER,  -- Лимит опекунов
  features JSONB,  -- Включенные функции
  settings JSONB,  -- Настройки организации
  status VARCHAR(20),  -- active, suspended, trial, expired
  created_at TIMESTAMPTZ
);
```

### 2.3. Привязка пользователей к организациям

**При регистрации:**
- Новый пользователь может указать `organization_id` при регистрации
- Если не указан, пользователь привязывается к **Default Organization** (`00000000-0000-0000-0000-000000000000`)

**Через миграцию:**
- Существующие пользователи автоматически привязываются к Default Organization

**Структура:**
```sql
-- В таблице users
ALTER TABLE users ADD COLUMN organization_id UUID;

-- В таблице wards
ALTER TABLE wards ADD COLUMN organization_id UUID;
```

### 2.4. Изоляция данных по организациям

Все данные изолированы по `organization_id`:
- **Подопечные** (`wards.organization_id`)
- **Пользователи** (`users.organization_id`)
- **Местоположения** (`locations.organization_id`)
- **Телеметрия** (`telemetry.organization_id`)
- **Алерты** (`alerts.organization_id`)
- **Вызовы** (`emergency_calls.organization_id`)

**API Gateway фильтрует данные:**
- При запросе данных автоматически добавляется фильтр `WHERE organization_id = :user_organization_id`
- Пользователь видит только данные своей организации

## 3. Разделение по диспетчерам

### 3.1. Структура диспетчеров

```sql
CREATE TABLE dispatchers (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL,  -- Связь с users (role = 'dispatcher')
  name VARCHAR(255) NOT NULL,
  available BOOLEAN DEFAULT TRUE,  -- Доступен для назначения
  active_calls INTEGER DEFAULT 0,  -- Количество активных вызовов
  organization_id UUID,  -- Принадлежность к организации
  created_at TIMESTAMPTZ
);
```

### 3.2. Назначение диспетчеров на вызовы

**Автоматическое назначение:**
```
1. Создается экстренный вызов (emergency_call)
2. Dispatcher Service ищет доступного диспетчера:
   - available = TRUE
   - active_calls минимальное
   - organization_id совпадает с организацией вызова
3. Вызов назначается диспетчеру
4. active_calls увеличивается
```

**Ручное назначение:**
- Диспетчер может принять вызов вручную через `POST /dispatcher/calls/:callId/assign`
- Администратор может переназначить вызов другому диспетчеру

### 3.3. Разделение по организациям

**Диспетчеры видят только вызовы своей организации:**
- При запросе вызовов фильтруются по `emergency_calls.organization_id = dispatcher.organization_id`
- Диспетчеры из разных организаций не видят вызовы друг друга

**Исключение:**
- Администратор системы (`admin`) может видеть все вызовы
- Администратор организации (`organization_admin`) видит все вызовы своей организации

## 4. Полная схема связей

```
┌─────────────────┐
│  Organization   │
│  (Multi-tenant) │
└────────┬─────────┘
         │
         ├─────────────────┬──────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
    ┌─────────┐      ┌──────────┐      ┌────────────┐
    │  Users  │      │  Wards   │      │ Dispatchers│
    │(guardian│      │          │      │            │
    │dispatcher)     │          │      │            │
    └────┬────┘      └────┬─────┘      └──────┬─────┘
         │                │                   │
         │                │                   │
         └────────┬───────┘                   │
                  │                            │
                  ▼                            ▼
         ┌─────────────────┐         ┌─────────────────┐
         │ guardian_wards   │         │ emergency_calls │
         │ (Many-to-Many)   │         │                 │
         └─────────────────┘         └─────────────────┘
```

## 5. Примеры использования

### 5.1. Создание подопечного опекуном

```typescript
// Опекун создает подопечного
POST /api/v1/users/wards
Authorization: Bearer <guardian_token>
{
  "fullName": "Иван Иванов",
  "dateOfBirth": "1950-01-15",
  "gender": "male",
  "medicalInfo": "Гипертония, диабет",
  "emergencyContact": "+7 999 123-45-67"
}

// Результат:
// 1. Создается запись в wards
// 2. Автоматически создается связь в guardian_wards
// 3. Подопечный привязывается к организации опекуна
```

### 5.2. Связывание существующего подопечного

```typescript
// Другой опекун связывает существующего подопечного
POST /api/v1/users/wards/link
Authorization: Bearer <guardian_token>
{
  "wardId": "ward-uuid",
  "relationship": "spouse",  // или "child", "parent", etc.
  "accessLevel": "full"  // или "limited", "view_only"
}

// Результат:
// Создается новая связь в guardian_wards
// is_primary остается false (первый опекун остается первичным)
```

### 5.3. Создание организации

```typescript
// Администратор создает организацию
POST /api/v1/organizations
Authorization: Bearer <admin_token>
{
  "name": "Медицинский центр 'Здоровье'",
  "slug": "zdorovie-med",
  "subscriptionTier": "enterprise",
  "maxWards": 1000,
  "maxDispatchers": 50,
  "maxGuardians": 500
}
```

### 5.4. Назначение диспетчера на вызов

```typescript
// Автоматическое назначение (внутренний процесс)
// Dispatcher Service находит доступного диспетчера той же организации

// Ручное назначение
POST /api/v1/dispatcher/calls/:callId/assign
Authorization: Bearer <dispatcher_token>
// Вызов назначается текущему диспетчеру
```

## 6. Безопасность и доступ

### 6.1. Проверка доступа к подопечному

- При каждом запросе данных подопечного проверяется связь в `guardian_wards`
- Опекун видит только своих подопечных
- Диспетчеры видят только вызовы своей организации

### 6.2. Роли и права

- **guardian**: Может создавать и управлять своими подопечными
- **dispatcher**: Может обрабатывать вызовы своей организации
- **organization_admin**: Может управлять пользователями и настройками организации
- **admin**: Полный доступ ко всем данным

## 7. Миграции и дефолтные значения

### 7.1. Default Organization

- При первом запуске создается Default Organization с ID `00000000-0000-0000-0000-000000000000`
- Все существующие пользователи и подопечные автоматически привязываются к ней
- Это обеспечивает обратную совместимость

### 7.2. Миграции

- `002_add_organization_id_to_users.sql` - Добавляет organization_id в users
- `002_add_organization_id_to_wards.sql` - Добавляет organization_id в wards
- `002_create_default_organization.sql` - Создает Default Organization

## Заключение

Система использует гибкую многоуровневую архитектуру:
1. **Опекуны** создают и управляют подопечными
2. **Организации** изолируют данные и управляют лимитами
3. **Диспетчеры** обрабатывают вызовы в рамках своей организации
4. **Multi-tenancy** обеспечивает полную изоляцию данных между организациями

