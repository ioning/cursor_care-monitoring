# Исправление проблемы совместимости Java 21 с Gradle

## Проблема

Gradle 8.0 не поддерживает Java 21 (class file major version 65). Ошибка:
```
Unsupported class file major version 65
```

Java 21 имеет class file version 65, а Gradle 8.0 поддерживает только до Java 19 (class file version 63).

## Решение

Обновлен Gradle до версии 8.3, которая поддерживает Java 21, и принудительно установлена совместимая версия Kotlin stdlib.

### Изменения

1. **Gradle Wrapper** (`android/gradle/wrapper/gradle-wrapper.properties`):
   - Версия: `8.0` → `8.3`
   - URL: `gradle-8.3-all.zip`
   - ✅ Поддерживает Java 21

2. **Kotlin Plugin** (`android/build.gradle`):
   - Версия: `1.8.22`
   - Совместим с React Native 0.72.6

3. **Android Gradle Plugin** (`android/build.gradle`):
   - Версия: `8.1.4`
   - Совместим с Gradle 8.3

4. **Принудительное использование kotlin-stdlib 1.8.22**:
   ```gradle
   configurations.all {
       resolutionStrategy {
           force 'org.jetbrains.kotlin:kotlin-stdlib:1.8.22'
           force 'org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.8.22'
       }
   }
   ```
   Это гарантирует, что все модули используют Kotlin 1.8.22 вместо версии, поставляемой с Gradle 8.3.

5. **Kotlin Compiler Settings**:
   - `languageVersion = '1.8'`
   - `apiVersion = '1.8'`
   - `jvmTarget = '17'`

## Текущая конфигурация

| Компонент | Версия | Совместимость |
|-----------|--------|---------------|
| Java | 21.0.8 | ✅ Поддерживается Gradle 8.3 |
| Gradle | 8.3 | ✅ Поддерживает Java 21 |
| Kotlin Plugin | 1.8.22 | ✅ Совместим с RN 0.72.6 |
| Android Gradle Plugin | 8.1.4 | ✅ Совместим с Gradle 8.3 |
| Kotlin stdlib (принудительно) | 1.8.22 | ✅ Совместим с RN Plugin |
| Kotlin Language/API | 1.8 | ✅ Совместим с RN Plugin |
| JVM Target | 17 | ✅ Совместим с Java 21 |

## Следующие шаги

### 1. Удалите кэш Gradle 8.0

```powershell
# Удалите кэш Gradle 8.0
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\caches\8.0
```

### 2. Синхронизируйте проект

В Android Studio:
- File → Sync Project with Gradle Files
- Дождитесь загрузки Gradle 8.3

### 3. Очистите проект (если нужно)

```powershell
cd android
.\gradlew.bat clean
```

### 4. Соберите APK

```powershell
.\gradlew.bat assembleRelease
```

## Почему это работает

1. **Gradle 8.3 поддерживает Java 21**: Решает проблему "Unsupported class file major version 65"

2. **Принудительное использование kotlin-stdlib 1.8.22**: 
   - Gradle 8.3 поставляется с Kotlin 1.9.x в своей стандартной библиотеке
   - React Native Gradle Plugin ожидает Kotlin 1.7.1
   - Принудительное использование 1.8.22 обеспечивает совместимость

3. **Kotlin 1.8.22**:
   - Совместим с React Native 0.72.6
   - Обратно совместим с Kotlin 1.7.1 (который ожидает RN Plugin)
   - Поддерживается Gradle 8.3

## Альтернативные решения

Если проблема сохранится:

1. **Использовать Java 17**:
   - Установите Java 17
   - Обновите `gradle.properties`:
     ```properties
     org.gradle.java.home=C:/path/to/java17
     ```

2. **Использовать Gradle 8.5 с Java 17**:
   - Понизить Java до 17
   - Вернуть Gradle 8.5

## Дополнительная информация

- [Gradle Compatibility Matrix](https://docs.gradle.org/current/userguide/compatibility.html)
- [Java Version Support in Gradle](https://docs.gradle.org/current/userguide/compatibility.html#java)
- [Kotlin Compatibility Guide](https://kotlinlang.org/docs/compatibility-guide.html)

