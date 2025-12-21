# Дефолтные логины и пароли для всех ролей

## Пользователи, создаваемые через seed-скрипт

После выполнения `npm run db:seed` в системе автоматически создаются следующие дефолтные пользователи для всех ролей:

### 1. Администратор системы (admin)
- **Email:** `admin@care-monitoring.ru`
- **Пароль:** `14081979`
- **Роль:** `admin`
- **Полное имя:** Администратор системы
- **Статус:** active
- **Организация:** не привязан (глобальный админ)

> **Примечание:** Эти значения можно изменить через переменные окружения в `microservices/auth-service/.env`:
> - `DEFAULT_ADMIN_EMAIL=admin@care-monitoring.ru`
> - `DEFAULT_ADMIN_PASSWORD=14081979`
> - `DEFAULT_ADMIN_FULL_NAME=Администратор системы`

### 2. Тестовый пользователь (guardian)
- **Email:** `test@example.com`
- **Пароль:** `Test1234!`
- **Роль:** `guardian`
- **Полное имя:** Test User
- **Статус:** active
- **Организация:** не привязан

### 3. Опекун (guardian)
- **Email:** `guardian@care-monitoring.ru`
- **Пароль:** `guardian123`
- **Роль:** `guardian`
- **Полное имя:** Тестовый Опекун
- **Статус:** active
- **Организация:** не привязан

### 4. Подопечный (ward)
- **Email:** `ward@care-monitoring.ru`
- **Пароль:** `ward123`
- **Роль:** `ward`
- **Полное имя:** Тестовый Подопечный
- **Статус:** active
- **Организация:** не привязан

### 5. Диспетчер (dispatcher)
- **Email:** `dispatcher@care-monitoring.ru`
- **Пароль:** `dispatcher123`
- **Роль:** `dispatcher`
- **Полное имя:** Тестовый Диспетчер
- **Статус:** active
- **Организация:** не привязан

### 6. Администратор организации (organization_admin)
- **Email:** `org-admin@care-monitoring.ru`
- **Пароль:** `orgadmin123`
- **Роль:** `organization_admin`
- **Полное имя:** Администратор Организации
- **Статус:** active
- **Организация:** не привязан

---

## Запуск seed-скрипта

Для создания всех дефолтных пользователей выполните:

```bash
npm run db:seed
```

Скрипт автоматически создаст всех пользователей для всех ролей. Если пользователь с таким email уже существует, он будет пропущен (idempotent операция).

### Альтернативный способ: через API

Если нужно создать пользователей вручную через API (POST /api/v1/auth/register):

```bash
# Guardian
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "guardian@care-monitoring.ru",
    "password": "guardian123",
    "fullName": "Тестовый Опекун",
    "role": "guardian"
  }'

# Ward
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ward@care-monitoring.ru",
    "password": "ward123",
    "fullName": "Тестовый Подопечный",
    "role": "ward"
  }'

# Dispatcher
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dispatcher@care-monitoring.ru",
    "password": "dispatcher123",
    "fullName": "Тестовый Диспетчер",
    "role": "dispatcher"
  }'

# Organization Admin
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "org-admin@care-monitoring.ru",
    "password": "orgadmin123",
    "fullName": "Администратор Организации",
    "role": "organization_admin"
  }'
```

---

## Сводная таблица

| Роль | Email | Пароль | Статус |
|------|-------|--------|--------|
| admin | `admin@care-monitoring.ru` | `14081979` | ✅ Создаётся через seed |
| guardian | `test@example.com` | `Test1234!` | ✅ Создаётся через seed |
| guardian | `guardian@care-monitoring.ru` | `guardian123` | ✅ Создаётся через seed |
| ward | `ward@care-monitoring.ru` | `ward123` | ✅ Создаётся через seed |
| dispatcher | `dispatcher@care-monitoring.ru` | `dispatcher123` | ✅ Создаётся через seed |
| organization_admin | `org-admin@care-monitoring.ru` | `orgadmin123` | ✅ Создаётся через seed |

---

## Важные замечания

1. **Безопасность:** Все дефолтные пароли должны быть изменены в production окружении!
2. **Email верификация:** Все пользователи создаются с `email_verified = true`, поэтому верификация email не требуется.
3. **Организации:** Пользователи могут быть привязаны к организациям через поле `organization_id`. По умолчанию все дефолтные пользователи не привязаны к организации (`organization_id = NULL`).
4. **Idempotent операция:** Seed-скрипт можно запускать многократно - если пользователь с таким email уже существует, он будет пропущен.
5. **Seed-скрипт:** Скрипт `scripts/seed.ts` автоматически создаёт всех пользователей для всех ролей при выполнении `npm run db:seed`.

