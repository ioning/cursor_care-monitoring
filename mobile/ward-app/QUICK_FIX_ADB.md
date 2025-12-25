# Быстрое решение проблемы с ADB

## Проблема
```
"adb" не является внутренней или внешней
командой, исполняемой программой или пакетным файлом.
```

## Быстрое решение (для текущей сессии)

Выполните в PowerShell:
```powershell
$env:Path += ";C:\Users\ionin\AppData\Local\Android\Sdk\platform-tools"
```

Затем запустите приложение:
```powershell
npm run android
```

Или используйте скрипт:
```powershell
npm run android:start
```

## Постоянное решение

### Вариант 1: Через скрипт (рекомендуется)

```powershell
cd mobile/ward-app
powershell -ExecutionPolicy Bypass -File scripts/setup-adb-path.ps1
```

**Перезапустите терминал** после выполнения скрипта.

### Вариант 2: Вручную

1. Нажмите `Win + R`, введите `sysdm.cpl` и нажмите Enter
2. Перейдите на вкладку **Дополнительно**
3. Нажмите **Переменные среды**
4. В разделе **Переменные пользователя** (или **Системные переменные**) найдите переменную `Path`
5. Нажмите **Изменить**
6. Нажмите **Создать** и добавьте:
   ```
   C:\Users\ionin\AppData\Local\Android\Sdk\platform-tools
   ```
7. Нажмите **OK** на всех окнах
8. **Перезапустите терминал**

### Проверка

После перезапуска терминала выполните:
```powershell
adb version
```

Должна отобразиться версия ADB (например, `Android Debug Bridge version 1.0.41`).

## После настройки ADB

Приложение можно запускать обычным способом:

```powershell
# Терминал 1: Metro bundler
cd mobile/ward-app
npm start

# Терминал 2: Запуск приложения
cd mobile/ward-app
npm run android
```

## Альтернатива: Запуск без ADB в PATH

Если вы не хотите добавлять ADB в PATH, используйте скрипт:

```powershell
cd mobile/ward-app
npm run android:start
```

Этот скрипт автоматически добавит ADB в PATH текущей сессии и запустит приложение.

