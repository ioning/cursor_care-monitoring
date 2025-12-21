# Script to check individual project components
# Usage: .\scripts\check-services.ps1 [check_type]
# Types: all, infra, backend, frontend, service:<name>, port:<number>

param(
    [string]$Type = "all",
    [string]$ServiceName = "",
    [int]$Port = 0
)

Write-Host "`n=== Care Monitoring Project Components Check ===" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n" -ForegroundColor Gray

$results = @{
    Infrastructure = @()
    Backend = @()
    Frontend = @()
}

# Port check function
function Test-Port {
    param([int]$Port, [string]$Name)
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
        return $connection
    } catch {
        return $false
    }
}

# HTTP endpoint check function
function Test-HttpEndpoint {
    param([string]$Url, [int]$TimeoutSec = 2)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
        return @{Success = $true; StatusCode = $response.StatusCode; Content = $response.Content}
    } catch {
        return @{Success = $false; Error = $_.Exception.Message}
    }
}

# Infrastructure check
function Check-Infrastructure {
    Write-Host "`n[INFRASTRUCTURE]" -ForegroundColor Yellow
    Write-Host ("-" * 60) -ForegroundColor Gray
    
    # Check if Docker is running
    $dockerRunning = $false
    try {
        $dockerOutput = docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dockerRunning = $true
            Write-Host "  [OK] Docker: Running" -ForegroundColor Green
        } else {
            # Check if error is about Docker not running
            if ($dockerOutput -match "dockerDesktopLinuxEngine|The system cannot find the file specified") {
                Write-Host "  [FAIL] Docker: Not running" -ForegroundColor Red
                Write-Host "      -> Please start Docker Desktop and wait for it to fully initialize" -ForegroundColor Yellow
                Write-Host "      -> Then run this script again" -ForegroundColor Yellow
                Write-Host ""
                return
            }
        }
    } catch {
        Write-Host "  [FAIL] Docker: Cannot check status" -ForegroundColor Red
        Write-Host "      -> Please ensure Docker Desktop is installed and running" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    if (-not $dockerRunning) {
        Write-Host "  [FAIL] Docker: Not running" -ForegroundColor Red
        Write-Host "      -> Please start Docker Desktop and wait for it to fully initialize" -ForegroundColor Yellow
        Write-Host "      -> Then run this script again" -ForegroundColor Yellow
        Write-Host ""
        return
    }
    
    $infra = @(
        @{Name="PostgreSQL"; Port=5432; Type="Database"},
        @{Name="Redis"; Port=6379; Type="Cache"},
        @{Name="RabbitMQ"; Port=5672; Type="MessageQueue"},
        @{Name="RabbitMQ Management"; Port=15672; Type="WebUI"; Url="http://localhost:15672"}
    )
    
    foreach ($item in $infra) {
        $portOpen = Test-Port -Port $item.Port -Name $item.Name
        
        if ($portOpen) {
            $msg = "  [OK] " + $item.Name + " (port " + $item.Port + "): Running"
            Write-Host $msg -ForegroundColor Green
            
            # Дополнительная проверка для RabbitMQ Management
            if ($item.Url) {
                $httpCheck = Test-HttpEndpoint -Url $item.Url
                if ($httpCheck.Success) {
                    Write-Host "      -> Web UI available: $($item.Url)" -ForegroundColor DarkGreen
                }
            }
            
            $results.Infrastructure += @{Name=$item.Name; Status="[OK] Running"; Port=$item.Port}
        } else {
            $msg = "  [FAIL] " + $item.Name + " (port " + $item.Port + "): Not running"
            Write-Host $msg -ForegroundColor Red
            Write-Host "      -> Run: docker-compose -f infrastructure/docker-compose.yml up -d" -ForegroundColor Yellow
            $results.Infrastructure += @{Name=$item.Name; Status="[FAIL] Not Running"; Port=$item.Port}
        }
    }
}

