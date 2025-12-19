# Стабильная конфигурация Gradle для React Native

## Проблема

React Native Gradle Plugin несовместим с Gradle 9.2.1, так как в Gradle 9.0 были удалены устаревшие API (`SelfResolvingDependency` и другие).

## Решение

Использована стабильная комбинация версий, проверенная на совместимость с React Native 0.72.6:

### Конфигурация

| Компонент | Версия | Причина |
|-----------|--------|---------|
| Gradle | 8.10.2 | Стабильная версия, поддерживает Java 21, совместим с RN |
| Android Gradle Plugin | 8.7.3 | Совместим с Gradle 8.10.2 и React Native |
| Kotlin Plugin | 1.9.24 | Совместим с Gradle 8.10.2 |
| Java | 21 | Поддерживается Gradle 8.10.2 |
| Kotlin Language/API | 1.9 | Совместим с React Native Plugin |

## Изменения в файлах

### 1. gradle-wrapper.properties
```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-all.zip
```

### 2. build.gradle (root)
```gradle
classpath("com.android.tools.build:gradle:8.7.3")
kotlinVersion = "1.9.24"
```

### 3. app/build.gradle
Добавлены `packagingOptions` для предотвращения конфликтов ресурсов:
```gradle
packagingOptions {
    resources {
        excludes += '/META-INF/{AL2.0,LGPL2.1}'
    }
}
```

## Очистка кэша

Выполните следующие команды перед синхронизацией:

```powershell
cd android

# Остановите все Gradle daemon'ы
.\gradlew.bat --stop

# Очистите кэш Gradle
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches

# Удалите кэш проекта
Remove-Item -Recurse -Force .gradle

# Удалите кэш wrapper'а (опционально)
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\wrapper\dists\gradle-9.2.1-all
```

## Синхронизация проекта

1. **В Android Studio:**
   - File → Invalidate Caches / Restart
   - Выберите "Invalidate and Restart"
   - После перезапуска: File → Sync Project with Gradle Files

2. **Или через командную строку:**
   ```powershell
   cd android
   .\gradlew.bat clean
   .\gradlew.bat build
   ```

## Проверка сборки

После синхронизации проверьте сборку:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Если сборка успешна, можно собрать release APK:

```powershell
.\gradlew.bat assembleRelease
```

## Почему эта конфигурация работает?

1. **Gradle 8.10.2**:
   - Последняя стабильная версия серии 8.x
   - Поддерживает Java 21
   - Не содержит breaking changes из Gradle 9.0
   - Совместим с React Native Gradle Plugin

2. **Android Gradle Plugin 8.7.3**:
   - Совместим с Gradle 8.10.2
   - Проверен на совместимость с React Native 0.72.6
   - Стабильная версия без известных проблем

3. **Kotlin 1.9.24**:
   - Совместим с Gradle 8.10.2
   - Совместим с React Native Gradle Plugin
   - Поддерживает современные возможности Kotlin

## Альтернативные решения

Если проблема сохранится:

1. **Проверьте версию React Native:**
   ```bash
   npm list react-native
   ```
   Обновите до последней версии, если нужно.

2. **Используйте Gradle 8.9:**
   ```properties
   distributionUrl=https\://services.gradle.org/distributions/gradle-8.9-all.zip
   ```

3. **Используйте Kotlin 1.8.22:**
   ```gradle
   kotlinVersion = "1.8.22"
   ```

## Дополнительная информация

- [Gradle 8.10 Release Notes](https://docs.gradle.org/8.10/release-notes.html)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

