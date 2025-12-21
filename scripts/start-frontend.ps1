# Скрипт для запуска frontend приложений

Write-Host "=== Запуск Frontend приложений ===" -ForegroundColor Cyan
Write-Host ""

# Проверка, что мы в корне проекта
if (-not (Test-Path "frontend/apps/guardian-app")) {
    Write-Host "Ошибка: Запустите скрипт из корня проекта" -ForegroundColor Red
    exit 1
}

Write-Host "Порты приложений:" -ForegroundColor Yellow
Write-Host "  - Guardian App:  http://localhost:5173" -ForegroundColor Green
Write-Host "  - Dispatcher App: http://localhost:5174" -ForegroundColor Green
Write-Host ""

# Проверка занятости портов
$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
$port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue

if ($port5173) {
    Write-Host "ВНИМАНИЕ: Порт 5173 уже занят!" -ForegroundColor Yellow
}

if ($port5174) {
    Write-Host "ВНИМАНИЕ: Порт 5174 уже занят!" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Запуск приложений в отдельных окнах..." -ForegroundColor Cyan
Write-Host ""

# Запуск Guardian App
Write-Host "Запуск Guardian App на порту 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD/frontend/apps/guardian-app'; Write-Host 'Guardian App - http://localhost:5173' -ForegroundColor Green; npm run dev"

Start-Sleep -Seconds 2

# Запуск Dispatcher App
Write-Host "Запуск Dispatcher App на порту 5174..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD/frontend/apps/dispatcher-app'; Write-Host 'Dispatcher App - http://localhost:5174' -ForegroundColor Green; npm run dev"

Write-Host ""
Write-Host "=== Приложения запущены ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Откройте в браузере:" -ForegroundColor Yellow
Write-Host "  Guardian App:   http://localhost:5173" -ForegroundColor Green
Write-Host "  Dispatcher App: http://localhost:5174" -ForegroundColor Green
Write-Host ""
Write-Host "Для остановки закройте окна PowerShell" -ForegroundColor Gray

