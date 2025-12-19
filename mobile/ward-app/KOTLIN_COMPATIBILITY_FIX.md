# Исправление проблемы совместимости Kotlin

## Проблема

React Native Gradle Plugin скомпилирован с Kotlin 1.7.1, но Gradle 8.5 использует Kotlin 1.9.0 в своей стандартной библиотеке. Это вызывает ошибки компиляции:

```
Class 'kotlin.Unit' was compiled with an incompatible version of Kotlin. 
The binary version of its metadata is 1.9.0, expected version is 1.7.1.
```

## Решение

### 1. Обновлен Kotlin до 1.8.22
- Файл: `android/build.gradle`
- Версия: `1.8.22` (последняя версия 1.8.x)
- Более совместима с React Native 0.72.6, чем 1.9.0

### 2. Добавлены настройки компилятора Kotlin

#### В `android/build.gradle` (allprojects):
```gradle
tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
        jvmTarget = '17'
        languageVersion = '1.8'
        apiVersion = '1.8'
        freeCompilerArgs += ['-Xjvm-default=all']
    }
}
```

#### В `android/app/build.gradle`:
```gradle
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}

kotlinOptions {
    jvmTarget = '17'
    languageVersion = '1.8'
    apiVersion = '1.8'
}
```

## Текущая конфигурация

| Компонент | Версия | Назначение |
|-----------|--------|------------|
| Java | 21.0.8 | Совместим с Gradle 8.5 |
| Gradle | 8.5 | Совместим с Java 21 |
| Kotlin Plugin | 1.8.22 | Более совместим с RN 0.72.6 |
| Kotlin Language | 1.8 | Принудительная версия языка |
| Kotlin API | 1.8 | Принудительная версия API |
| JVM Target | 17 | Совместимость с Java 17+ |

## Следующие шаги

1. **Синхронизация проекта:**
   - File → Sync Project with Gradle Files
   - Дождитесь завершения синхронизации

2. **Если ошибки останутся:**
   - Очистите кэш Gradle: `.\gradlew.bat clean`
   - Удалите `.gradle` папку в `android/`
   - Повторно синхронизируйте проект

3. **Альтернативное решение:**
   Если проблема сохранится, можно попробовать:
   - Обновить React Native до версии, совместимой с Kotlin 1.9.0
   - Или использовать Gradle 8.0 (совместим с Kotlin 1.8.x)

## Дополнительная информация

- [Kotlin Compatibility Guide](https://kotlinlang.org/docs/compatibility-guide.html)
- [Gradle Kotlin DSL](https://docs.gradle.org/current/userguide/kotlin_dsl.html)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

