# Установка и запуск APK файлов для Android

## Настройка ADB

Для установки APK файлов необходимо установить Android SDK Platform Tools (ADB).

### Вариант 1: Через Android Studio (рекомендуется)

1. Установите **Android Studio** с официального сайта: https://developer.android.com/studio
2. Откройте Android Studio → **Settings** (или **Preferences** на macOS)
3. Перейдите в **Appearance & Behavior** → **System Settings** → **Android SDK**
4. Во вкладке **SDK Tools** установите флажок **Android SDK Platform-Tools**
5. Нажмите **Apply** и дождитесь установки
6. Добавьте путь к ADB в переменную окружения PATH:
   - Windows: `C:\Users\<ВашеИмя>\AppData\Local\Android\Sdk\platform-tools`
   - macOS/Linux: `~/Library/Android/sdk/platform-tools` или `~/Android/Sdk/platform-tools`

### Вариант 2: Прямая установка Platform Tools

1. Скачайте Android SDK Platform Tools: https://developer.android.com/tools/releases/platform-tools
2. Распакуйте архив
3. Добавьте путь к папке `platform-tools` в переменную окружения PATH

### Проверка установки

Откройте терминал и выполните:
```powershell
adb version
```

Должна отобразиться версия ADB (например, `Android Debug Bridge version 1.0.41`).

## Использование

### Вариант 1: Через скрипт PowerShell (рекомендуется)

#### Установка Debug APK:
```powershell
cd mobile/ward-app
npm run android:install:debug
```

#### Установка Release APK:
```powershell
cd mobile/ward-app
npm run android:install:release
```

#### Сборка и установка (все за один раз):
```powershell
cd mobile/ward-app
npm run android:build-and-install
```

#### Установка произвольного APK файла:
```powershell
.\scripts\install-apk.ps1 -ApkPath "путь\к\файлу.apk"
```

### Вариант 2: Через задачи Cursor/VS Code

1. Нажмите `Ctrl+Shift+P` (или `Cmd+Shift+P` на macOS)
2. Введите "Tasks: Run Task"
3. Выберите одну из задач:
   - **Android: Install APK** - установка debug APK
   - **Android: Install APK (Debug)** - установка debug APK
   - **Android: Install APK (Release)** - установка release APK
   - **Android: Build and Install APK** - сборка и установка
   - **Android: Check ADB Devices** - проверка подключенных устройств
   - **Android: Run App** - запуск через React Native CLI

### Вариант 3: Через командную строку ADB

#### Проверка подключенных устройств:
```powershell
adb devices
```

#### Установка APK:
```powershell
adb install -r mobile/ward-app/android/app/build/outputs/apk/debug/app-debug.apk
```

#### Установка с заменой существующего приложения:
```powershell
adb install -r путь\к\app.apk
```

#### Запуск приложения после установки:
```powershell
adb shell am start -n com.caremonitoring.ward/.MainActivity
```

#### Удаление приложения:
```powershell
adb uninstall com.caremonitoring.ward
```

## Подготовка устройства/эмулятора

### Реальное устройство:

1. На устройстве откройте **Настройки** → **О телефоне**
2. Нажмите 7 раз на **Номер сборки** (чтобы включить режим разработчика)
3. Вернитесь в **Настройки** → **Для разработчиков**
4. Включите **Отладка по USB**
5. Подключите устройство к компьютеру через USB
6. На устройстве подтвердите запрос на разрешение отладки

### Эмулятор:

1. Запустите Android Studio
2. Откройте **Device Manager** (иконка устройства в правом верхнем углу)
3. Создайте новый виртуальный device или запустите существующий
4. Эмулятор автоматически доступен через ADB

## Расположение APK файлов

После сборки APK файлы находятся в:

- **Debug APK**: `mobile/ward-app/android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `mobile/ward-app/android/app/build/outputs/apk/release/app-release.apk`

## Решение проблем

### Ошибка: "ADB не найден"
- Убедитесь, что Android SDK Platform Tools установлены
- Проверьте, что путь к `platform-tools` добавлен в PATH
- Перезапустите терминал после изменения PATH

### Ошибка: "Не найдено подключенных устройств"
- Убедитесь, что устройство подключено по USB или эмулятор запущен
- Проверьте, что включена отладка по USB на устройстве
- Попробуйте выполнить `adb kill-server && adb start-server`

### Ошибка: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"
- Удалите старое приложение: `adb uninstall com.caremonitoring.ward`
- Или установите с флагом `-r` (замена): `adb install -r путь\к\apk`

### Ошибка: "INSTALL_PARSE_FAILED"
- Пересоберите APK файл
- Убедитесь, что APK файл не поврежден

## Полезные команды ADB

```powershell
# Список подключенных устройств
adb devices

# Перезапуск ADB сервера
adb kill-server
adb start-server

# Установка APK
adb install -r путь\к\app.apk

# Удаление приложения
adb uninstall com.caremonitoring.ward

# Запуск приложения
adb shell am start -n com.caremonitoring.ward/.MainActivity

# Остановка приложения
adb shell am force-stop com.caremonitoring.ward

# Просмотр логов
adb logcat

# Очистка данных приложения
adb shell pm clear com.caremonitoring.ward

# Скриншот
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

## Автоматизация

Все задачи для работы с Android доступны через:

1. **Tasks в Cursor/VS Code** (`Ctrl+Shift+P` → "Tasks: Run Task")
2. **NPM скрипты** в `mobile/ward-app/package.json`
3. **PowerShell скрипты** в папке `scripts/`

