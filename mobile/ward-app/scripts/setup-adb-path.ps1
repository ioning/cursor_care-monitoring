# Скрипт для добавления ADB в системный PATH (требует прав администратора)

$adbPath = "C:\Users\ionin\AppData\Local\Android\Sdk\platform-tools"

# Проверить, существует ли путь
if (-not (Test-Path $adbPath)) {
    Write-Host "❌ Путь не найден: $adbPath" -ForegroundColor Red
    Write-Host "`nИсправьте путь в скрипте или установите Android SDK Platform Tools" -ForegroundColor Yellow
    exit 1
}

# Получить текущий системный PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")

# Проверить, не добавлен ли уже
if ($currentPath -split ';' -contains $adbPath) {
    Write-Host "✅ ADB уже добавлен в PATH пользователя" -ForegroundColor Green
    Write-Host "Путь: $adbPath" -ForegroundColor Gray
    exit 0
}

# Добавить в PATH
try {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$adbPath", "User")
    Write-Host "✅ ADB успешно добавлен в PATH пользователя" -ForegroundColor Green
    Write-Host "Путь: $adbPath" -ForegroundColor Gray
    Write-Host "`n⚠️  Перезапустите терминал для применения изменений" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Ошибка при добавлении в PATH: $_" -ForegroundColor Red
    Write-Host "`nПопробуйте запустить PowerShell от имени администратора" -ForegroundColor Yellow
    exit 1
}

