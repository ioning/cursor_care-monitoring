# Проблемы сборки APK и решения

## Текущая проблема

При попытке собрать APK возникает конфликт версий:
- **React Native 0.72.6** требует **Kotlin 1.7.1**
- **Gradle 8.x** использует **Kotlin 1.9.0+**
- **Gradle 7.6** не поддерживает **Java 21** (требует Java 17)

## Решения

### Вариант 1: Использовать Android Studio (Рекомендуется)

1. Откройте Android Studio
2. File → Open → выберите `mobile/ward-app/android`
3. Дождитесь синхронизации Gradle
4. Build → Build Bundle(s) / APK(s) → Build APK(s)
5. APK будет создан в `android/app/build/outputs/apk/debug/`

### Вариант 2: Использовать Java 17

1. Установите Java 17 (JDK 17)
2. Установите переменную окружения `JAVA_HOME` на путь к JDK 17
3. Запустите сборку:
   ```powershell
   cd mobile/ward-app/android
   $env:JAVA_HOME = "C:\path\to\jdk-17"
   .\gradlew.bat assembleDebug
   ```

### Вариант 3: Обновить React Native

Обновите React Native до версии, совместимой с Gradle 8.x и Kotlin 1.9+:
```bash
cd mobile/ward-app
npm install react-native@latest
```

### Вариант 4: Использовать EAS Build (Expo Application Services)

Если проект поддерживает Expo:
```bash
npm install -g eas-cli
eas build --platform android
```

## Текущая конфигурация

- **React Native:** 0.72.6
- **Gradle:** 7.6 (после изменений)
- **Kotlin:** 1.8.0
- **Java:** 21 (несовместимо с Gradle 7.6)

## Рекомендации

Для production сборки рекомендуется:
1. Использовать Android Studio для сборки
2. Настроить keystore для подписи release APK
3. Использовать CI/CD для автоматической сборки

## Дополнительная информация

- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Gradle Compatibility Matrix](https://docs.gradle.org/current/userguide/compatibility.html)
- [Kotlin Version Compatibility](https://kotlinlang.org/docs/compatibility-guide.html)

