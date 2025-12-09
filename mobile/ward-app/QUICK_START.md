# Быстрый старт - Мобильное приложение

## 🚀 Быстрая сборка APK

### Android (Debug)

```bash
cd mobile/ward-app
npm install
npm run build:android:debug
```

APK будет в: `android/app/build/outputs/apk/debug/app-debug.apk`

### Android (Release)

1. Создайте keystore:
```bash
cd mobile/ward-app
./scripts/generate-keystore.sh
```

2. Настройте `android/gradle.properties`:
```properties
MYAPP_RELEASE_STORE_FILE=release.keystore
MYAPP_RELEASE_KEY_ALIAS=care-monitoring-release
MYAPP_RELEASE_STORE_PASSWORD=ваш-пароль
MYAPP_RELEASE_KEY_PASSWORD=ваш-пароль
```

3. Соберите APK:
```bash
npm run build:android
```

APK будет в: `android/app/build/outputs/apk/release/app-release.apk`

## 📱 Установка на устройство

### Android

```bash
# Через ADB
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Или просто подключите устройство и запустите
npm run android
```

### iOS

```bash
# Откройте в Xcode
open ios/CareMonitoringWard.xcworkspace

# Выберите устройство и нажмите Run (⌘R)
```

## ⚙️ Предварительные требования

- **Node.js** >= 18.0.0
- **Android**: Android Studio, JDK 11+
- **iOS**: Xcode 14+, CocoaPods (только macOS)

## 📚 Подробная документация

- [BUILD_GUIDE.md](./BUILD_GUIDE.md) - полное руководство по сборке
- [README.md](./README.md) - общая информация о проекте
