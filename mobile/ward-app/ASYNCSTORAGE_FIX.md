# Исправление ошибки AsyncStorage

## Проблема
Ошибка: `[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null.`

## Решение
AsyncStorage явно зарегистрирован в `MainApplication.kt`, так как autolinking не работает правильно.

## Что было сделано:
1. Добавлен импорт `AsyncStoragePackage` в `MainApplication.kt`
2. Явно зарегистрирован `AsyncStoragePackage()` в методе `getPackages()`

## Следующие шаги:

### 1. Убедитесь, что Java установлена и JAVA_HOME настроен:
```powershell
# Проверьте Java
java -version

# Если Java не установлена, установите JDK 17
# Затем установите JAVA_HOME:
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

### 2. Пересоберите APK:
```powershell
cd android
.\gradlew.bat clean
.\gradlew.bat assembleDebug
```

### 3. Установите новый APK:
- Полностью удалите старое приложение с устройства
- Установите новый APK из `android/app/build/outputs/apk/debug/app-debug.apk`

### 4. Если ошибка сохраняется:
Проверьте, что модуль компилируется:
```powershell
.\gradlew.bat :react-native-async-storage_async-storage:assembleDebug
```

Если есть ошибки компиляции, проверьте:
- Версия пакета в `package.json` должна быть `^1.24.0`
- Модуль должен быть в `node_modules/@react-native-async-storage/async-storage`

