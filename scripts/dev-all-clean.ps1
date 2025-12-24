$ErrorActionPreference = "Stop"

$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptPath
Set-Location $Root

# Unified dev JWT secrets for all services started from this script
# Keep defaults aligned with env.example templates
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = "please-change-me" }
if (-not $env:JWT_REFRESH_SECRET) { $env:JWT_REFRESH_SECRET = "please-change-refresh" }

# Database defaults for local docker-compose (avoid global DB_* on developer machines like DB_USER=postgres)
if (-not $env:POSTGRES_USER) { $env:POSTGRES_USER = "cms_user" }
if (-not $env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD = "cms_password" }
# Some services/scripts still read DB_USER/DB_PASSWORD; ensure they match docker-compose defaults.
if (-not $env:DB_USER) { $env:DB_USER = $env:POSTGRES_USER }
if (-not $env:DB_PASSWORD) { $env:DB_PASSWORD = $env:POSTGRES_PASSWORD }

# Backend ports
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
  3012  # organization-service
)

# Frontend ports
$ports += @(
  5173, # guardian-app
  5174, # dispatcher-app
  5175, # landing-app
  5185  # admin-app
)

& powershell -NoProfile -ExecutionPolicy Bypass -File "$Root/scripts/kill-ports.ps1" -Ports $ports

Write-Host ""
Write-Host "JWT_SECRET=$($env:JWT_SECRET)"
Write-Host "JWT_REFRESH_SECRET=$($env:JWT_REFRESH_SECRET)"
Write-Host ""
Write-Host "Starting: npm run dev:all"
Write-Host ""

& npm run dev:all


