# Конфигурация для Gradle 8.14.1

## Текущая конфигурация

### Версии компонентов

| Компонент | Версия | Назначение |
|-----------|--------|------------|
| Java | 21.0.8 | ✅ Поддерживается Gradle 8.14.1 |
| Gradle | 8.14.1 | ✅ Имеет API serviceOf, поддерживает Java 21 |
| Kotlin Plugin | 1.7.22 | ✅ Совместим с React Native 0.72.6 |
| Android Gradle Plugin | 8.7.3 | ✅ Совместим с Gradle 8.14.1 |
| kotlin-stdlib (принудительно) | 1.7.22 | ✅ Совместим с RN Plugin |
| Kotlin Language/API | 1.7 | ✅ Совместим с RN Plugin |
| React Native | 0.72.6 | ✅ Совместим |

## Ключевые настройки

### 1. Принудительное использование kotlin-stdlib 1.7.22

В `android/build.gradle`:
```gradle
configurations.all {
    resolutionStrategy {
        force 'org.jetbrains.kotlin:kotlin-stdlib:1.7.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.7.22'
        force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.7.22'
    }
}
```

Это необходимо, так как Gradle 8.14.1 использует Kotlin 1.9.x в своей библиотеке, но React Native Gradle Plugin ожидает Kotlin 1.7.1.

### 2. Kotlin Compiler Settings

```gradle
kotlinOptions {
    jvmTarget = '21'
    languageVersion = '1.7'
    apiVersion = '1.7'
    freeCompilerArgs += ['-Xjvm-default=all']
}
```

### 3. Java Compatibility

```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_21
    targetCompatibility JavaVersion.VERSION_21
}
```

## Почему Gradle 8.14.1?

1. **Поддерживает Java 21**: Полная поддержка современных возможностей Java 21
2. **Имеет API serviceOf**: Необходимо для React Native Gradle Plugin
3. **Стабильная версия**: Последняя версия серии 8.x
4. **Совместимость**: Работает с React Native 0.72.6 при правильной настройке kotlin-stdlib

## Очистка кэша

Перед синхронизацией выполните:

```powershell
cd android

# Остановите все Gradle daemon'ы
.\gradlew.bat --stop

# Очистите кэш Gradle
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches

# Удалите кэш проекта
Remove-Item -Recurse -Force .gradle
```

## Синхронизация проекта

В Android Studio:
1. File → Invalidate Caches / Restart
2. Выберите "Invalidate and Restart"
3. После перезапуска: File → Sync Project with Gradle Files

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

## Возможные проблемы

### Проблема: Ошибки совместимости Kotlin

Если все еще возникают ошибки о несовместимости Kotlin:

1. Убедитесь, что `resolutionStrategy.force` применен правильно
2. Очистите кэш полностью
3. Проверьте, что все модули используют kotlin-stdlib 1.7.22

### Проблема: API serviceOf не найден

Если ошибка `serviceOf` сохраняется:

1. Убедитесь, что используется Gradle 8.14.1 (не 9.x)
2. Проверьте, что React Native Gradle Plugin обновлен до последней версии

## Дополнительная информация

- [Gradle 8.14.1 Release Notes](https://docs.gradle.org/8.14.1/release-notes.html)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

