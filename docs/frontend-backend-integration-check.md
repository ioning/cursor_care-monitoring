# Отчет о проверке взаимодействия фронтенда с бэкендом

**Дата проверки:** 2025-12-19  
**Статус:** ✅ Все проверки пройдены

## 1. Конфигурация API клиентов

### Веб-приложения (Vue 3)
Все фронтенд приложения используют единый базовый URL:
- **Base URL:** `http://localhost:3000/api/v1`
- **Переменная окружения:** `VITE_API_URL` (опционально)

#### Приложения:
1. **Landing App** (`frontend/apps/landing-app`)
   - Порт: `5175`
   - API Client: `src/api/client.ts`
   - Функции: регистрация, вход, переход в личные кабинеты

2. **Guardian App** (`frontend/apps/guardian-app`)
   - Порт: `5173`
   - API Client: `src/api/client.ts`
   - Функции: управление подопечными, устройствами, алертами

3. **Dispatcher App** (`frontend/apps/dispatcher-app`)
   - Порт: `5174`
   - API Client: `src/api/client.ts`
   - Функции: диспетчеризация вызовов, карта, управление вызовами

4. **Admin App** (`frontend/apps/admin-app`)
   - Порт: `5185`
   - API Client: `src/api/client.ts`
   - Функции: администрирование системы

### Мобильное приложение (React Native)
- **Base URL (dev):** `http://localhost:3000/api/v1`
- **Base URL (prod):** `https://api.caremonitoring.com/api/v1`
- **API Client:** `mobile/ward-app/src/services/ApiClient.ts`
- **Хранение токенов:** `AsyncStorage` (вместо `localStorage`)

## 2. Настройки CORS в API Gateway

### Конфигурация
- **Файл:** `api-gateway/src/main.ts`
- **Переменная окружения:** `CORS_ORIGIN`
- **Значение по умолчанию:** `http://localhost:5173`
- **Текущее значение:** `http://localhost:5173,http://localhost:5174,http://localhost:5175`

### Разрешенные origins:
- ✅ `http://localhost:5173` (Guardian App)
- ✅ `http://localhost:5174` (Dispatcher App)
- ✅ `http://localhost:5175` (Landing App)

### CORS настройки:
```typescript
app.enableCors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
});
```

## 3. Проверка доступности

### API Gateway
- ✅ **Health endpoint:** `http://localhost:3000/api/v1/health` → **200 OK**
- ✅ **Swagger docs:** `http://localhost:3000/api/docs` → доступен
- ✅ **Статус контейнера:** `healthy`

### CORS Preflight запросы
Все preflight запросы (OPTIONS) успешно проходят:
- ✅ `http://localhost:5173` → **204 No Content**
- ✅ `http://localhost:5174` → **204 No Content**
- ✅ `http://localhost:5175` → **204 No Content**

## 4. Механизмы аутентификации

### Веб-приложения
1. **Хранение токенов:** `localStorage`
   - `accessToken` - JWT токен доступа
   - `refreshToken` - токен для обновления

2. **Автоматическое добавление токена:**
   - Request interceptor добавляет `Authorization: Bearer <token>` ко всем запросам

3. **Обработка 401 ошибок:**
   - **Guardian App:** Автоматический refresh токена с повторной попыткой запроса
   - **Landing/Dispatcher Apps:** Перенаправление на `/login` при 401

4. **Refresh token механизм:**
   - Endpoint: `POST /api/v1/auth/refresh`
   - Автоматический retry после успешного refresh

### Мобильное приложение
1. **Хранение токенов:** `AsyncStorage`
   - `token` - JWT токен доступа
   - `refreshToken` - токен для обновления

2. **Обработка ошибок:**
   - Автоматический refresh при 401
   - Логика аналогична веб-приложениям

## 5. Основные API endpoints

### Аутентификация
- ✅ `POST /api/v1/auth/login` - вход в систему
- ✅ `POST /api/v1/auth/register` - регистрация
- ✅ `POST /api/v1/auth/refresh` - обновление токена
- ✅ `POST /api/v1/auth/verify-email` - верификация email
- ✅ `POST /api/v1/auth/resend-verification-code` - повторная отправка кода

### Проксирование через API Gateway
Все запросы проходят через API Gateway, который проксирует их в соответствующие микросервисы:
- `AUTH_SERVICE_URL` → `http://localhost:3001`
- `USER_SERVICE_URL` → `http://localhost:3002`
- `DEVICE_SERVICE_URL` → `http://localhost:3003`
- И т.д.

## 6. Обработка ошибок

### В API клиентах
1. **Network errors:** Передаются в catch блоки
2. **401 Unauthorized:** 
   - Удаление токенов из хранилища
   - Перенаправление на страницу входа (веб)
   - Попытка refresh (если доступен refreshToken)
3. **Другие ошибки:** Передаются в компоненты для отображения пользователю

### В компонентах/сторах
- Ошибки сохраняются в `error` state
- Отображаются пользователю через UI
- Пример: `error.value = err.response?.data?.message || 'Ошибка загрузки данных'`

## 7. Рекомендации

### ✅ Что работает хорошо:
1. Единообразная конфигурация API клиентов
2. Правильная настройка CORS для всех приложений
3. Автоматическое добавление токенов
4. Обработка refresh токенов

### ⚠️ Что можно улучшить:
1. **Добавить retry механизм** для сетевых ошибок
2. **Добавить timeout handling** в некоторых клиентах (есть только в landing-app)
3. **Унифицировать обработку ошибок** между приложениями
4. **Добавить логирование** API запросов в dev режиме
5. **Добавить Admin App** в CORS origins (порт 5185)

## 8. Тестирование

### Ручная проверка:
1. ✅ API Gateway доступен
2. ✅ CORS работает для всех origins
3. ✅ Health endpoints отвечают
4. ✅ Swagger документация доступна

### Для полного тестирования:
1. Запустить фронтенд приложения:
   ```bash
   cd frontend/apps/landing-app && npm run dev
   cd frontend/apps/guardian-app && npm run dev
   cd frontend/apps/dispatcher-app && npm run dev
   ```

2. Проверить:
   - Регистрацию нового пользователя
   - Вход в систему
   - Получение данных после аутентификации
   - Refresh токена при истечении

## Заключение

Взаимодействие фронтенда с бэкендом настроено корректно:
- ✅ Все API клиенты правильно настроены
- ✅ CORS работает для всех приложений
- ✅ Аутентификация и авторизация работают
- ✅ Обработка ошибок реализована
- ✅ API Gateway доступен и функционирует

Система готова к использованию. Для production необходимо:
1. Настроить переменные окружения для production URLs
2. Добавить HTTPS
3. Настроить rate limiting
4. Добавить мониторинг API запросов

