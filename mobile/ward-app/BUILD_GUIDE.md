# Руководство по сборке мобильного приложения

Это руководство поможет вам собрать мобильное приложение Care Monitoring для Android и iOS.

## Предварительные требования

### Для Android:
- Node.js >= 18.0.0
- Java Development Kit (JDK) 11 или выше
- Android Studio (последняя версия)
- Android SDK (API Level 23+)
- Gradle 7.6.1+

### Для iOS:
- Node.js >= 18.0.0
- Xcode 14.0 или выше
- CocoaPods (`sudo gem install cocoapods`)
- macOS (обязательно для сборки iOS)

## Установка зависимостей

```bash
# Установка npm зависимостей
npm install

# Для iOS: установка CocoaPods зависимостей
cd ios && pod install && cd ..
```

## Сборка для Android

### Debug сборка

```bash
# Через npm скрипт
npm run build:android:debug

# Или напрямую через Gradle
cd android && ./gradlew assembleDebug && cd ..
```

APK будет находиться в: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release сборка (APK)

1. **Создание keystore для подписи:**

```bash
# Используйте скрипт для генерации
./scripts/generate-keystore.sh

# Или вручную:
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore \
    -alias care-monitoring-release -keyalg RSA -keysize 2048 -validity 10000
```

2. **Настройка gradle.properties:**

Скопируйте `android/gradle.properties.example` в `android/gradle.properties` и заполните:

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=care-monitoring-release
MYAPP_RELEASE_STORE_PASSWORD=ваш-пароль-хранилища
MYAPP_RELEASE_KEY_PASSWORD=ваш-пароль-ключа
```

3. **Сборка release APK:**

```bash
# Через npm скрипт
npm run build:android

# Или напрямую
cd android && ./gradlew assembleRelease && cd ..
```

APK будет находиться в: `android/app/build/outputs/apk/release/app-release.apk`

### Сборка Android App Bundle (AAB)

Для публикации в Google Play Store рекомендуется использовать AAB:

```bash
npm run build:android:bundle
```

AAB будет находиться в: `android/app/build/outputs/bundle/release/app-release.aab`

## Сборка для iOS

### Debug сборка

```bash
# Запуск на симуляторе
npm run ios

# Или через Xcode:
# 1. Откройте ios/CareMonitoringWard.xcworkspace в Xcode
# 2. Выберите симулятор или устройство
# 3. Нажмите Run (⌘R)
```

### Release сборка (IPA)

1. **Откройте проект в Xcode:**
```bash
open ios/CareMonitoringWard.xcworkspace
```

2. **Настройте подпись:**
   - Выберите проект в навигаторе
   - Перейдите в "Signing & Capabilities"
   - Выберите вашу команду разработчика (Team)
   - Убедитесь, что Bundle Identifier уникален

3. **Создайте Archive:**
   - В Xcode выберите Product > Scheme > Edit Scheme
   - Установите Build Configuration в "Release"
   - Выберите Product > Archive

4. **Экспорт IPA:**
   - После создания Archive откроется окно Organizer
   - Выберите ваш Archive и нажмите "Distribute App"
   - Следуйте инструкциям для экспорта IPA

## Скрипты сборки

### Android

- `npm run build:android` - Сборка release APK
- `npm run build:android:debug` - Сборка debug APK
- `npm run build:android:bundle` - Сборка release AAB
- `npm run clean:android` - Очистка Android сборки

### iOS

- `npm run ios` - Запуск на iOS симуляторе/устройстве
- `npm run build:ios` - Установка CocoaPods (требуется Xcode для сборки)
- `npm run clean:ios` - Очистка iOS сборки

## Разрешения

### Android
Все необходимые разрешения уже настроены в `AndroidManifest.xml`:
- Интернет
- Геолокация (точная и приблизительная, фоновая)
- Bluetooth
- Камера
- Хранилище
- Уведомления

### iOS
Все необходимые разрешения настроены в `Info.plist` с описаниями на русском языке.

## Устранение проблем

### Android

**Проблема:** `SDK location not found`
**Решение:** Создайте файл `android/local.properties`:
```properties
sdk.dir=/path/to/your/Android/sdk
```

**Проблема:** Ошибки сборки Gradle
**Решение:** 
```bash
cd android
./gradlew clean
cd ..
npm install
```

**Проблема:** Ошибки с зависимостями
**Решение:**
```bash
cd android
./gradlew --refresh-dependencies
cd ..
```

### iOS

**Проблема:** Ошибки с CocoaPods
**Решение:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Проблема:** Ошибки подписи
**Решение:** Убедитесь, что:
- У вас есть активная подписка Apple Developer
- Bundle Identifier уникален
- Вы выбрали правильную команду в Xcode

**Проблема:** Ошибки сборки в Xcode
**Решение:**
```bash
cd ios
rm -rf build Pods Podfile.lock
pod install
# Откройте .xcworkspace (не .xcodeproj!)
```

## Публикация

### Google Play Store

1. Создайте AAB файл: `npm run build:android:bundle`
2. Войдите в [Google Play Console](https://play.google.com/console)
3. Создайте новое приложение или выберите существующее
4. Загрузите AAB файл в разделе "Production" или "Internal testing"

### Apple App Store

1. Создайте Archive в Xcode (см. раздел "Release сборка")
2. В Organizer выберите "Distribute App"
3. Выберите "App Store Connect"
4. Следуйте инструкциям для загрузки в App Store Connect

## Дополнительные ресурсы

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Android Developer Guide](https://developer.android.com/studio/publish)
- [Apple App Store Connect](https://developer.apple.com/app-store-connect/)



Это руководство поможет вам собрать мобильное приложение Care Monitoring для Android и iOS.

## Предварительные требования

### Для Android:
- Node.js >= 18.0.0
- Java Development Kit (JDK) 11 или выше
- Android Studio (последняя версия)
- Android SDK (API Level 23+)
- Gradle 7.6.1+

### Для iOS:
- Node.js >= 18.0.0
- Xcode 14.0 или выше
- CocoaPods (`sudo gem install cocoapods`)
- macOS (обязательно для сборки iOS)

## Установка зависимостей

```bash
# Установка npm зависимостей
npm install

