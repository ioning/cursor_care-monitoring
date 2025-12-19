# Исправление ошибки serviceOf для Gradle 8.5

## Проблема

API `serviceOf` было удалено в Gradle 8.14.1, что приводит к ошибке:
```
Unresolved reference: serviceOf
```

React Native Gradle Plugin использует это API, которое было доступно в более ранних версиях Gradle 8.x.

## Решение

Использовать Gradle 8.5, который:
- ✅ Имеет API `serviceOf`
- ✅ Поддерживает Java 21
- ✅ Совместим с React Native 0.72.6

## Текущая конфигурация

| Компонент | Версия | Назначение |
|-----------|--------|------------|
| Java | 21.0.8 | ✅ Поддерживается Gradle 8.5 |
| Gradle | 8.5 | ✅ Имеет API serviceOf, поддерживает Java 21 |
| Kotlin Plugin | 1.7.22 | ✅ Совместим с React Native 0.72.6 |
| Android Gradle Plugin | 8.1.4 | ✅ Совместим с Gradle 8.5 |
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

## Очистка кэша

Перед синхронизацией выполните:

```powershell
cd android

# Остановите все Gradle daemon'ы
.\gradlew.bat --stop

# Удалите кэш Gradle 8.14.1
Remove-Item -Recurse -Force $env:USERPROFILE\.gradle\wrapper\dists\gradle-8.14.1-all

# Очистите кэш проекта
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

## Альтернативное решение (если Gradle 8.5 не работает)

Если по какой-то причине Gradle 8.5 не подходит, можно использовать патч для React Native Gradle Plugin:

1. Установите `patch-package`:
   ```bash
   npm install --save-dev patch-package
   ```

2. Исправьте файл `node_modules/@react-native/gradle-plugin/build.gradle.kts`:
   - Удалите строку `import org.gradle.configurationcache.extensions.serviceOf`
   - Замените `serviceOf<ModuleRegistry>()` на альтернативный метод

3. Создайте патч:
   ```bash
   npx patch-package @react-native/gradle-plugin
   ```

4. Добавьте в `package.json`:
   ```json
   "scripts": {
     "postinstall": "patch-package"
   }
   ```

## Дополнительная информация

- [Gradle 8.5 Release Notes](https://docs.gradle.org/8.5/release-notes.html)
- [Android Gradle Plugin Compatibility](https://developer.android.com/studio/releases/gradle-plugin)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)

