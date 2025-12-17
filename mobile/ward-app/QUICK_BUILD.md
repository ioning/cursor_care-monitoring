# Быстрая сборка APK

## Текущий статус

Для сборки APK необходимо установить:

1. ✅ **Node.js и npm** - уже установлены
2. ❌ **Java JDK 11+** - требуется установка
3. ❌ **Android SDK** - требуется установка

## Быстрая установка

### Вариант 1: Установка Android Studio (рекомендуется)

Android Studio включает в себя и JDK, и Android SDK:

1. Скачайте и установите: https://developer.android.com/studio
2. При первом запуске Android Studio автоматически установит:
   - JDK (Java Development Kit)
   - Android SDK
   - Необходимые инструменты

### Вариант 2: Установка компонентов отдельно

1. **Установите JDK:**
   - Eclipse Adoptium: https://adoptium.net/ (рекомендуется)
   - Или Oracle JDK: https://www.oracle.com/java/technologies/downloads/

2. **Установите Android SDK:**
   - Через Android Studio (SDK Manager)
   - Или Command Line Tools: https://developer.android.com/studio#command-tools

## После установки

1. **Проверьте окружение:**
   ```powershell
   .\scripts\setup-android-env.ps1
   ```

2. **Соберите Debug APK:**
   ```powershell
   npm run build:android:debug
   ```

   APK будет в: `android/app/build/outputs/apk/debug/app-debug.apk`

3. **Или соберите Release APK** (требует настройки keystore):
   ```powershell
   npm run build:android
   ```

## Подробная документация

См. [BUILD_APK_GUIDE.md](./BUILD_APK_GUIDE.md) для детальных инструкций.

