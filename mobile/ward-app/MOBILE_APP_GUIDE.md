# Руководство по мобильному приложению

## Обзор

Мобильное приложение для подопечных (wards) в системе Care Monitoring. Позволяет отслеживать здоровье, получать уведомления и вызывать экстренную помощь.

## Архитектура

### Технологический стек

- **React Native 0.72** - кроссплатформенный фреймворк
- **TypeScript** - типизация
- **Redux Toolkit** - управление состоянием
- **React Navigation** - навигация
- **React Native BLE PLX** - Bluetooth Low Energy
- **React Native Geolocation** - геолокация
- **React Native Push Notifications** - push уведомления

### Структура проекта

```
mobile/ward-app/
├── src/
│   ├── screens/          # Экраны приложения
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── SOSScreen.tsx
│   │   ├── AlertsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── navigation/      # Навигация
│   │   └── AppNavigator.tsx
│   ├── store/           # Redux store
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── authSlice.ts
│   │       ├── deviceSlice.ts
│   │       ├── telemetrySlice.ts
│   │       ├── locationSlice.ts
│   │       └── alertSlice.ts
│   ├── services/        # Сервисы
│   │   ├── ApiClient.ts
│   │   ├── AuthService.ts
│   │   ├── DeviceService.ts
│   │   ├── TelemetryService.ts
│   │   ├── AlertService.ts
│   │   ├── BluetoothService.ts
│   │   ├── LocationService.ts
│   │   ├── ApiLocationService.ts
│   │   └── NotificationService.ts
│   ├── types/           # TypeScript типы
│   │   └── index.ts
│   └── utils/           # Утилиты
│       └── constants.ts
├── App.tsx              # Главный компонент
├── index.js             # Точка входа
└── package.json
```

## Функциональность

### ✅ Реализовано

1. **Аутентификация**
   - Логин с email и паролем
   - Сохранение токенов
   - Автоматическое обновление токенов
   - Проверка авторизации при запуске

2. **Dashboard**
   - Отображение текущих показателей (пульс, шаги, температура)
   - Статус подключенного устройства
   - Текущее местоположение

3. **SOS экран**
   - Кнопка экстренного вызова
   - Автоматическая отправка местоположения
   - Виброотклик при нажатии

4. **Алерты**
   - Список всех алертов
   - Фильтрация по серьезности
   - Отметка как прочитанных
   - Pull-to-refresh

5. **Настройки**
   - Профиль пользователя
   - Включение/выключение отслеживания местоположения
   - Выход из аккаунта

6. **Геолокация**
   - Автоматическое отслеживание местоположения
   - Отправка координат на сервер
   - Обновление каждые 10 метров

7. **Bluetooth LE**
   - Сканирование устройств
   - Подключение к устройствам
   - Получение телеметрии
   - Автоматическая отправка данных

8. **Push уведомления**
   - Получение уведомлений
   - Обработка нажатий
   - Локальные уведомления

## Установка и запуск

### Требования

- Node.js 18+
- React Native CLI
- Android Studio (для Android)
- Xcode 14+ (для iOS, только macOS)

### Установка зависимостей

```bash
cd mobile/ward-app
npm install
```

### iOS

```bash
cd ios
pod install
cd ..
npm run ios
```

### Android

```bash
npm run android
```

## Конфигурация

### Переменные окружения

Создайте файл `.env`:

```
API_BASE_URL=http://localhost:3000/api/v1
```

### Разрешения

#### Android (android/app/src/main/AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
```

#### iOS (ios/CareMonitoringWard/Info.plist)

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Приложению необходимо ваше местоположение для отслеживания</string>
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Приложению необходим Bluetooth для подключения к устройствам мониторинга</string>
```

## Разработка

### Запуск Metro bundler

```bash
npm start
```

### Запуск на устройстве/эмуляторе

```bash
# Android
npm run android

# iOS
npm run ios
```

### Отладка

- **React Native Debugger** - для отладки Redux и React
- **Flipper** - для отладки сети, логов, и т.д.
- **Chrome DevTools** - для отладки JavaScript

## Сборка

### Android (Release)

```bash
cd android
./gradlew assembleRelease
```

APK будет в `android/app/build/outputs/apk/release/`

### iOS (Release)

```bash
cd ios
xcodebuild -workspace CareMonitoringWard.xcworkspace \
  -scheme CareMonitoringWard \
  -configuration Release \
  -archivePath build/CareMonitoringWard.xcarchive \
  archive
```

## Тестирование

```bash
npm test
```

## Что нужно доработать

### Высокий приоритет

1. **Офлайн режим**
   - Кэширование данных
   - Синхронизация при восстановлении связи
   - Очередь запросов

2. **Улучшение Bluetooth**
   - Автоматическое переподключение
   - Обработка ошибок
   - Поддержка разных типов устройств

3. **Геозоны**
   - Уведомления о выходе из зон
   - Визуализация зон на карте

4. **История телеметрии**
   - Графики показателей
   - Экспорт данных

### Средний приоритет

1. **Улучшения UI/UX**
   - Темная тема
   - Анимации
   - Улучшенные графики

2. **Дополнительные функции**
   - Медицинские записи
   - Напоминания о приеме лекарств
   - Связь с опекунами

3. **Производительность**
   - Оптимизация рендеринга
   - Ленивая загрузка
   - Оптимизация изображений

## Troubleshooting

### Проблемы с Bluetooth

- Убедитесь, что Bluetooth включен
- Проверьте разрешения
- Перезапустите приложение

### Проблемы с геолокацией

- Проверьте разрешения
- Убедитесь, что GPS включен
- Проверьте настройки приватности

### Проблемы с API

- Проверьте `API_BASE_URL`
- Убедитесь, что сервер запущен
- Проверьте токен авторизации

## Лицензия

Proprietary

