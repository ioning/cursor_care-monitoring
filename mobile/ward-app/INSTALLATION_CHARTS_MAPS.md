# Инструкция по установке библиотек графиков и карт

## Шаг 1: Установка npm зависимостей

Библиотеки уже добавлены в `package.json`. Выполните:

```bash
cd mobile/ward-app
npm install
```

Это установит:
- `react-native-chart-kit` - для графиков
- `react-native-svg` - зависимость для графиков
- `react-native-maps` - для карт

## Шаг 2: Настройка для Android

### 2.1. Установка нативных зависимостей

После `npm install` выполните:

```bash
cd android
./gradlew clean
cd ..
```

### 2.2. Получение Google Maps API ключа

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите **Maps SDK for Android**
4. Создайте API ключ в разделе "Credentials"
5. Получите SHA-1 fingerprint вашего keystore:

**Для debug keystore:**
```bash
cd android/app
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Для release keystore:**
```bash
keytool -list -v -keystore release.keystore -alias YOUR_KEY_ALIAS
```

6. Добавьте SHA-1 fingerprint в ограничения API ключа в Google Cloud Console
7. Ограничьте ключ по package name: `com.caremonitoring.ward`

### 2.3. Добавление API ключа в AndroidManifest.xml

Откройте `android/app/src/main/AndroidManifest.xml` и замените `YOUR_GOOGLE_MAPS_API_KEY` на ваш ключ:

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="ВАШ_GOOGLE_MAPS_API_KEY"/>
```

## Шаг 3: Настройка для iOS

### 3.1. Установка CocoaPods зависимостей

```bash
cd ios
pod install
cd ..
```

### 3.2. Получение Google Maps API ключа для iOS

1. В том же проекте Google Cloud Console включите **Maps SDK for iOS**
2. Создайте отдельный API ключ для iOS или используйте тот же
3. Ограничьте ключ по Bundle ID: `com.caremonitoring.ward`

### 3.3. Добавление API ключа в AppDelegate.mm

Откройте `ios/CareMonitoringWard/AppDelegate.mm` и замените `YOUR_GOOGLE_MAPS_API_KEY` на ваш ключ:

```objc
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"ВАШ_GOOGLE_MAPS_API_KEY"];
  // ... остальной код
}
```

**Альтернатива:** Если вы хотите использовать Apple Maps (не требует API ключа, только на iOS), измените в `GuardianDashboardScreen.tsx`:

```typescript
// Замените PROVIDER_GOOGLE на undefined или PROVIDER_DEFAULT
<MapView
  provider={undefined}  // Использует Apple Maps
  ...
/>
```

## Шаг 4: Проверка установки

### Android

```bash
npm run android
```

### iOS

```bash
npm run ios
```

## Что дальше?

После установки:

1. **Графики** автоматически будут отображаться в `TelemetryHistoryScreen`
2. **Карты** автоматически будут отображаться в `GuardianDashboardScreen` для опекунов

## Устранение проблем

### Ошибка: "Google Maps API key not found"

**Android:**
- Проверьте, что API ключ правильно указан в `AndroidManifest.xml`
- Убедитесь, что `Maps SDK for Android` включен в Google Cloud Console
- Проверьте SHA-1 fingerprint в ограничениях API ключа

**iOS:**
- Проверьте, что API ключ правильно указан в `AppDelegate.mm`
- Убедитесь, что `Maps SDK for iOS` включен в Google Cloud Console
- Проверьте Bundle ID в ограничениях API ключа

### Графики не отображаются

1. Убедитесь, что `react-native-svg` установлен:
   ```bash
   npm list react-native-svg
   ```

2. Для Android:
   ```bash
   cd android && ./gradlew clean
   ```

3. Для iOS:
   ```bash
   cd ios && pod install
   ```

4. Перезапустите Metro bundler:
   ```bash
   npm start -- --reset-cache
   ```

### Карта пустая или серая

1. Проверьте API ключ
2. Проверьте подключение к интернету
3. Убедитесь, что местоположения подопечных загружаются из API
4. Проверьте разрешения на геолокацию

## Дополнительная информация

См. [MAPS_AND_CHARTS_SETUP.md](./MAPS_AND_CHARTS_SETUP.md) для подробной документации по настройке.

