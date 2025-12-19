# Сборка APK без Android Studio

## Способ 1: Через npm скрипты (рекомендуется)

Из корневой директории проекта (`mobile/ward-app`):

```powershell
# Debug APK
npm run build:android:debug

# Release APK
npm run build:android

# AAB bundle (для Google Play)
npm run build:android:bundle
```

## Способ 2: Напрямую через Gradle

Из директории `android`:

```powershell
cd android

# Debug APK
.\gradlew.bat assembleDebug

# Release APK
.\gradlew.bat assembleRelease

# AAB bundle (для Google Play)
.\gradlew.bat bundleRelease
```

## Способ 3: С полной очисткой

Если возникают проблемы со сборкой:

```powershell
cd android

# Остановить все Gradle процессы
.\gradlew.bat --stop

# Очистить проект
.\gradlew.bat clean

# Собрать Debug APK
.\gradlew.bat assembleDebug

# Или собрать Release APK
.\gradlew.bat assembleRelease
```

## Расположение собранных APK

После успешной сборки APK файлы будут находиться:

- **Debug APK**: `android\app\build\outputs\apk\debug\app-debug.apk`
- **Release APK**: `android\app\build\outputs\apk\release\app-release.apk`
- **AAB Bundle**: `android\app\build\outputs\bundle\release\app-release.aab`

## Требования

Перед сборкой убедитесь, что:

1. **Java 21** установлена и доступна в PATH
2. **Gradle** настроен (версия указана в `android/gradle/wrapper/gradle-wrapper.properties`)
3. **Android SDK** установлен (путь указан в `android/local.properties`)

## Проверка конфигурации

Проверьте файл `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

Если файла нет, создайте его на основе `local.properties.example`.

## Решение проблем

### Ошибка: "SDK location not found"

Создайте файл `android/local.properties` с путем к Android SDK:

```properties
sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### Ошибка: "Java version not supported"

Убедитесь, что используется Java 21:

```powershell
java -version
```

Если нужно, установите Java 21 или обновите `org.gradle.java.home` в `android/gradle.properties`.

### Ошибка: "Gradle daemon not responding"

Остановите все Gradle процессы:

```powershell
cd android
.\gradlew.bat --stop
```

Затем попробуйте снова.

### Ошибка: "Out of memory"

Увеличьте память для Gradle в `android/gradle.properties`:

```properties
org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=1024m
```

## Подписание Release APK

Для Release APK требуется подпись. Настройте в `android/app/build.gradle`:

```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
            storeFile file(MYAPP_RELEASE_STORE_FILE)
            storePassword MYAPP_RELEASE_STORE_PASSWORD
            keyAlias MYAPP_RELEASE_KEY_ALIAS
            keyPassword MYAPP_RELEASE_KEY_PASSWORD
        }
    }
}
```

Создайте файл `android/gradle.properties` с ключами:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=*****
MYAPP_RELEASE_KEY_PASSWORD=*****
```

## Дополнительные команды

```powershell
# Показать все доступные задачи
.\gradlew.bat tasks

# Собрать только для определенной архитектуры
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a

# Собрать с подробным выводом
.\gradlew.bat assembleDebug --info

# Собрать с отладочным выводом
.\gradlew.bat assembleDebug --debug
```

