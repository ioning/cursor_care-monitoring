# Руководство по сборке APK

## Требования

Для сборки Android APK необходимо установить:

1. **Java Development Kit (JDK) 11 или выше**
   - Рекомендуется: Eclipse Adoptium (OpenJDK) - https://adoptium.net/
   - Или Oracle JDK - https://www.oracle.com/java/technologies/downloads/
   - Или установите Android Studio (включает встроенный JDK)

2. **Android SDK**
   - Установите через Android Studio: https://developer.android.com/studio
   - Или используйте Command Line Tools: https://developer.android.com/studio#command-tools

3. **Node.js и npm** (уже установлены)

## Быстрая настройка

### Автоматическая проверка окружения

```powershell
# Из директории mobile/ward-app
.\scripts\setup-android-env.ps1
```

Скрипт автоматически:
- Найдет установленные Java и Android SDK
- Создаст файл `android/local.properties` с путем к SDK
- Покажет инструкции по настройке переменных окружения

### Ручная настройка

1. **Установите переменные окружения** (опционально, но рекомендуется):

```powershell
# Установить JAVA_HOME (замените путь на ваш)
setx JAVA_HOME "C:\Program Files\Java\jdk-17"

# Установить ANDROID_HOME (замените путь на ваш)
setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"

# Добавить в PATH
setx PATH "$env:PATH;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\tools"
```

2. **Перезапустите терминал** после установки переменных

3. **Создайте local.properties** (если не создан автоматически):

Создайте файл `android/local.properties`:
```
sdk.dir=C:/Users/YOUR_USERNAME/AppData/Local/Android/Sdk
```
Замените путь на ваш реальный путь к Android SDK.

## Сборка APK

### Debug версия (для тестирования)

```powershell
npm run build:android:debug
```

APK файл будет создан в:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Release версия (для публикации)

**Внимание:** Release версия требует keystore для подписи.

1. **Создайте keystore** (если еще нет):

```powershell
# Используйте скрипт или создайте вручную
.\scripts\generate-keystore.sh
```

Или вручную:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. **Настройте gradle.properties**:

Создайте или отредактируйте `android/gradle.properties`:
```
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

3. **Соберите Release APK**:

```powershell
npm run build:android
```

APK файл будет создан в:
```
android/app/build/outputs/apk/release/app-release.apk
```

### Android App Bundle (AAB) для Google Play

```powershell
npm run build:android:bundle
```

AAB файл будет создан в:
```
android/app/build/outputs/bundle/release/app-release.aab
```

## Устранение проблем

### Ошибка: JAVA_HOME is not set

Установите переменную окружения JAVA_HOME:
```powershell
setx JAVA_HOME "C:\Program Files\Java\jdk-17"
```
Перезапустите терминал.

### Ошибка: Android SDK not found

1. Установите Android Studio
2. Откройте Android Studio → SDK Manager
3. Установите необходимые компоненты SDK
4. Создайте `android/local.properties` с путем к SDK

### Ошибка: Gradle build failed

1. Очистите проект:
```powershell
npm run clean:android
```

2. Удалите кеш Gradle:
```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches"
```

3. Переустановите зависимости:
```powershell
cd android
.\gradlew clean
cd ..
npm install
```

### Ошибка: NDK not found

Установите NDK через Android Studio:
1. Android Studio → SDK Manager
2. SDK Tools → установите NDK (Side by side)
3. Или установите через командную строку:
```powershell
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
& "$sdk\cmdline-tools\latest\bin\sdkmanager.bat" "ndk;23.1.7779620"
```

## Проверка установленных компонентов

```powershell
# Проверить Java
java -version

# Проверить Android SDK
$env:ANDROID_HOME
# или
$env:ANDROID_SDK_ROOT

# Проверить Gradle
cd android
.\gradlew.bat --version
```

## Дополнительная информация

- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Android Developer Guide](https://developer.android.com/studio/build)
- [Signing Your App](https://reactnative.dev/docs/signed-apk-android)