# Backend services check
function Check-Backend {
    Write-Host "`n[BACKEND SERVICES]" -ForegroundColor Yellow
    Write-Host ("-" * 60) -ForegroundColor Gray
    
    $services = @(
        @{Port=3000; Path="/api/v1/health"; Name="API Gateway"; Command="npm run dev:gateway"},
        @{Port=3001; Path="/health"; Name="Auth Service"; Command="npm run dev:auth"},
        @{Port=3002; Path="/health"; Name="User Service"; Command="npm run dev:user"},
        @{Port=3003; Path="/health"; Name="Device Service"; Command="npm run dev:device"},
        @{Port=3004; Path="/health"; Name="Telemetry Service"; Command="npm run dev:telemetry"},
        @{Port=3005; Path="/health"; Name="Alert Service"; Command="npm run dev:alert"},
        @{Port=3006; Path="/health"; Name="Location Service"; Command="npm run dev:location"},
        @{Port=3007; Path="/health"; Name="Billing Service"; Command="npm run dev:billing"},
        @{Port=3008; Path="/health"; Name="Integration Service"; Command="npm run dev:integration"},
        @{Port=3009; Path="/health"; Name="Dispatcher Service"; Command="npm run dev:dispatcher-service"},
        @{Port=3010; Path="/health"; Name="Analytics Service"; Command="npm run dev:analytics"},
        @{Port=3011; Path="/health"; Name="AI Prediction Service"; Command="npm run dev:ai-prediction"},
        @{Port=3012; Path="/health"; Name="Organization Service"; Command="npm run dev:organization"}
    )
    
    foreach ($svc in $services) {
        $portOpen = Test-Port -Port $svc.Port -Name $svc.Name
        
        if ($portOpen) {
            $url = "http://localhost:$($svc.Port)$($svc.Path)"
            $httpCheck = Test-HttpEndpoint -Url $url
            
            if ($httpCheck.Success) {
                try {
                    $health = $httpCheck.Content | ConvertFrom-Json
                    $status = $health.status
                    $serviceName = $health.service
                    
                    $msg = "  [OK] " + $svc.Name + " (port " + $svc.Port + "): Running"
                    Write-Host $msg -ForegroundColor Green
                    Write-Host "      -> Status: $status" -ForegroundColor DarkGreen
                    
                    if ($health.checks) {
                        $checks = @()
                        if ($health.checks.database) { $checks += "DB: $($health.checks.database)" }
                        if ($health.checks.redis) { $checks += "Redis: $($health.checks.redis)" }
                        if ($health.checks.rabbitmq) { $checks += "RabbitMQ: $($health.checks.rabbitmq)" }
                        if ($checks.Count -gt 0) {
                            Write-Host "      -> Checks: $($checks -join ', ')" -ForegroundColor DarkGray
                        }
                    }
                    
                    $results.Backend += @{Name=$svc.Name; Status="[OK] Running"; Port=$svc.Port; Health=$status}
                } catch {
                    $msg = "  [WARN] " + $svc.Name + " (port " + $svc.Port + "): Responding but invalid format"
                    Write-Host $msg -ForegroundColor Yellow
                    $results.Backend += @{Name=$svc.Name; Status="[WARN] Responding"; Port=$svc.Port}
                }
            } else {
                # Try to get more info about the error
                $testUrl = "http://localhost:$($svc.Port)$($svc.Path)"
                $testCheck = Test-HttpEndpoint -Url $testUrl
                $errorMsg = if ($testCheck.Error) { $testCheck.Error } else { "404 Not Found or service not fully started" }
                
                $msg = "  [WARN] " + $svc.Name + " (port " + $svc.Port + "): Port open but health endpoint not responding"
                Write-Host $msg -ForegroundColor Yellow
                Write-Host "      -> Tried: $testUrl" -ForegroundColor DarkGray
                Write-Host "      -> Error: $errorMsg" -ForegroundColor DarkYellow
                Write-Host "      -> Note: Service may still be starting, health endpoint not registered, or controller order issue" -ForegroundColor DarkGray
                Write-Host "      -> See: HEALTH_ENDPOINT_404_FIX.md for troubleshooting" -ForegroundColor DarkGray
                $results.Backend += @{Name=$svc.Name; Status="[WARN] Port Open"; Port=$svc.Port}
            }
        } else {
            $msg = "  [FAIL] " + $svc.Name + " (port " + $svc.Port + "): Not running"
            Write-Host $msg -ForegroundColor Red
            Write-Host "      -> Run: $($svc.Command)" -ForegroundColor Yellow
            $results.Backend += @{Name=$svc.Name; Status="[FAIL] Not Running"; Port=$svc.Port}
        }
    }
}

