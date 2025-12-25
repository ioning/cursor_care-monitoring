# Быстрый старт мобильного приложения

## Установка зависимостей

```bash
cd mobile/ward-app
npm install

# Для iOS (только на macOS)
cd ios && pod install && cd ..
```

## Запуск для разработки

### Android

```bash
# Запустить Metro bundler
npm start

# В другом терминале - запустить на Android
npm run android
```

### iOS

```bash
# Запустить Metro bundler
npm start

# В другом терминале - запустить на iOS
npm run ios
```

## Настройка API URL

Базовый URL API определяется автоматически в `src/utils/apiBaseUrl.ts`:
- **Android emulator**: `http://10.0.2.2:3000/api/v1`
- **Physical device**: автоматически определяется IP адрес Metro bundler
- **iOS simulator**: `http://localhost:3000/api/v1`
- **Production**: `https://api.caremonitoring.com/api/v1`

**Важно:** Убедитесь, что API Gateway запущен и слушает на всех интерфейсах (`0.0.0.0:3000`), а не только на localhost.

## Быстрая сборка релиза

### Android APK

```bash
cd android
./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

### Android AAB (для Google Play)

```bash
cd android
./gradlew bundleRelease
# AAB: android/app/build/outputs/bundle/release/app-release.aab
```

### iOS

1. Откройте `ios/CareMonitoringWard.xcworkspace` в Xcode
2. Product → Archive
3. Distribute App

**Подробные инструкции:** См. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
