param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName
)

$ErrorActionPreference = "Stop"

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
Set-Location $Root

# Маппинг имен сервисов на порты и npm скрипты
$serviceMap = @{
    "api-gateway" = @{ Port = 3000; Script = "dev:gateway"; Path = "api-gateway" }
    "auth-service" = @{ Port = 3001; Script = "dev:auth"; Path = "microservices/auth-service" }
    "user-service" = @{ Port = 3002; Script = "dev:user"; Path = "microservices/user-service" }
    "device-service" = @{ Port = 3003; Script = "dev:device"; Path = "microservices/device-service" }
    "telemetry-service" = @{ Port = 3004; Script = "dev:telemetry"; Path = "microservices/telemetry-service" }
    "alert-service" = @{ Port = 3005; Script = "dev:alert"; Path = "microservices/alert-service" }
    "location-service" = @{ Port = 3006; Script = "dev:location"; Path = "microservices/location-service" }
    "billing-service" = @{ Port = 3007; Script = "dev:billing"; Path = "microservices/billing-service" }
    "integration-service" = @{ Port = 3008; Script = "dev:integration"; Path = "microservices/integration-service" }
    "dispatcher-service" = @{ Port = 3009; Script = "dev:dispatcher-service"; Path = "microservices/dispatcher-service" }
    "analytics-service" = @{ Port = 3010; Script = "dev:analytics"; Path = "microservices/analytics-service" }
    "ai-prediction-service" = @{ Port = 3011; Script = "dev:ai-prediction"; Path = "microservices/ai-prediction-service" }
    "organization-service" = @{ Port = 3012; Script = "dev:organization"; Path = "microservices/organization-service" }
}

$serviceNameLower = $ServiceName.ToLower()

if (-not $serviceMap.ContainsKey($serviceNameLower)) {
    Write-Error "Unknown service: $ServiceName. Available services: $($serviceMap.Keys -join ', ')"
    exit 1
}

$service = $serviceMap[$serviceNameLower]
$port = $service.Port

Write-Host "Restarting service: $ServiceName (port $port)..." -ForegroundColor Cyan

# Останавливаем процесс на порту
Write-Host "Stopping service on port $port..." -ForegroundColor Yellow
try {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($process) {
        foreach ($pid in $process) {
            Write-Host "  Killing process $pid on port $port" -ForegroundColor Gray
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        # Даем процессу время завершиться
        Start-Sleep -Seconds 2
    } else {
        Write-Host "  No process found on port $port" -ForegroundColor Gray
    }
} catch {
    Write-Warning "Could not stop process on port $port: $_"
}

# Дополнительно ищем процессы node.exe связанные с этим сервисом
Write-Host "Searching for Node.js processes for $ServiceName..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.Path -like "*$($service.Path)*" -or 
        (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)" | Select-Object -ExpandProperty CommandLine) -like "*$($service.Path)*"
    }
    
    foreach ($proc in $nodeProcesses) {
        Write-Host "  Killing Node.js process $($proc.Id) for $ServiceName" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    if ($nodeProcesses) {
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Warning "Could not find/kill Node.js processes: $_"
}

Write-Host "Starting service $ServiceName..." -ForegroundColor Yellow
Write-Host "  Running: npm run $($service.Script)" -ForegroundColor Gray

# Запускаем сервис в фоновом режиме
$job = Start-Job -ScriptBlock {
    param($rootPath, $scriptName)
    Set-Location $rootPath
    $env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "please-change-me" }
    $env:JWT_REFRESH_SECRET = if ($env:JWT_REFRESH_SECRET) { $env:JWT_REFRESH_SECRET } else { "please-change-refresh" }
    & npm run $scriptName 2>&1
} -ArgumentList $Root, $service.Script

# Сохраняем ID job для отслеживания
$jobFile = "$Root/.service-jobs/$serviceNameLower-job.json"
$jobDir = Split-Path -Parent $jobFile
if (-not (Test-Path $jobDir)) {
    New-Item -ItemType Directory -Path $jobDir -Force | Out-Null
}
@{
    ServiceName = $ServiceName
    JobId = $job.Id
    Port = $port
    StartedAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json | Set-Content $jobFile

Write-Host "Service $ServiceName restart initiated (Job ID: $($job.Id))" -ForegroundColor Green
Write-Host "Service is starting in background..." -ForegroundColor Gray

# Возвращаем успешный статус
exit 0

