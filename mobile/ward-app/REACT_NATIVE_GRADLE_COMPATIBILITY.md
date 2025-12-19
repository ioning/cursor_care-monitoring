# Исправление совместимости React Native с Gradle

## Проблема

React Native Gradle Plugin использует устаревший API `serviceOf`, который был удален в Gradle 8.10.2:

```
Unresolved reference: serviceOf
import org.gradle.configurationcache.extensions.serviceOf
```

## Причина

React Native 0.72.6 был разработан для работы с Gradle 8.5 и использует API, которые были удалены в более новых версиях Gradle.

## Решение

Понижена версия Gradle до 8.5, которая совместима с React Native 0.72.6:

### Изменения

1. **Gradle**: `8.10.2` → `8.5`
   - Файл: `android/gradle/wrapper/gradle-wrapper.properties`
   - Совместим с React Native 0.72.6

2. **Android Gradle Plugin**: `8.7.3` → `8.1.4`
   - Файл: `android/build.gradle`
   - Совместим с Gradle 8.5

## Текущая конфигурация

| Компонент | Версия | Совместимость |
|-----------|--------|---------------|
| Java | 21.0.8 | ✅ Поддерживается Gradle 8.5 |
| Gradle | 8.5 | ✅ Совместим с React Native 0.72.6 |
| Kotlin Plugin | 1.9.24 | ✅ Совместим |
| Android Gradle Plugin | 8.1.4 | ✅ Совместим с Gradle 8.5 |
| React Native | 0.72.6 | ✅ Совместим с Gradle 8.5 |
| Kotlin Language/API | 1.9 | ✅ Совместим |

## Очистка кэша

Выполните следующие команды:

```powershell
cd android

# Остановите все Gradle daemon'ы
.\gradlew.bat --stop

# Удалите кэш Gradle 8.10.2
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\wrapper\dists\gradle-8.10.2-all

# Очистите кэш проекта
Remove-Item -Recurse -Force .gradle
```

## Синхронизация проекта

В Android Studio:
1. File → Invalidate Caches / Restart
2. Выберите "Invalidate and Restart"
3. После перезапуска: File → Sync Project with Gradle Files

## Альтернативные решения

### Вариант 1: Обновить React Native

Если вы хотите использовать Gradle 8.10.2, обновите React Native:

```bash
npm install react-native@latest
```

Затем обновите конфигурацию обратно до Gradle 8.10.2.

### Вариант 2: Использовать Gradle 8.6

Промежуточная версия, которая может работать:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip
```

```gradle
classpath("com.android.tools.build:gradle:8.3.0")
```

## Почему Gradle 8.5?

1. **Совместимость с React Native 0.72.6**: Проверенная комбинация
2. **Поддержка Java 21**: Gradle 8.5 поддерживает Java 21
3. **Стабильность**: Стабильная версия без известных проблем с React Native
4. **API совместимость**: Содержит все API, используемые React Native Gradle Plugin

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

## Дополнительная информация

- [Gradle 8.5 Release Notes](https://docs.gradle.org/8.5/release-notes.html)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)

