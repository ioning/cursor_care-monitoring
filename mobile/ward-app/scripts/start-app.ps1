# Скрипт для запуска мобильного приложения с правильным PATH

# Добавить ADB в PATH если он не там
$adbPath = "C:\Users\ionin\AppData\Local\Android\Sdk\platform-tools"
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) {
    if (Test-Path $adbPath) {
        $env:Path += ";$adbPath"
        Write-Host "✅ ADB добавлен в PATH: $adbPath" -ForegroundColor Green
    } else {
        Write-Host "❌ ADB не найден. Установите Android SDK Platform Tools." -ForegroundColor Red
        Write-Host "Путь: $adbPath" -ForegroundColor Yellow
        exit 1
    }
}

# Проверить подключенные устройства
Write-Host "`n📱 Проверка подключенных устройств..." -ForegroundColor Cyan
$devices = adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "device$" }

if ($devices.Count -eq 0) {
    Write-Host "❌ Не найдено подключенных устройств или эмуляторов" -ForegroundColor Red
    Write-Host "`nЗапустите эмулятор или подключите устройство по USB" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Найдено устройств: $($devices.Count)" -ForegroundColor Green

# Запустить приложение
Write-Host "`n🚀 Запуск приложения..." -ForegroundColor Cyan
adb shell am start -n com.caremonitoring.ward/com.caremonitoring.ward.MainActivity

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Приложение запущено!" -ForegroundColor Green
} else {
    Write-Host "❌ Не удалось запустить приложение" -ForegroundColor Red
    Write-Host "`nПопробуйте:" -ForegroundColor Yellow
    Write-Host "  1. Убедитесь, что приложение установлено: npm run android" -ForegroundColor Yellow
    Write-Host "  2. Проверьте, что Metro bundler запущен: npm start" -ForegroundColor Yellow
}

