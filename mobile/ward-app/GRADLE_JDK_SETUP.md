# Настройка JDK для Gradle

## Проблема

Android Studio показывает предупреждение:
```
Undefined java.home on the project gradle/config.properties file when using the gradleJvm #GRADLE_LOCAL_JAVA_HOME macro.
```

## Решение

### Автоматическая настройка

Файл `gradle.properties` уже обновлен с правильным путем:
```properties
org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr
```

### Ручная настройка в Android Studio

Если предупреждение все еще появляется:

1. **Откройте настройки Gradle:**
   - File → Settings (или Ctrl+Alt+S)
   - Build, Execution, Deployment → Build Tools → Gradle

2. **Выберите Gradle JDK:**
   - **Вариант 1**: Выберите "Embedded JDK (JetBrains Runtime 21.0.8)"
   - **Вариант 2**: Выберите "JDK" и укажите путь:
     ```
     C:/Program Files/Android/Android Studio/jbr
     ```

3. **Примените изменения:**
   - Нажмите "Apply" и "OK"
   - Синхронизируйте проект: File → Sync Project with Gradle Files

## Проверка настройки

После настройки проверьте:

1. **В Android Studio:**
   - File → Project Structure → SDK Location
   - Проверьте, что "JDK location" указывает на правильный путь

2. **Через командную строку:**
   ```powershell
   cd android
   .\gradlew.bat --version
   ```
   Должна отображаться версия Java 21.

## Текущая конфигурация

| Параметр | Значение |
|----------|----------|
| Java Version | 21.0.8 (JetBrains Runtime) |
| Java Home | C:/Program Files/Android/Android Studio/jbr |
| Gradle Version | 8.5 |
| Совместимость | ✅ Gradle 8.5 поддерживает Java 21 |

## Альтернативные пути Java

Если Android Studio JBR не найден, можно использовать:

1. **Установленный JDK 21:**
   ```properties
   org.gradle.java.home=C:/Program Files/Java/jdk-21
   ```

2. **Eclipse Adoptium JDK 21:**
   ```properties
   org.gradle.java.home=C:/Program Files/Eclipse Adoptium/jdk-21.x.x-hotspot
   ```

3. **Oracle JDK 21:**
   ```properties
   org.gradle.java.home=C:/Program Files/Java/jdk-21
   ```

## Дополнительная информация

- [Gradle Java Compatibility](https://docs.gradle.org/current/userguide/compatibility.html#java)
- [Android Studio JDK Setup](https://developer.android.com/studio/intro/studio-config#jdk)

