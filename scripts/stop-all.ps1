# Скрипт для остановки всех приложений проекта
# Использование: .\scripts\stop-all.ps1 [опции]

param(
    [switch]$Frontend,
    [switch]$Backend,
    [switch]$Gateway,
    [switch]$Services,
    [int]$Port
)

Write-Host "🛑 Остановка приложений проекта..." -ForegroundColor Yellow

# Порты проекта
$backendPorts = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012)
$frontendPorts = @(5174, 5175, 5185)
$allPorts = $backendPorts + $frontendPorts

if ($Port) {
    # Остановить конкретный порт
    Write-Host "Остановка процесса на порту $Port..." -ForegroundColor Cyan
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  Остановка процесса $($process.ProcessName) (PID: $($process.Id)) на порту $Port" -ForegroundColor Gray
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "✓ Порт $Port освобожден" -ForegroundColor Green
    } else {
        Write-Host "  Порт $Port уже свободен" -ForegroundColor Gray
    }
} elseif ($Frontend) {
    # Остановить только фронтенд
    Write-Host "Остановка фронтенд приложений..." -ForegroundColor Cyan
    $frontendPorts | ForEach-Object {
        $connections = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
        if ($connections) {
            $connections | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Write-Host "  ✓ Порт $_ освобожден" -ForegroundColor Green
        }
    }
} elseif ($Backend) {
    # Остановить только бэкенд
    Write-Host "Остановка бэкенд сервисов..." -ForegroundColor Cyan
    $backendPorts | ForEach-Object {
        $connections = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
        if ($connections) {
            $connections | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Write-Host "  ✓ Порт $_ освобожден" -ForegroundColor Green
        }
    }
} elseif ($Gateway) {
    # Остановить только API Gateway
    Write-Host "Остановка API Gateway (порт 3000)..." -ForegroundColor Cyan
    $connections = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($connections) {
        $connections | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Write-Host "✓ API Gateway остановлен" -ForegroundColor Green
    } else {
        Write-Host "  API Gateway уже остановлен" -ForegroundColor Gray
    }
} elseif ($Services) {
    # Остановить только микросервисы (без Gateway)
    Write-Host "Остановка микросервисов..." -ForegroundColor Cyan
    $servicesPorts = $backendPorts | Where-Object { $_ -ne 3000 }
    $servicesPorts | ForEach-Object {
        $connections = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
        if ($connections) {
            $connections | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
            Write-Host "  ✓ Порт $_ освобожден" -ForegroundColor Green
        }
    }
} else {
    # Остановить все
    Write-Host "Остановка всех приложений..." -ForegroundColor Cyan
    
    # Остановить по портам
    $allPorts | ForEach-Object {
        $connections = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
        if ($connections) {
            $connections | ForEach-Object {
                Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    }
    
    # Остановить оставшиеся Node.js процессы (на всякий случай)
    $nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Остановка оставшихся Node.js процессов..." -ForegroundColor Cyan
        $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host "✓ Все приложения остановлены" -ForegroundColor Green
}

# Проверка
Write-Host "`nПроверка занятых портов..." -ForegroundColor Yellow
$occupiedPorts = $allPorts | ForEach-Object {
    $conn = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($conn) { $_ }
}

if ($occupiedPorts) {
    Write-Host "⚠ Все еще заняты порты: $($occupiedPorts -join ', ')" -ForegroundColor Red
} else {
    Write-Host "✓ Все порты свободны" -ForegroundColor Green
}

Write-Host "`nГотово!" -ForegroundColor Green

