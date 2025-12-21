# PowerShell script to install all dependencies (ASCII only)
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

Write-Host "Installing all dependencies..."
Write-Host ""

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
Set-Location $Root

function Install-PackageJson {
    param([string]$Path)
    if (Test-Path (Join-Path $Path "package.json")) {
        $name = Split-Path $Path -Leaf
        Write-Host "Installing $name..."
        Push-Location $Path
        try {
            & npm install
        } finally {
            Pop-Location
        }
        Write-Host "Installed $name."
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
Write-Host "Installing microservices..."
Get-ChildItem -Path "$Root/microservices" -Directory | ForEach-Object {
    Install-PackageJson $_.FullName
}
Write-Host "Microservices done."
Write-Host ""

# 5. frontend apps
Write-Host "Installing frontend apps..."
Get-ChildItem -Path "$Root/frontend/apps" -Directory | ForEach-Object {
    Install-PackageJson $_.FullName
}
Write-Host "Frontend apps done."
Write-Host ""

Write-Host "All dependencies installed successfully."