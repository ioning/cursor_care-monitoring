# Настройка аудио для звонков (громкая связь)

Библиотека `react-native-incall-manager` уже добавлена в `package.json`. 

## Установка зависимостей

### 1. Установите npm-пакеты

```bash
cd mobile/ward-app
npm install
```

### 2. iOS - установите CocoaPods зависимости

```bash
cd ios
pod install
cd ..
```

### 3. Android

Дополнительная настройка не требуется после установки пакета.

## Разрешения

### Android

Убедитесь, что в `android/app/src/main/AndroidManifest.xml` есть разрешение:

```xml
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### iOS

В `ios/CareMonitoringWard/Info.plist` должно быть:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Приложению необходим доступ к микрофону для звонков</string>
```

## Текущее поведение

- ✅ Автоматический прием звонка через **4 секунды** (реализовано)
- ✅ Включение громкой связи при принятии звонка (реализовано через `react-native-incall-manager`)

## Использование

`AudioService` автоматически используется в `IncomingCallScreen` при принятии звонка. Громкая связь включается автоматически при автоответе через 4 секунды или при ручном принятии звонка.

