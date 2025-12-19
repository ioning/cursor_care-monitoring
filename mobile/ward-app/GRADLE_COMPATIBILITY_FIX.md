# Исправление проблемы совместимости Gradle 9.2.1

## Проблема

Ошибка: `Unable to load class 'org.gradle.api.artifacts.SelfResolvingDependency'`

Эта ошибка возникает из-за несовместимости версий:
- Gradle 9.2.1 требует Android Gradle Plugin 8.9.x или выше
- Android Gradle Plugin 8.7.3 не полностью совместим с Gradle 9.2.1

## Решение

### 1. Обновлен Android Gradle Plugin

- **Версия**: `8.7.3` → `8.9.2`
- **Файл**: `android/build.gradle`
- **Совместимость**: Полностью совместим с Gradle 9.2.1

### 2. Очистка кэша Gradle

Выполните следующие команды для очистки кэша:

```powershell
# 1. Остановите все Gradle daemon'ы
cd android
.\gradlew.bat --stop

# 2. Очистите кэш Gradle
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches

# 3. Удалите кэш проекта
Remove-Item -Recurse -Force android\.gradle

# 4. (Опционально) Удалите кэш wrapper'а
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\wrapper\dists\gradle-9.2.1-all
```

### 3. Синхронизация проекта

В Android Studio:
1. File → Invalidate Caches / Restart
2. Выберите "Invalidate and Restart"
3. После перезапуска: File → Sync Project with Gradle Files

## Текущая конфигурация

| Компонент | Версия | Совместимость |
|-----------|--------|---------------|
| Java | 21.0.8 | ✅ Поддерживается |
| Gradle | 9.2.1 | ✅ Последняя версия |
| Kotlin Plugin | 1.9.24 | ✅ Совместим |
| Android Gradle Plugin | 8.9.2 | ✅ Совместим с Gradle 9.2.1 |
| Kotlin Language/API | 1.9 | ✅ Совместим |
| JVM Target | 21 | ✅ Совместим |

## Альтернативное решение

Если проблема сохранится, можно использовать более стабильную комбинацию:

### Вариант 1: Gradle 8.10.2 + AGP 8.7.3

```properties
# gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.10.2-all.zip
```

```gradle
// build.gradle
classpath("com.android.tools.build:gradle:8.7.3")
```

### Вариант 2: Gradle 9.0 + AGP 8.9.2

```properties
# gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-9.0-all.zip
```

```gradle
// build.gradle
classpath("com.android.tools.build:gradle:8.9.2")
```

## Проверка совместимости

Таблица совместимости Android Gradle Plugin и Gradle:

| AGP Version | Min Gradle | Max Gradle | Recommended Gradle |
|-------------|------------|------------|-------------------|
| 8.7.x | 8.9 | 8.10 | 8.10 |
| 8.8.x | 8.9 | 9.0 | 9.0 |
| 8.9.x | 9.0 | 9.2+ | 9.2 |

## Дополнительная информация

- [Android Gradle Plugin Release Notes](https://developer.android.com/studio/releases/gradle-plugin)
- [Gradle Compatibility Matrix](https://docs.gradle.org/current/userguide/compatibility.html)
- [Gradle Release Notes](https://docs.gradle.org/current/release-notes.html)