# Frontend applications check
function Check-Frontend {
    Write-Host "`n[FRONTEND APPLICATIONS]" -ForegroundColor Yellow
    Write-Host ("-" * 60) -ForegroundColor Gray
    
    $apps = @(
        @{Port=5173; Name="Guardian App"; Command="npm run dev:guardian"; Url="http://localhost:5173"},
        @{Port=5174; Name="Dispatcher App"; Command="npm run dev:dispatcher"; Url="http://localhost:5174"},
        @{Port=5175; Name="Admin App"; Command="npm run dev:admin"; Url="http://localhost:5175"},
        @{Port=5176; Name="Landing App"; Command="npm run dev:landing"; Url="http://localhost:5176"}
    )
    
    foreach ($app in $apps) {
        $portOpen = Test-Port -Port $app.Port -Name $app.Name
        
        if ($portOpen) {
            $httpCheck = Test-HttpEndpoint -Url $app.Url
            
            if ($httpCheck.Success) {
                $msg = "  [OK] " + $app.Name + " (port " + $app.Port + "): Running"
                Write-Host $msg -ForegroundColor Green
                Write-Host "      -> URL: $($app.Url)" -ForegroundColor DarkGreen
                $results.Frontend += @{Name=$app.Name; Status="[OK] Running"; Port=$app.Port; Url=$app.Url}
            } else {
                $msg = "  [WARN] " + $app.Name + " (port " + $app.Port + "): Port open but not responding"
                Write-Host $msg -ForegroundColor Yellow
                $results.Frontend += @{Name=$app.Name; Status="[WARN] Port Open"; Port=$app.Port}
            }
        } else {
            $msg = "  [FAIL] " + $app.Name + " (port " + $app.Port + "): Not running"
            Write-Host $msg -ForegroundColor Red
            Write-Host "      -> Run: $($app.Command)" -ForegroundColor Yellow
            $results.Frontend += @{Name=$app.Name; Status="[FAIL] Not Running"; Port=$app.Port}
        }
    }
}

