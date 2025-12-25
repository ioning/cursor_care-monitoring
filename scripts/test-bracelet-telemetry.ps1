# Скрипт для отправки тестовых данных телеметрии от браслета
# Проверяет прохождение через все сервисы до фронта

$ErrorActionPreference = "Stop"

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
Set-Location $Root

# Конфигурация
$API_GATEWAY_URL = "http://localhost:3000"
$DEVICE_ID = "11111111-1111-1111-1111-111111111111"
$WARD_ID = "dac6bf83-aa52-42af-80ea-9ba5204e83b5"

# Учетные данные для логина (admin или guardian)
$ADMIN_EMAIL = "admin@care-monitoring.ru"
$ADMIN_PASSWORD = "14081979"

Write-Host "=== Тест отправки данных от браслета ==="
Write-Host ""

# Шаг 1: Логин для получения токена
Write-Host "1. Получение JWT токена..."
try {
    $loginBody = @{
        email = $ADMIN_EMAIL
        password = $ADMIN_PASSWORD
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Method Post -Uri "$API_GATEWAY_URL/api/v1/auth/login" `
        -ContentType "application/json" `
        -Body $loginBody `
        -ErrorAction Stop

    if ($loginResponse.success -and $loginResponse.data.tokens) {
        $TOKEN = $loginResponse.data.tokens.accessToken
        Write-Host "   OK: Токен получен"
    } else {
        throw "Неожиданный формат ответа от login"
    }
} catch {
    Write-Host "   ERROR: Ошибка логина: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Ответ: $responseBody"
    }
    exit 1
}

# Шаг 2: Проверка привязки устройства
Write-Host ""
Write-Host "2. Проверка привязки устройства к подопечному..."
try {
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }

    $devicesResponse = Invoke-RestMethod -Method Get -Uri "$API_GATEWAY_URL/api/v1/devices" `
        -Headers $headers `
        -ErrorAction Stop

    $device = $null
    if ($devicesResponse.success -and $devicesResponse.data) {
        $device = $devicesResponse.data | Where-Object { $_.id -eq $DEVICE_ID } | Select-Object -First 1
    } elseif ($devicesResponse -is [Array]) {
        $device = $devicesResponse | Where-Object { $_.id -eq $DEVICE_ID } | Select-Object -First 1
    }

    if ($device) {
        Write-Host "   OK: Устройство найдено: $($device.name)"
        if ($device.wardId) {
            Write-Host "   OK: Устройство привязано к подопечному: $($device.wardId)"
        } else {
            Write-Host "   WARNING: Устройство не привязано к подопечному, привязываю..."
            $linkBody = @{
                wardId = $WARD_ID
            } | ConvertTo-Json

            try {
                $linkResponse = Invoke-RestMethod -Method Post -Uri "$API_GATEWAY_URL/api/v1/devices/$DEVICE_ID/link" `
                    -Headers $headers `
                    -Body $linkBody `
                    -ErrorAction Stop
                Write-Host "   OK: Устройство привязано"
            } catch {
                Write-Host "   ERROR: Ошибка привязки: $($_.Exception.Message)"
            }
        }
    } else {
        Write-Host "   WARNING: Устройство не найдено. Убедитесь, что seed выполнен: npm run db:seed"
    }
} catch {
    Write-Host "   ERROR: Ошибка проверки устройства: $($_.Exception.Message)"
}

# Шаг 3: Отправка тестовых данных телеметрии
Write-Host ""
Write-Host "3. Отправка тестовых данных телеметрии..."

$now = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
$telemetryData = @{
    deviceId = $DEVICE_ID
    metrics = @(
        @{
            type = "heart_rate"
            value = 72
            unit = "bpm"
            qualityScore = 0.95
            timestamp = $now
        },
        @{
            type = "spo2"
            value = 98
            unit = "%"
            qualityScore = 0.92
            timestamp = $now
        },
        @{
            type = "temperature"
            value = 36.6
            unit = "c"
            qualityScore = 0.97
            timestamp = $now
        },
        @{
            type = "steps"
            value = 1250
            unit = "count"
            qualityScore = 0.90
            timestamp = $now
        },
        @{
            type = "battery"
            value = 85
            unit = "%"
            qualityScore = 1.0
            timestamp = $now
        }
    )
    location = @{
        latitude = 55.7558
        longitude = 37.6173
        accuracy = 10
        source = "gps"
    }
} | ConvertTo-Json -Depth 10

try {
    $telemetryResponse = Invoke-RestMethod -Method Post -Uri "$API_GATEWAY_URL/api/v1/telemetry" `
        -Headers $headers `
        -Body $telemetryData `
        -ErrorAction Stop

    Write-Host "   OK: Данные отправлены успешно"
    if ($telemetryResponse.data) {
        Write-Host "   Telemetry ID: $($telemetryResponse.data.telemetryId)"
        Write-Host "   Ward ID: $($telemetryResponse.data.wardId)"
        Write-Host "   Metrics Count: $($telemetryResponse.data.metricsCount)"
    }
} catch {
    Write-Host "   ERROR: Ошибка отправки телеметрии: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Ответ: $responseBody"
    }
    exit 1
}

# Шаг 4: Проверка получения данных на фронте
Write-Host ""
Write-Host "4. Проверка получения данных через API..."

Start-Sleep -Seconds 2

try {
    # Проверка latest telemetry
    $latestResponse = Invoke-RestMethod -Method Get -Uri "$API_GATEWAY_URL/api/v1/telemetry/wards/$WARD_ID/latest" `
        -Headers $headers `
        -ErrorAction Stop

    if ($latestResponse.success -and $latestResponse.data.metrics) {
        Write-Host "   OK: Latest telemetry получен"
        Write-Host "   Метрики:"
        foreach ($metric in $latestResponse.data.metrics.PSObject.Properties) {
            $metricData = $metric.Value
            Write-Host "     - $($metric.Name): $($metricData.value) $($metricData.unit)"
        }
    } else {
        Write-Host "   WARNING: Latest telemetry пуст или не найден"
    }
} catch {
    Write-Host "   ERROR: Ошибка получения latest telemetry: $($_.Exception.Message)"
}

try {
    # Проверка истории телеметрии
    $from = (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    $to = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    
    $historyUrl = "$API_GATEWAY_URL/api/v1/telemetry/wards/$WARD_ID"
    $historyParams = @{
        from = $from
        to = $to
        limit = 10
    }
    $historyResponse = Invoke-RestMethod -Method Get -Uri $historyUrl `
        -Headers $headers `
        -Body $historyParams `
        -ErrorAction Stop

    if ($historyResponse.success -and $historyResponse.data) {
        $count = if ($historyResponse.data -is [Array]) { $historyResponse.data.Count } else { 0 }
        Write-Host "   OK: История телеметрии получена: $count записей"
    } else {
        Write-Host "   WARNING: История телеметрии пуста"
    }
} catch {
    Write-Host "   ERROR: Ошибка получения истории: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "=== Тест завершен ==="
Write-Host ""
Write-Host "Проверьте фронтенд приложение:"
Write-Host "  - Откройте кабинет опекуна: http://localhost:5173"
Write-Host "  - Войдите как: $ADMIN_EMAIL / $ADMIN_PASSWORD"
Write-Host "  - Откройте детали подопечного"
Write-Host "  - Проверьте раздел текущие показатели"
