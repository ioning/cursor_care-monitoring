# Скрипт для установки APK на Android устройство/эмулятор
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("debug", "release")]
    [string]$BuildType = "debug",
    
    [Parameter(Mandatory=$false)]
    [string]$ApkPath = ""
)

$ErrorActionPreference = "Stop"

# Путь к APK файлу
if ([string]::IsNullOrEmpty($ApkPath)) {
    $ApkPath = if ($BuildType -eq "debug") {
        "mobile\ward-app\android\app\build\outputs\apk\debug\app-debug.apk"
    } else {
        "mobile\ward-app\android\app\build\outputs\apk\release\app-release.apk"
    }
}

$FullApkPath = Join-Path $PSScriptRoot ".." $ApkPath | Resolve-Path -ErrorAction SilentlyContinue

if (-not $FullApkPath -or -not (Test-Path $FullApkPath)) {
    Write-Host "❌ APK файл не найден: $ApkPath" -ForegroundColor Red
    Write-Host "`nСначала выполните сборку:" -ForegroundColor Yellow
    Write-Host "  npm run build:android:debug  (для debug)" -ForegroundColor Yellow
    Write-Host "  npm run build:android        (для release)" -ForegroundColor Yellow
    Write-Host "`nИли укажите путь к APK файлу:" -ForegroundColor Yellow
    Write-Host "  .\scripts\install-apk.ps1 -ApkPath 'путь\к\файлу.apk'" -ForegroundColor Yellow
    exit 1
}

# Проверка наличия ADB
$adbPath = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbPath) {
    Write-Host "❌ ADB не найден в PATH" -ForegroundColor Red
    Write-Host "`nУстановите Android SDK Platform Tools:" -ForegroundColor Yellow
    Write-Host "  1. Скачайте: https://developer.android.com/tools/releases/platform-tools" -ForegroundColor Yellow
    Write-Host "  2. Распакуйте и добавьте в PATH" -ForegroundColor Yellow
    Write-Host "  3. Или установите через Android Studio → SDK Manager → SDK Tools → Android SDK Platform-Tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "📱 Проверка подключенных устройств..." -ForegroundColor Cyan
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if ($devices.Count -eq 0) {
    Write-Host "❌ Не найдено подключенных устройств или эмуляторов" -ForegroundColor Red
    Write-Host "`nПодключите устройство по USB или запустите эмулятор:" -ForegroundColor Yellow
    Write-Host "  - Включите режим отладки по USB на устройстве" -ForegroundColor Yellow
    Write-Host "  - Или запустите Android эмулятор через Android Studio" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Найдено устройств: $($devices.Count)" -ForegroundColor Green
foreach ($device in $devices) {
    Write-Host "  - $device" -ForegroundColor Gray
}

Write-Host "`n📦 Установка APK: $FullApkPath" -ForegroundColor Cyan
Write-Host "   Тип сборки: $BuildType" -ForegroundColor Gray

# Установка APK
$installOutput = adb install -r "$FullApkPath" 2>&1
$installSuccess = $LASTEXITCODE -eq 0

if ($installSuccess) {
    Write-Host "`n✅ APK успешно установлен!" -ForegroundColor Green
    
    # Попытка запустить приложение
    Write-Host "`n🚀 Запуск приложения..." -ForegroundColor Cyan
    $packageName = "com.caremonitoring.ward"
    $launchActivity = "com.caremonitoring.ward.MainActivity"
    
    adb shell am start -n "$packageName/$launchActivity" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Приложение запущено!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Не удалось запустить приложение автоматически. Запустите вручную." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n❌ Ошибка при установке APK:" -ForegroundColor Red
    Write-Host $installOutput -ForegroundColor Red
    
    if ($installOutput -match "INSTALL_FAILED_UPDATE_INCOMPATIBLE") {
        Write-Host "`n💡 Решение: Удалите старое приложение и попробуйте снова:" -ForegroundColor Yellow
        Write-Host "   adb uninstall com.caremonitoring.ward" -ForegroundColor Yellow
    } elseif ($installOutput -match "INSTALL_PARSE_FAILED") {
        Write-Host "`n💡 Решение: Пересоберите APK файл" -ForegroundColor Yellow
    }
    exit 1
}

