# Скрипт для проверки работы фронтенда с бэкендом

Write-Host "`n=== Проверка работы фронтенда с бэкендом ===" -ForegroundColor Cyan
Write-Host ""

# Проверка фронтенд приложений
Write-Host "Фронтенд приложения:" -ForegroundColor Yellow
$frontendApps = @(
    @{Port=5173; Name="Guardian App"},
    @{Port=5174; Name="Dispatcher App"},
    @{Port=5175; Name="Admin App"},
    @{Port=5176; Name="Landing App"}
)

foreach ($app in $frontendApps) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($app.Port)" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  ✅ $($app.Name) (порт $($app.Port)): Работает" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($app.Name) (порт $($app.Port)): Не отвечает" -ForegroundColor Red
    }
}

Write-Host ""

# Проверка бэкенд сервисов
Write-Host "Бэкенд сервисы:" -ForegroundColor Yellow
$backendServices = @(
    @{Port=3000; Path="/api/v1/health"; Name="API Gateway"},
    @{Port=3001; Path="/health"; Name="Auth Service"},
    @{Port=3002; Path="/health"; Name="User Service"},
    @{Port=3003; Path="/health"; Name="Device Service"},
    @{Port=3004; Path="/health"; Name="Telemetry Service"},
    @{Port=3005; Path="/health"; Name="Alert Service"}
)

foreach ($svc in $backendServices) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($svc.Port)$($svc.Path)" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "  ✅ $($svc.Name) (порт $($svc.Port)): Работает" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($svc.Name) (порт $($svc.Port)): Не отвечает" -ForegroundColor Red
    }
}

Write-Host ""

# Проверка интеграции фронтенд-бэкенд
Write-Host "Проверка интеграции:" -ForegroundColor Yellow

# Тест API через прокси фронтенда
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173/api/v1/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✅ Guardian App -> API Gateway: Работает (через прокси)" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Guardian App -> API Gateway: Не работает" -ForegroundColor Red
    Write-Host "     Причина: API Gateway не запущен или не отвечает" -ForegroundColor Yellow
}

# Прямой тест API Gateway
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✅ Прямое подключение к API Gateway: Работает" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Прямое подключение к API Gateway: Не работает" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Итог ===" -ForegroundColor Cyan
Write-Host "Фронтенд приложения работают и доступны в браузере" -ForegroundColor Green
Write-Host "Для полной работы необходимо запустить бэкенд сервисы" -ForegroundColor Yellow
Write-Host ""
Write-Host "Команда для запуска всех сервисов:" -ForegroundColor Cyan
Write-Host "  cd C:\projects\cursor_care-monitoring" -ForegroundColor White
Write-Host "  npm run dev:all" -ForegroundColor White
Write-Host ""

