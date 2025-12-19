# Исправление совместимости Kotlin stdlib

## Проблема

Gradle 8.5 использует Kotlin 1.9.20 в своей стандартной библиотеке, но React Native Gradle Plugin скомпилирован с Kotlin 1.7.1:

```
Class 'kotlin.StandardKt__StandardKt' was compiled with an incompatible version of Kotlin. 
The binary version of its metadata is 1.9.0, expected version is 1.7.1.
```

## Решение

Принудительное использование kotlin-stdlib 1.7.22 (последняя версия 1.7.x) через `resolutionStrategy` и обновление версии Kotlin Plugin.

### Изменения

1. **Kotlin Plugin**: `1.9.24` → `1.7.22`
   - Файл: `android/build.gradle`
   - Последняя стабильная версия 1.7.x

2. **Принудительное использование kotlin-stdlib 1.7.22**:
   ```gradle
   configurations.all {
       resolutionStrategy {
           force 'org.jetbrains.kotlin:kotlin-stdlib:1.7.22'
           force 'org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.7.22'
           force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.7.22'
       }
   }
   ```

3. **Kotlin Compiler Settings**:
   - `languageVersion = '1.7'`
   - `apiVersion = '1.7'`
   - Файлы: `android/build.gradle`, `android/app/build.gradle`

## Текущая конфигурация

| Компонент | Версия | Совместимость |
|-----------|--------|---------------|
| Java | 21.0.8 | ✅ Поддерживается |
| Gradle | 8.5 | ✅ Использует Kotlin 1.9.20 (переопределено) |
| Kotlin Plugin | 1.7.22 | ✅ Совместим с RN Plugin |
| kotlin-stdlib (принудительно) | 1.7.22 | ✅ Совместим с RN Plugin |
| Kotlin Language/API | 1.7 | ✅ Совместим с RN Plugin |
| React Native | 0.72.6 | ✅ Совместим |
| Android Gradle Plugin | 8.1.4 | ✅ Совместим |

## Очистка кэша

Выполните следующие команды:

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

## Почему это работает?

1. **resolutionStrategy.force**: Принудительно использует kotlin-stdlib 1.7.22 для всех зависимостей, включая те, которые загружаются из Gradle
2. **Kotlin 1.7.22**: Последняя версия 1.7.x, полностью совместима с React Native Gradle Plugin (скомпилирован с Kotlin 1.7.1)
3. **Gradle 8.5**: Продолжает работать, но использует переопределенную версию kotlin-stdlib

## Альтернативное решение

Если проблема сохранится, можно использовать Gradle 7.6, который использует Kotlin 1.7.x по умолчанию:

```properties
# gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-7.6-all.zip
```

```gradle
// build.gradle
classpath("com.android.tools.build:gradle:7.4.2")
kotlinVersion = "1.7.20"
```

Но это потребует Java 17 вместо Java 21.

## Дополнительная информация

- [Kotlin Compatibility Guide](https://kotlinlang.org/docs/compatibility-guide.html)
- [Gradle Dependency Resolution](https://docs.gradle.org/current/userguide/dependency_resolution.html)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

