# Настройка порта API Gateway в мобильном приложении

## Текущая конфигурация

По умолчанию мобильное приложение подключается к API Gateway на порту **3000** (как указано в `api-gateway/.env`).

## Как изменить порт

### Способ 1: Изменить в конфигурационном файле (рекомендуется)

Откройте файл `src/config/api.config.ts` и измените значение `API_PORT`:

```typescript
// Измените 3000 на нужный порт
export const API_PORT = 3000; // ← измените здесь
```

### Способ 2: Через переменную окружения (для сборки)

Если вы используете переменные окружения при сборке, установите:

```bash
export REACT_NATIVE_API_PORT=3000  # Linux/macOS
# или
set REACT_NATIVE_API_PORT=3000     # Windows
```

**Примечание:** В React Native переменные окружения работают только при сборке, не в runtime.

## Проверка текущего порта

Порт API Gateway можно проверить в файле:
- `api-gateway/.env` - переменная `PORT`
- `api-gateway/src/main.ts` - строка `const port = process.env.PORT || 3000;`

## Где используется порт

Порт используется в следующих местах:

1. **Android emulator**: `http://10.0.2.2:${API_PORT}/api/v1`
2. **Physical Android device**: `http://<metro-ip>:${API_PORT}/api/v1`
3. **iOS simulator**: `http://localhost:${API_PORT}/api/v1`

## После изменения порта

1. Перезапустите Metro bundler:
   ```bash
   npm start -- --reset-cache
   ```

2. Перезапустите приложение на устройстве/эмуляторе

3. Проверьте подключение к API

---

**Файл конфигурации:** `src/config/api.config.ts`

