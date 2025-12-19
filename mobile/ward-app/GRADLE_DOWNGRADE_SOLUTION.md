# Решение проблемы совместимости Kotlin через понижение Gradle

## Проблема

React Native Gradle Plugin скомпилирован с Kotlin 1.7.1, но Gradle 8.5 использует Kotlin 1.9.0 в своей стандартной библиотеке (`kotlin-stdlib-1.9.20.jar`). Это вызывает ошибки компиляции:

```
Class 'kotlin.Unit' was compiled with an incompatible version of Kotlin. 
The binary version of its metadata is 1.9.0, expected version is 1.7.1.
```

## Решение

Понижена версия Gradle до 8.0, которая использует Kotlin 1.8.x и совместима с React Native 0.72.6.

### Изменения

1. **Gradle Wrapper** (`android/gradle/wrapper/gradle-wrapper.properties`):
   - Версия: `8.5` → `8.0`
   - URL: `gradle-8.0-all.zip`

2. **Kotlin Plugin** (`android/build.gradle`):
   - Версия: `1.8.22` → `1.8.0`
   - Совместим с Gradle 8.0

3. **Android Gradle Plugin** (`android/build.gradle`):
   - Версия: `8.1.4` → `8.0.2`
   - Совместим с Gradle 8.0

4. **Kotlin Compiler Settings**:
   - `languageVersion = '1.7'`
   - `apiVersion = '1.7'`
   - `jvmTarget = '17'`

## Текущая конфигурация

| Компонент | Версия | Совместимость |
|-----------|--------|---------------|
| Java | 21.0.8 | ✅ Совместим с Gradle 8.0 |
| Gradle | 8.0 | ✅ Использует Kotlin 1.8.x |
| Kotlin Plugin | 1.8.0 | ✅ Совместим с RN 0.72.6 |
| Android Gradle Plugin | 8.0.2 | ✅ Совместим с Gradle 8.0 |
| Kotlin Language | 1.7 | ✅ Совместим с RN Plugin |
| Kotlin API | 1.7 | ✅ Совместим с RN Plugin |
| JVM Target | 17 | ✅ Совместим с Java 21 |

## Следующие шаги

### 1. Удалите старую версию Gradle

```powershell
# Удалите кэш Gradle 8.5
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\wrapper\dists\gradle-8.5-all
```

### 2. Синхронизируйте проект

В Android Studio:
- File → Sync Project with Gradle Files
- Дождитесь загрузки Gradle 8.0

### 3. Очистите проект (если нужно)

```powershell
cd android
.\gradlew.bat clean
```

### 4. Соберите APK

```powershell
.\gradlew.bat assembleRelease
```

## Альтернативные решения

Если проблема сохранится:

1. **Использовать Gradle 7.6** (Kotlin 1.7.x):
   - Обновите `gradle-wrapper.properties` на `gradle-7.6-all.zip`
   - Обновите Android Gradle Plugin до `7.4.2`

2. **Обновить React Native**:
   - Обновите до версии, совместимой с Kotlin 1.9.0
   - Требует обновления зависимостей

3. **Принудительно использовать kotlin-stdlib 1.7.1**:
   - Добавьте в `build.gradle`:
   ```gradle
   configurations.all {
       resolutionStrategy {
           force 'org.jetbrains.kotlin:kotlin-stdlib:1.7.1'
       }
   }
   ```

## Дополнительная информация

- [Gradle Compatibility Matrix](https://docs.gradle.org/current/userguide/compatibility.html)
- [Kotlin Compatibility Guide](https://kotlinlang.org/docs/compatibility-guide.html)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

