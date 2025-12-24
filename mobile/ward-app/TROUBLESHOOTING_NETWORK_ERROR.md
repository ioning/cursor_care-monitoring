# Решение ошибки "Network Error" в мобильном приложении

## Проблема

В мобильном приложении появляется ошибка "Network Error" при попытке входа или других операциях, требующих обращения к API.

## Возможные причины и решения

### 1. Приложение не пересобрано после изменения кода

**Симптомы:** Ошибка "Network Error", изменения в коде не применяются.

**Решение:**

После изменения `ApiClient.ts` или `constants.ts` нужно пересобрать приложение:

```bash
# В терминале где запущен Metro bundler - нажмите 'r' для перезагрузки
# Или остановите (Ctrl+C) и запустите снова:

cd mobile/ward-app
npm start

# В другом терминале - перезапустите приложение на эмуляторе
npm run android
```

**Или через Android Studio:**
- Нажмите кнопку "Sync Project with Gradle Files" (если появилась)
- Запустите приложение снова через "Run" (Shift+F10)

### 2. API Gateway не запущен

**Проверка:**
```bash
# Проверьте, что API Gateway работает
curl http://localhost:3000/api/v1/health

# Должен вернуться JSON ответ с статусом "ok"
```

**Если не работает, запустите:**
```bash
# Из корня проекта
npm run dev:gateway
# или
npm run dev:all
```

### 3. Неправильный URL для Android эмулятора

**Проблема:** На Android эмуляторе `localhost` указывает на сам эмулятор, а не на хост-машину.

**Решение:** Уже исправлено в коде - используется `10.0.2.2` для Android.

**Проверьте код:**
- Файл: `mobile/ward-app/src/services/ApiClient.ts`
- Должно быть: `return 'http://10.0.2.2:3000/api/v1';` для Android

### 4. Использование физического устройства вместо эмулятора

**Если вы используете физическое Android устройство:**

Нужно использовать IP адрес вашего компьютера в локальной сети, а не `10.0.2.2`.

**Шаг 1: Узнайте IP адрес компьютера**

**Windows:**
```powershell
ipconfig
# Найдите IPv4 Address (например, 192.168.1.100)
```

**Linux/macOS:**
```bash
ifconfig
# или
ip addr show
# Найдите ваш IP адрес (например, 192.168.1.100)
```

**Шаг 2: Временно измените URL в коде**

В файле `mobile/ward-app/src/services/ApiClient.ts`:

```typescript
if (Platform.OS === 'android') {
  // Для физического устройства - замените на ваш IP
  return 'http://192.168.1.100:3000/api/v1';  // Замените на ваш IP!
}
```

**Шаг 3: Убедитесь, что устройство и компьютер в одной Wi-Fi сети**

**Шаг 4: Проверьте firewall**

Убедитесь, что firewall на компьютере разрешает входящие подключения на порт 3000:

**Windows:**
```powershell
# Разрешить порт в firewall
netsh advfirewall firewall add rule name="Node.js API" dir=in action=allow protocol=TCP localport=3000
```

### 5. API Gateway не слушает на всех интерфейсах

**Проверка:**
```bash
# Проверьте, что API Gateway слушает на 0.0.0.0
netstat -ano | findstr :3000

# Должно быть:
# TCP    0.0.0.0:3000   ...   LISTENING
```

Если видите только `127.0.0.1:3000`, то API Gateway слушает только на localhost и недоступен извне.

**Решение:** NestJS по умолчанию слушает на `0.0.0.0`, но если проблема есть, проверьте код `api-gateway/src/main.ts`:

```typescript
const port = process.env.PORT || 3000;
await app.listen(port, '0.0.0.0');  // Явно указать 0.0.0.0
```

### 6. Проблемы с Metro bundler

**Решение:**
```bash
# Остановите Metro bundler (Ctrl+C)

# Очистите кэш и перезапустите
cd mobile/ward-app
npm start -- --reset-cache

# В другом терминале
npm run android
```

### 7. Проверка доступности API с эмулятора

**В Android эмуляторе:**

1. Откройте браузер в эмуляторе (Chrome)
2. Перейдите на: `http://10.0.2.2:3000/api/v1/health`
3. Должен вернуться JSON ответ:
   ```json
   {"status":"ok","timestamp":"...","uptime":...}
   ```

Если браузер в эмуляторе не может открыть URL, то проблема в сети или firewall.

### 8. ADB port forwarding (альтернативный способ)

Если ничего не помогает, можно использовать ADB port forwarding:

```bash
# Проброс порта 3000 с эмулятора на хост
adb reverse tcp:3000 tcp:3000
```

После этого в коде можно использовать `localhost:3000`:

```typescript
if (Platform.OS === 'android') {
  return 'http://localhost:3000/api/v1';
}
```

**Недостаток:** Нужно выполнять команду после каждого перезапуска эмулятора.

## Пошаговая диагностика

1. **Проверьте API Gateway:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Проверьте, что используется правильный URL:**
   - Откройте `mobile/ward-app/src/services/ApiClient.ts`
   - Убедитесь, что для Android используется `10.0.2.2:3000`

3. **Пересоберите приложение:**
   ```bash
   cd mobile/ward-app
   npm start -- --reset-cache
   # В другом терминале
   npm run android
   ```

4. **Проверьте доступность API из браузера эмулятора:**
   - Откройте браузер в эмуляторе
   - Перейдите: `http://10.0.2.2:3000/api/v1/health`

5. **Проверьте логи Metro bundler:**
   - Должны быть видны запросы к API
   - Если видны ошибки, они помогут понять проблему

6. **Проверьте логи приложения в Android Studio:**
   - Откройте Logcat
   - Фильтр: "ReactNativeJS" или "ApiClient"
   - Ищите ошибки сети

## Быстрое решение (чек-лист)

- [ ] API Gateway запущен (`npm run dev:gateway`)
- [ ] Health endpoint отвечает (`curl http://localhost:3000/api/v1/health`)
- [ ] Код использует `10.0.2.2:3000` для Android (проверьте `ApiClient.ts`)
- [ ] Приложение пересобрано после изменения кода
- [ ] Metro bundler перезапущен с очисткой кэша
- [ ] API доступен из браузера эмулятора (`http://10.0.2.2:3000/api/v1/health`)
- [ ] Firewall разрешает подключения на порт 3000 (для физических устройств)

## Если ничего не помогает

1. Полностью перезапустите проект:
   ```bash
   # Остановите все процессы (Ctrl+C во всех терминалах)
   # Остановите инфраструктуру
   npm run dev:infra:down
   
   # Запустите заново
   npm run dev:infra
   npm run dev:all
   ```

2. В Android Studio:
   - Build → Clean Project
   - Build → Rebuild Project
   - Запустите приложение снова

3. Проверьте логи в Android Studio Logcat для подробных ошибок

4. Используйте ADB port forwarding (см. пункт 8 выше)

## Полезные ссылки

- [Настройка Android эмулятора](ANDROID_EMULATOR_SETUP.md)
- [Дефолтные учетные данные](../../DEFAULT_CREDENTIALS.md)
- [Инструкция по запуску](../../STARTUP.md)

