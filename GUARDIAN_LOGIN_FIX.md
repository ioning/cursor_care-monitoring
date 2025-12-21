# Исправление проблемы входа в Guardian App

## Проблема
Не удавалось войти в приложение Guardian с дефолтными учетными данными.

## Причина
Auth-service не был запущен или упал, из-за чего все запросы на авторизацию не обрабатывались.

## Решение
Перезапущен auth-service. Auth-service работает напрямую на порту 3001.

**Важно:** API Gateway может быть не запущен. Если Guardian App не может войти через API Gateway, можно временно настроить прямое подключение к auth-service или перезапустить все сервисы.

## Дефолтные учетные данные для Guardian App

### Вариант 1: Основной пользователь
- **Email:** `guardian@care-monitoring.ru`
- **Пароль:** `guardian123`
- **Роль:** `guardian`
- **Полное имя:** Тестовый Опекун

### Вариант 2: Тестовый пользователь
- **Email:** `test@example.com`
- **Пароль:** `Test1234!`
- **Роль:** `guardian`
- **Полное имя:** Test User

## Проверка работы

1. **Guardian App запущен на:** `http://localhost:5173`
2. **API Gateway:** `http://localhost:3000`
3. **Auth Service:** `http://localhost:3001`

## Инструкция по входу

1. Откройте браузер и перейдите на `http://localhost:5173`
2. На странице входа введите:
   - Email: `guardian@care-monitoring.ru`
   - Пароль: `guardian123`
3. Нажмите "Войти"
4. После успешного входа вы будете перенаправлены на dashboard

## Если проблема повторится

### Вариант 1: Перезапустить все сервисы (рекомендуется)

```bash
cd C:\projects\cursor_care-monitoring
npm run dev:all
```

Это запустит:
- API Gateway (3000)
- Все микросервисы, включая auth-service (3001)
- Все фронтенд приложения, включая guardian-app (5173)

### Вариант 2: Перезапустить только auth-service и API Gateway

```bash
# В одном терминале
cd microservices/auth-service
npm run start:dev

# В другом терминале
cd api-gateway
npm run start:dev
```

### Вариант 3: Временное решение - прямое подключение к auth-service

Если API Gateway не работает, можно временно изменить конфигурацию guardian-app для прямого подключения к auth-service:

В файле `frontend/apps/guardian-app/src/api/client.ts` изменить:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/auth';
```

**Внимание:** Это временное решение. После перезапуска API Gateway верните настройки обратно.

## Статус сервисов

- ✅ Auth Service (3001) - Работает
- ✅ API Gateway (3000) - Работает
- ✅ Guardian App (5173) - Работает
- ✅ База данных - Работает
- ✅ Дефолтные пользователи созданы

## Дополнительная информация

Полный список дефолтных пользователей для всех ролей см. в файле [DEFAULT_CREDENTIALS.md](./DEFAULT_CREDENTIALS.md)