# Для iOS: установка CocoaPods зависимостей
cd ios && pod install && cd ..
```

## Сборка для Android

### Debug сборка

```bash
# Через npm скрипт
npm run build:android:debug

# Или напрямую через Gradle
cd android && ./gradlew assembleDebug && cd ..
```

APK будет находиться в: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release сборка (APK)

1. **Создание keystore для подписи:**

```bash
# Используйте скрипт для генерации
./scripts/generate-keystore.sh

# Или вручную:
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/release.keystore \
    -alias care-monitoring-release -keyalg RSA -keysize 2048 -validity 10000
```

2. **Настройка gradle.properties:**

Скопируйте `android/gradle.properties.example` в `android/gradle.properties` и заполните:

```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=care-monitoring-release
MYAPP_RELEASE_STORE_PASSWORD=ваш-пароль-хранилища
MYAPP_RELEASE_KEY_PASSWORD=ваш-пароль-ключа
```

3. **Сборка release APK:**

```bash
# Через npm скрипт
npm run build:android

# Или напрямую
cd android && ./gradlew assembleRelease && cd ..
```

APK будет находиться в: `android/app/build/outputs/apk/release/app-release.apk`

### Сборка Android App Bundle (AAB)

Для публикации в Google Play Store рекомендуется использовать AAB:

```bash
npm run build:android:bundle
```

AAB будет находиться в: `android/app/build/outputs/bundle/release/app-release.aab`

## Сборка для iOS

### Debug сборка

```bash
# Запуск на симуляторе
npm run ios

# Или через Xcode:
# 1. Откройте ios/CareMonitoringWard.xcworkspace в Xcode
# 2. Выберите симулятор или устройство
# 3. Нажмите Run (⌘R)
```

### Release сборка (IPA)

1. **Откройте проект в Xcode:**
```bash
open ios/CareMonitoringWard.xcworkspace
```

2. **Настройте подпись:**
   - Выберите проект в навигаторе
   - Перейдите в "Signing & Capabilities"
   - Выберите вашу команду разработчика (Team)
   - Убедитесь, что Bundle Identifier уникален

3. **Создайте Archive:**
   - В Xcode выберите Product > Scheme > Edit Scheme
   - Установите Build Configuration в "Release"
   - Выберите Product > Archive

4. **Экспорт IPA:**
   - После создания Archive откроется окно Organizer
   - Выберите ваш Archive и нажмите "Distribute App"
   - Следуйте инструкциям для экспорта IPA

## Скрипты сборки

### Android

- `npm run build:android` - Сборка release APK
- `npm run build:android:debug` - Сборка debug APK
- `npm run build:android:bundle` - Сборка release AAB
- `npm run clean:android` - Очистка Android сборки

### iOS

- `npm run ios` - Запуск на iOS симуляторе/устройстве
- `npm run build:ios` - Установка CocoaPods (требуется Xcode для сборки)
- `npm run clean:ios` - Очистка iOS сборки

## Разрешения

### Android
Все необходимые разрешения уже настроены в `AndroidManifest.xml`:
- Интернет
- Геолокация (точная и приблизительная, фоновая)
- Bluetooth
- Камера
- Хранилище
- Уведомления

### iOS
Все необходимые разрешения настроены в `Info.plist` с описаниями на русском языке.

## Устранение проблем

### Android

**Проблема:** `SDK location not found`
**Решение:** Создайте файл `android/local.properties`:
```properties
sdk.dir=/path/to/your/Android/sdk
```

**Проблема:** Ошибки сборки Gradle
**Решение:** 
```bash
cd android
./gradlew clean
cd ..
npm install
```

**Проблема:** Ошибки с зависимостями
**Решение:**
```bash
cd android
./gradlew --refresh-dependencies
cd ..
```

### iOS

**Проблема:** Ошибки с CocoaPods
**Решение:**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**Проблема:** Ошибки подписи
**Решение:** Убедитесь, что:
- У вас есть активная подписка Apple Developer
- Bundle Identifier уникален
- Вы выбрали правильную команду в Xcode

**Проблема:** Ошибки сборки в Xcode
**Решение:**
```bash
cd ios
rm -rf build Pods Podfile.lock
pod install
# Откройте .xcworkspace (не .xcodeproj!)
```

## Публикация

### Google Play Store

1. Создайте AAB файл: `npm run build:android:bundle`
2. Войдите в [Google Play Console](https://play.google.com/console)
3. Создайте новое приложение или выберите существующее
4. Загрузите AAB файл в разделе "Production" или "Internal testing"

### Apple App Store

1. Создайте Archive в Xcode (см. раздел "Release сборка")
2. В Organizer выберите "Distribute App"
3. Выберите "App Store Connect"
4. Следуйте инструкциям для загрузки в App Store Connect

## Дополнительные ресурсы

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Android Developer Guide](https://developer.android.com/studio/publish)
- [Apple App Store Connect](https://developer.apple.com/app-store-connect/)







