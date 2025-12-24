param(
    [switch]$KeepInfra = $false
)

$ErrorActionPreference = "Stop"

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
Set-Location $Root

Write-Host "Restarting all services..." -ForegroundColor Cyan

# Порты всех сервисов
$ports = @(
    3000, # api-gateway
    3001, # auth-service
    3002, # user-service
    3003, # device-service
    3004, # telemetry-service
    3005, # alert-service
    3006, # location-service
    3007, # billing-service
    3008, # integration-service
    3009, # dispatcher-service
    3010, # analytics-service
    3011, # ai-prediction-service
    3012, # organization-service
    5173, # guardian-app
    5174, # dispatcher-app
    5175, # landing-app
    5185  # admin-app
)

Write-Host "Stopping all services..." -ForegroundColor Yellow

# Останавливаем все процессы на портах
& powershell -NoProfile -ExecutionPolicy Bypass -File "$Root/scripts/kill-ports.ps1" -Ports $ports

# Дополнительно убиваем все node процессы связанные с проектом
Write-Host "Stopping all Node.js processes for this project..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $procPath = (Get-WmiObject Win32_Process -Filter "ProcessId = $($_.Id)" | Select-Object -ExpandProperty CommandLine)
        if ($procPath) {
            $procPath -like "*$Root*" -or 
            $procPath -like "*api-gateway*" -or
            $procPath -like "*microservices*" -or
            $procPath -like "*frontend/apps*"
        } else {
            $false
        }
    }
    
    foreach ($proc in $nodeProcesses) {
        Write-Host "  Killing Node.js process $($proc.Id)" -ForegroundColor Gray
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    
    if ($nodeProcesses) {
        Start-Sleep -Seconds 3
    }
} catch {
    Write-Warning "Could not find/kill Node.js processes: $_"
}

# Очищаем старые job файлы
$jobsDir = "$Root/.service-jobs"
if (Test-Path $jobsDir) {
    Write-Host "Cleaning old service job files..." -ForegroundColor Yellow
    Remove-Item "$jobsDir/*-job.json" -Force -ErrorAction SilentlyContinue
}

# Если не нужно сохранять инфраструктуру, перезапускаем ее
if (-not $KeepInfra) {
    Write-Host "Checking infrastructure..." -ForegroundColor Yellow
    $infraStatus = docker compose -f infrastructure/docker-compose.yml ps --format json 2>$null | ConvertFrom-Json | Where-Object { $_.State -eq "running" }
    
    if ($infraStatus) {
        Write-Host "Infrastructure is running. Use -KeepInfra to skip restart." -ForegroundColor Gray
        Write-Host "To restart infrastructure, run: npm run dev:infra:down && npm run dev:infra" -ForegroundColor Gray
    } else {
        Write-Host "Starting infrastructure..." -ForegroundColor Yellow
        & npm run dev:infra
        Start-Sleep -Seconds 5
    }
}

# Устанавливаем переменные окружения
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "please-change-me" }
if (-not $env:JWT_REFRESH_SECRET) { $env:JWT_REFRESH_SECRET = "please-change-refresh" }

Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host "  Running: npm run dev:all" -ForegroundColor Gray

# Запускаем все сервисы в фоновом режиме
$job = Start-Job -ScriptBlock {
    param($rootPath)
    Set-Location $rootPath
    $env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "please-change-me" }
    $env:JWT_REFRESH_SECRET = if ($env:JWT_REFRESH_SECRET) { $env:JWT_REFRESH_SECRET } else { "please-change-refresh" }
    & npm run dev:all 2>&1
} -ArgumentList $Root

# Сохраняем информацию о job
$jobsDir = "$Root/.service-jobs"
if (-not (Test-Path $jobsDir)) {
    New-Item -ItemType Directory -Path $jobsDir -Force | Out-Null
}
@{
    Type = "all-services"
    JobId = $job.Id
    StartedAt = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json | Set-Content "$jobsDir/all-services-job.json"

Write-Host "All services restart initiated (Job ID: $($job.Id))" -ForegroundColor Green
Write-Host "Services are starting in background..." -ForegroundColor Gray
Write-Host "Monitor logs in: $jobsDir/" -ForegroundColor Gray

exit 0