# Specific service check
function Check-SpecificService {
    param([string]$Name)
    
    $serviceMap = @{
        "api-gateway" = @{Port=3000; Path="/api/v1/health"; Command="npm run dev:gateway"}
        "auth" = @{Port=3001; Path="/health"; Command="npm run dev:auth"}
        "user" = @{Port=3002; Path="/health"; Command="npm run dev:user"}
        "device" = @{Port=3003; Path="/health"; Command="npm run dev:device"}
        "telemetry" = @{Port=3004; Path="/health"; Command="npm run dev:telemetry"}
        "alert" = @{Port=3005; Path="/health"; Command="npm run dev:alert"}
        "location" = @{Port=3006; Path="/health"; Command="npm run dev:location"}
        "billing" = @{Port=3007; Path="/health"; Command="npm run dev:billing"}
        "integration" = @{Port=3008; Path="/health"; Command="npm run dev:integration"}
        "dispatcher" = @{Port=3009; Path="/health"; Command="npm run dev:dispatcher-service"}
        "analytics" = @{Port=3010; Path="/health"; Command="npm run dev:analytics"}
        "ai-prediction" = @{Port=3011; Path="/health"; Command="npm run dev:ai-prediction"}
        "organization" = @{Port=3012; Path="/health"; Command="npm run dev:organization"}
    }
    
    $nameLower = $Name.ToLower()
    if ($serviceMap.ContainsKey($nameLower)) {
        $svc = $serviceMap[$nameLower]
        Write-Host "`n[Checking service: $Name]" -ForegroundColor Cyan
        Write-Host ("-" * 60) -ForegroundColor Gray
        
        $portOpen = Test-Port -Port $svc.Port -Name $Name
        if ($portOpen) {
            $url = "http://localhost:$($svc.Port)$($svc.Path)"
            $httpCheck = Test-HttpEndpoint -Url $url
            
            if ($httpCheck.Success) {
                $health = $httpCheck.Content | ConvertFrom-Json
                Write-Host "  [OK] Сервис работает" -ForegroundColor Green
                Write-Host "  Порт: $($svc.Port)" -ForegroundColor White
                Write-Host "  Health endpoint: $url" -ForegroundColor White
                Write-Host "  Status: $($health.status)" -ForegroundColor White
                if ($health.checks) {
                    Write-Host "  Dependency checks:" -ForegroundColor White
                    if ($health.checks.database) { Write-Host "    - База данных: $($health.checks.database)" -ForegroundColor $(if ($health.checks.database -eq 'up') {'Green'} else {'Red'}) }
                    if ($health.checks.redis) { Write-Host "    - Redis: $($health.checks.redis)" -ForegroundColor $(if ($health.checks.redis -eq 'up') {'Green'} else {'Yellow'}) }
                    if ($health.checks.rabbitmq) { Write-Host "    - RabbitMQ: $($health.checks.rabbitmq)" -ForegroundColor $(if ($health.checks.rabbitmq -eq 'up') {'Green'} else {'Yellow'}) }
                }
            } else {
                Write-Host "  [WARN] Порт открыт, но health endpoint не отвечает" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  [FAIL] Service not running" -ForegroundColor Red
            Write-Host "  Run command: $($svc.Command)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  [FAIL] Unknown service: $Name" -ForegroundColor Red
        Write-Host "  Available services: $($serviceMap.Keys -join ', ')" -ForegroundColor Yellow
    }
}

# Specific port check
function Check-SpecificPort {
    param([int]$Port)
    
    Write-Host "`n[Checking port: $Port]" -ForegroundColor Cyan
    Write-Host ("-" * 60) -ForegroundColor Gray
    
    $portOpen = Test-Port -Port $Port -Name "Port $Port"
    
    if ($portOpen) {
        Write-Host "  [OK] Порт $Port открыт" -ForegroundColor Green
        
        # Попробуем проверить HTTP endpoints
        $commonPaths = @("/health", "/api/v1/health", "/", "/api/docs")
        foreach ($path in $commonPaths) {
            $url = "http://localhost:$Port$path"
            $httpCheck = Test-HttpEndpoint -Url $url -TimeoutSec 1
            if ($httpCheck.Success) {
                Write-Host "  -> HTTP endpoint доступен: $url" -ForegroundColor DarkGreen
                break
            }
        }
        
        # Показать процесс, использующий порт
        try {
            $connection = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
            if ($connection) {
                $process = Get-Process -Id $connection.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  -> Процесс: $($process.Name) (PID: $($process.Id))" -ForegroundColor DarkGray
                }
            }
        } catch {
            # Игнорируем ошибки
        }
    } else {
        Write-Host "  [FAIL] Порт $Port закрыт или не используется" -ForegroundColor Red
    }
}

# Main logic
switch ($Type.ToLower()) {
    "infra" {
        Check-Infrastructure
    }
    "backend" {
        Check-Backend
    }
    "frontend" {
        Check-Frontend
    }
    "service" {
        if ($ServiceName) {
            Check-SpecificService -Name $ServiceName
        } else {
            Write-Host "[FAIL] Specify service name: -ServiceName name" -ForegroundColor Red
        }
    }
    "port" {
        if ($Port -gt 0) {
            Check-SpecificPort -Port $Port
        } else {
            Write-Host "[FAIL] Specify port number: -Port number" -ForegroundColor Red
        }
    }
    default {
        Check-Infrastructure
        Check-Backend
        Check-Frontend
    }
}

# Final statistics
if ($Type -eq "all" -or $Type -eq "") {
    Write-Host "`n[FINAL STATISTICS]" -ForegroundColor Cyan
    Write-Host ("-" * 60) -ForegroundColor Gray
    
    $infraOk = ($results.Infrastructure | Where-Object { $_.Status -like "*OK*" }).Count
    $infraTotal = $results.Infrastructure.Count
    Write-Host "  Infrastructure: $infraOk/$infraTotal running" -ForegroundColor $(if ($infraOk -eq $infraTotal) {'Green'} else {'Yellow'})
    
    $backendOk = ($results.Backend | Where-Object { $_.Status -like "*OK*" }).Count
    $backendTotal = $results.Backend.Count
    Write-Host "  Backend services: $backendOk/$backendTotal running" -ForegroundColor $(if ($backendOk -eq $backendTotal) {'Green'} else {'Yellow'})
    
    $frontendOk = ($results.Frontend | Where-Object { $_.Status -like "*OK*" }).Count
    $frontendTotal = $results.Frontend.Count
    Write-Host "  Frontend apps: $frontendOk/$frontendTotal running" -ForegroundColor $(if ($frontendOk -eq $frontendTotal) {'Green'} else {'Yellow'})
}

Write-Host "`n[Useful commands:]" -ForegroundColor Cyan
Write-Host "  Start all services: npm run dev:all" -ForegroundColor White
Write-Host "  Start infrastructure: npm run dev:infra" -ForegroundColor White
$cmd1 = ".\scripts\check-services.ps1 -Type service -ServiceName auth"
$cmd2 = ".\scripts\check-services.ps1 -Type port -Port 3001"
Write-Host "  Check specific service: $cmd1" -ForegroundColor White
Write-Host "  Check specific port: $cmd2" -ForegroundColor White
Write-Host ""

