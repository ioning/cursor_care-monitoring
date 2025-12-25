# Руководство по запуску мобильного приложения

## Проблема: ADB не найден

Если вы видите ошибку `"adb" не является внутренней или внешней командой`, это означает, что Android Debug Bridge (ADB) не добавлен в PATH системы.

## Решение 1: Добавить ADB в PATH (рекомендуется)

### Шаг 1: Найти путь к ADB

Обычно ADB находится в одной из следующих директорий:
- `C:\Users\<ВашеИмя>\AppData\Local\Android\Sdk\platform-tools`
- `C:\Users\<ВашеИмя>\AppData\Local\Android\platform-tools`

### Шаг 2: Добавить в PATH

1. Нажмите `Win + R`, введите `sysdm.cpl` и нажмите Enter
2. Перейдите на вкладку **Дополнительно**
3. Нажмите **Переменные среды**
4. В разделе **Системные переменные** найдите переменную `Path`
5. Нажмите **Изменить**
6. Нажмите **Создать** и добавьте путь к `platform-tools` (например: `C:\Users\<ВашеИмя>\AppData\Local\Android\Sdk\platform-tools`)
7. Нажмите **OK** на всех окнах
8. **Перезапустите терминал** (или перезагрузите компьютер)

### Шаг 3: Проверить установку

Откройте новый терминал и выполните:
```powershell
adb version
```

Должна отобразиться версия ADB.

## Решение 2: Запустить приложение вручную на эмуляторе

Если ADB не в PATH, но приложение уже установлено на эмуляторе:

1. **Убедитесь, что Metro bundler запущен:**
   ```powershell
   cd mobile/ward-app
   npm start
   ```

2. **Откройте эмулятор** (если он еще не запущен)

3. **Найдите приложение на эмуляторе:**
   - Найдите иконку приложения "CareMonitoringWard" или "Ward" на главном экране эмулятора
   - Или откройте список всех приложений и найдите приложение

4. **Запустите приложение** тапом на иконку

## Решение 3: Использовать полный путь к ADB

Если вы знаете путь к ADB, можете использовать его напрямую:

```powershell
# Замените путь на ваш
$env:Path += ";C:\Users\<ВашеИмя>\AppData\Local\Android\Sdk\platform-tools"
cd mobile/ward-app
npm run android
```

## Решение 4: Установить Android SDK Platform Tools

Если ADB вообще не установлен:

1. **Через Android Studio (рекомендуется):**
   - Откройте Android Studio
   - **File** → **Settings** (или **Preferences** на macOS)
   - **Appearance & Behavior** → **System Settings** → **Android SDK**
   - Вкладка **SDK Tools**
   - Установите флажок **Android SDK Platform-Tools**
   - Нажмите **Apply** и дождитесь установки

2. **Или скачать напрямую:**
   - Перейдите на https://developer.android.com/tools/releases/platform-tools
   - Скачайте **SDK Platform-Tools для Windows**
   - Распакуйте архив
   - Добавьте путь к распакованной папке в PATH (см. Решение 1)

## Проверка состояния

После добавления ADB в PATH:

```powershell
# Проверить подключенные устройства
adb devices

# Должно показать что-то вроде:
# List of devices attached
# emulator-5554    device
```

## Полный процесс запуска

После настройки ADB:

```powershell
# Терминал 1: Запустить Metro bundler
cd mobile/ward-app
npm start

# Терминал 2: Запустить приложение
cd mobile/ward-app
npm run android
```

## Дополнительные проблемы

### Проблема: "No emulators found"

Создайте эмулятор через Android Studio:
1. Откройте Android Studio
2. **Tools** → **Device Manager**
3. Нажмите **Create Device**
4. Выберите устройство и нажмите **Next**
5. Выберите системный образ (рекомендуется API 33 или выше) и нажмите **Next**
6. Нажмите **Finish**

### Проблема: "Failed to connect to development server"

1. Убедитесь, что Metro bundler запущен (`npm start`)
2. На эмуляторе нажмите `Ctrl+M` (или `Cmd+M` на macOS) → **Reload**
3. Или встряхните эмулятор: `Ctrl+M` → **Dev Settings** → **Debug server host & port** → введите `10.0.2.2:8081`

### Проблема: Приложение крашится при запуске

1. Проверьте логи: `adb logcat | grep -i "error\|exception\|fatal"`
2. Очистите кеш: `npm start -- --reset-cache`
3. Пересоберите: `cd android && ./gradlew clean && cd .. && npm run android`

## Альтернативный способ: Запуск через Android Studio

1. Откройте Android Studio
2. **File** → **Open**
3. Выберите папку `mobile/ward-app/android`
4. Дождитесь синхронизации Gradle
5. Запустите Metro bundler: `npm start` в терминале
6. В Android Studio выберите эмулятор из списка устройств
7. Нажмите кнопку **Run** (▶️)

