# Подключение мобильного приложения к API

## 📍 Места подключения к API

### 1. Определение базового URL

**Файл:** `src/utils/apiBaseUrl.ts`

Функция `getApiBaseUrl()` автоматически определяет базовый URL API в зависимости от окружения:

```typescript
export function getApiBaseUrl(): string {
  if (!__DEV__) {
    return 'https://api.caremonitoring.com/api/v1';
  }

  const host = getDevHost(); // Определяет IP адрес Metro bundler

  // Fallback для Android emulator
  if (!host) {
    return Platform.OS === 'android'
      ? 'http://10.0.2.2:3000/api/v1'
      : 'http://localhost:3000/api/v1';
  }

  // Android emulator использует 10.0.2.2 для доступа к localhost хост-машины
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return 'http://10.0.2.2:3000/api/v1';
  }

  // Physical device или iOS simulator: использует IP адрес Metro bundler
  return `http://${host}:3000/api/v1`;
}
```

**Логика определения:**
- **Production**: `https://api.caremonitoring.com/api/v1`
- **Android emulator**: `http://10.0.2.2:3000/api/v1` (специальный адрес для доступа к localhost хост-машины)
- **Physical Android device**: `http://<metro-ip>:3000/api/v1` (автоматически определяется IP Metro bundler)
- **iOS simulator**: `http://localhost:3000/api/v1` или `http://<metro-ip>:3000/api/v1`

### 2. Создание HTTP клиента

**Файл:** `src/services/ApiClient.ts`

Создает axios клиент с базовым URL и настраивает interceptors:

```typescript
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
    });

    this.setupInterceptors();
  }
  // ...
}
```

**Особенности:**
- Базовый URL определяется один раз при создании экземпляра
- Timeout: 30 секунд
- Автоматическое добавление токена авторизации в заголовки
- Автоматическое обновление токена при 401 ошибке

### 3. Использование в сервисах

Все сервисы используют единый экземпляр `apiClient.instance`:

**Файлы, использующие apiClient:**
- `src/services/AuthService.ts` - аутентификация
- `src/services/DeviceService.ts` - управление устройствами
- `src/services/TelemetryService.ts` - отправка телеметрии
- `src/services/AlertService.ts` - работа с алертами
- `src/services/WardService.ts` - управление подопечными
- `src/services/CallService.ts` - звонки диспетчеру
- `src/services/GeofenceService.ts` - геозоны
- `src/services/ApiLocationService.ts` - местоположение
- `src/services/NotificationService.ts` - push уведомления
- `src/services/TelemetryHistoryService.ts` - история телеметрии
- `src/services/WardStatusService.ts` - статус подопечных
- `src/services/OfflineService.ts` - офлайн синхронизация
- `src/screens/SOSScreen.tsx` - экстренный вызов

**Пример использования:**
```typescript
import { apiClient } from './ApiClient';

// GET запрос
const response = await apiClient.instance.get('/users/wards');

// POST запрос
const response = await apiClient.instance.post('/auth/login', {
  email,
  password,
});
```

## 🔧 Конфигурация

### Переменные окружения

**Важно:** В текущей реализации переменные окружения из `.env` **не используются**. URL определяется автоматически через `apiBaseUrl.ts`.

Если нужно использовать переменные окружения, можно добавить поддержку через библиотеку `react-native-config` или `react-native-dotenv`.

### Требования к API Gateway

Для корректной работы мобильного приложения API Gateway должен:

1. **Слушать на всех интерфейсах** (`0.0.0.0:3000`), а не только на `localhost:3000`
   ```typescript
   await app.listen(port, '0.0.0.0');
   ```

2. **CORS настроен для development** (разрешать все origin'ы):
   ```typescript
   app.enableCors({
     origin: process.env.NODE_ENV === 'production' 
       ? (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'])
       : true, // Разрешить все в development
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Id'],
   });
   ```

## 🔄 Автоматическое обновление токена

При получении 401 ошибки `ApiClient` автоматически:

1. Извлекает `refreshToken` из `AsyncStorage`
2. Выполняет запрос на `/auth/refresh`
3. Сохраняет новые токены
4. Повторяет оригинальный запрос с новым токеном

**Важно:** Для refresh используется прямой вызов `axios.post`, а не `apiClient.instance`, чтобы избежать циклических зависимостей.

## 📝 Формат ответов API

Все endpoints API Gateway возвращают единый формат:

```typescript
{
  success: true,
  data: {
    // Данные ответа
  },
  message?: string // Опциональное сообщение
}
```

Сервисы автоматически извлекают `data` из ответа:

```typescript
const response = await apiClient.instance.get('/users/wards');
// response.data = { success: true, data: [...] }
// Используем response.data.data для получения массива
```

## 🐛 Отладка подключения

### Проверка базового URL

Добавьте логирование в `ApiClient.ts`:

```typescript
constructor() {
  const API_BASE_URL = getApiBaseUrl();
  console.log('API Base URL:', API_BASE_URL); // Для отладки
  
  this.client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });
  // ...
}
```

### Проверка доступности API

1. **С Android emulator:**
   - Откройте браузер в эмуляторе
   - Перейдите на `http://10.0.2.2:3000/api/v1/health`
   - Должен вернуться JSON ответ

2. **С физического устройства:**
   - Узнайте IP адрес компьютера: `ipconfig` (Windows) или `ifconfig` (Linux/macOS)
   - Откройте браузер на устройстве
   - Перейдите на `http://<your-ip>:3000/api/v1/health`
   - Должен вернуться JSON ответ

3. **С iOS simulator:**
   - Откройте Safari в симуляторе
   - Перейдите на `http://localhost:3000/api/v1/health`
   - Должен вернуться JSON ответ

### Типичные проблемы

1. **"Network Error" или "ECONNREFUSED"**
   - API Gateway не запущен
   - API Gateway слушает только на `localhost`, а не на `0.0.0.0`
   - Firewall блокирует порт 3000

2. **"CORS policy"**
   - CORS не настроен для мобильных приложений (должен быть `origin: true` в development)
   - Запрос идет через браузер, а не через нативное приложение

3. **401 Unauthorized**
   - Токен не передается в заголовках
   - Токен истек и refresh не работает
   - Неправильный `JWT_SECRET` на сервере

## 📚 Связанная документация

- [ANDROID_EMULATOR_SETUP.md](../ANDROID_EMULATOR_SETUP.md) - Настройка подключения Android эмулятора
- [MOBILE_APP_START_GUIDE.md](../MOBILE_APP_START_GUIDE.md) - Решение проблем при запуске
- [README.md](../README.md) - Общая информация о приложении

---

**Последнее обновление:** 2025-12-22

