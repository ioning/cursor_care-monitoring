# PowerShell скрипт для установки всех зависимостей

Write-Host "🚀 Installing all dependencies..." -ForegroundColor Green
Write-Host ""

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Install-PackageJson {
    param([string]$Path)
    if (Test-Path (Join-Path $Path "package.json")) {
        $name = Split-Path $Path -Leaf
        Write-Host "📦 Installing $name..." -ForegroundColor Cyan
        Push-Location $Path
        npm install
        Pop-Location
        Write-Host "✅ Installed $name" -ForegroundColor Green
        Write-Host ""
    }
}

# 1. shared
Install-PackageJson "$Root/shared"

# 2. frontend packages
Install-PackageJson "$Root/frontend/packages/realtime"

# 3. api-gateway
Install-PackageJson "$Root/api-gateway"

# 4. microservices
Write-Host "📦 Installing microservices..." -ForegroundColor Cyan
Get-ChildItem -Path "$Root/microservices" -Directory | ForEach-Object {
    Install-PackageJson $_.FullName
}
Write-Host "✅ All microservices installed" -ForegroundColor Green
Write-Host ""

# 5. frontend apps
Write-Host "📦 Installing frontend apps..." -ForegroundColor Cyan
Get-ChildItem -Path "$Root/frontend/apps" -Directory | ForEach-Object {
    Install-PackageJson $_.FullName
}
Write-Host "✅ All frontend apps installed" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 All dependencies installed successfully!" -ForegroundColor Green