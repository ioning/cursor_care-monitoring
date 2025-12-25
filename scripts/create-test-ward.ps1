# Скрипт для создания тестового подопечного в кабинете тестового опекуна

$ErrorActionPreference = "Stop"

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
Set-Location $Root

# Конфигурация
$API_GATEWAY_URL = "http://localhost:3000"
$GUARDIAN_EMAIL = "guardian@care-monitoring.ru"
$GUARDIAN_PASSWORD = "guardian123"

Write-Host "=== Создание тестового подопечного ==="
Write-Host ""

# Шаг 1: Логин опекуна
Write-Host "1. Авторизация опекуна..."
try {
    $loginBody = @{
        email = $GUARDIAN_EMAIL
        password = $GUARDIAN_PASSWORD
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Method Post -Uri "$API_GATEWAY_URL/api/v1/auth/login" `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    if ($loginResponse.success -and $loginResponse.data.tokens) {
        $TOKEN = $loginResponse.data.tokens.accessToken
        Write-Host "   OK: Авторизация успешна"
        Write-Host "   Опекун: $($loginResponse.data.user.fullName)"
    } else {
        throw "Неожиданный формат ответа от login"
    }
} catch {
    Write-Host "   ERROR: Ошибка авторизации: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Ответ: $responseBody"
    }
    exit 1
}

# Шаг 2: Создание подопечного
Write-Host ""
Write-Host "2. Создание подопечного..."

$wardData = @{
    fullName = "Тестовый Подопечный $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    phone = "+79001234567"
    dateOfBirth = "1950-01-15"
    gender = "male"
    medicalInfo = "Тестовый подопечный. Гипертония, требуется регулярный контроль давления."
    emergencyContact = "+79009876543"
} | ConvertTo-Json

try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }

    $createResponse = Invoke-RestMethod -Method Post -Uri "$API_GATEWAY_URL/api/v1/users/wards" `
        -Headers $headers `
        -Body $wardData `
        -ErrorAction Stop

    if ($createResponse.success) {
        Write-Host "   OK: Подопечный создан успешно"
        Write-Host ""
        Write-Host "=== Информация о подопечном ==="
        Write-Host "   ID: $($createResponse.data.id)"
        Write-Host "   Имя: $($createResponse.data.fullName)"
        Write-Host "   Телефон: $($wardData | ConvertFrom-Json | Select-Object -ExpandProperty phone)"
        if ($createResponse.temporaryPassword) {
            Write-Host "   Пароль для входа: $($createResponse.temporaryPassword)"
            Write-Host ""
            Write-Host "   ВАЖНО: Сохраните этот пароль! Он отправлен подопечному по SMS."
        }
        Write-Host ""
        Write-Host "=== Следующие шаги ==="
        Write-Host "   - Подопечный появится в списке подопечных в кабинете опекуна"
        Write-Host "   - Подопечному отправлено SMS с данными для входа"
        Write-Host "   - Телефон для входа: $($wardData | ConvertFrom-Json | Select-Object -ExpandProperty phone)"
    } else {
        Write-Host "   ERROR: Неожиданный формат ответа"
        Write-Host "   Ответ: $($createResponse | ConvertTo-Json -Depth 5)"
    }
} catch {
    Write-Host "   ERROR: Ошибка создания подопечного: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Ответ: $responseBody"
    }
    exit 1
}

Write-Host ""
Write-Host "=== Готово ==="

