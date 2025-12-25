# Сводка подключения мобильного приложения к API

## 📍 Основные точки подключения

### 1. Определение базового URL
**Файл:** `src/utils/apiBaseUrl.ts`
- Функция `getApiBaseUrl()` автоматически определяет URL
- Логика для Android emulator, physical device, iOS simulator, production

### 2. Создание HTTP клиента
**Файл:** `src/services/ApiClient.ts`
- Создает axios клиент с `baseURL: API_BASE_URL`
- Настраивает interceptors для токенов и обработки ошибок
- Экспортирует singleton `apiClient`

### 3. Использование в сервисах
Все сервисы используют `apiClient.instance`:
- ✅ `AuthService.ts` - `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/refresh`
- ✅ `DeviceService.ts` - `/devices`, `/devices/:id/link`
- ✅ `TelemetryService.ts` - `/telemetry`, `/telemetry/wards/:wardId`
- ✅ `AlertService.ts` - `/alerts`, `/alerts/:id/status`
- ✅ `WardService.ts` - `/users/wards`
- ✅ `CallService.ts` - `/dispatcher/calls`
- ✅ `GeofenceService.ts` - `/locations/geofences`
- ✅ `ApiLocationService.ts` - `/locations/wards/:wardId`
- ✅ `NotificationService.ts` - `/integration/notifications/devices`
- ✅ `TelemetryHistoryService.ts` - `/telemetry/wards/:wardId`
- ✅ `WardStatusService.ts` - `/users/wards`
- ✅ `OfflineService.ts` - использует динамический импорт
- ✅ `SOSScreen.tsx` - `/dispatcher/calls`

## 🔧 Конфигурация URL

### Development режим:
- **Android emulator**: `http://10.0.2.2:3000/api/v1`
- **Physical Android device**: `http://<metro-ip>:3000/api/v1` (автоматически)
- **iOS simulator**: `http://localhost:3000/api/v1` или `http://<metro-ip>:3000/api/v1`

### Production режим:
- `https://api.caremonitoring.com/api/v1`

## ⚠️ Важные замечания

1. **API Gateway должен слушать на `0.0.0.0:3000`**, а не только на `localhost:3000`
2. **CORS должен разрешать все origin'ы в development** (`origin: true`)
3. **Все запросы идут через `apiClient.instance`** - единая точка входа
4. **Автоматическое обновление токена** при 401 ошибке
5. **Формат ответа**: `{ success: true, data: {...} }`

## 📝 Неиспользуемый код

- `src/utils/constants.ts` экспортирует `API_BASE_URL`, но он **не используется** нигде
- Можно удалить, если не планируется использование в будущем

## 🔍 Отладка

Для проверки подключения добавьте в `ApiClient.ts`:
```typescript
constructor() {
  const API_BASE_URL = getApiBaseUrl();
  console.log('🔗 API Base URL:', API_BASE_URL);
  // ...
}
```

---

**Подробная документация:** [docs/API_CONNECTION.md](./docs/API_CONNECTION.md)

