# PowerShell script to generate secure secrets for Care Monitoring System
# Usage: .\scripts\generate-secrets.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔐 Generating secure secrets for Care Monitoring System" -ForegroundColor Cyan
Write-Host ""

function Generate-RandomBase64 {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Generate-RandomHex {
    param([int]$Length = 16)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📝 Generated Secrets (copy these to your .env files):" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "# JWT Secrets" -ForegroundColor Green
Write-Host "JWT_SECRET=$(Generate-RandomBase64 -Length 32)"
Write-Host "JWT_REFRESH_SECRET=$(Generate-RandomBase64 -Length 32)"
Write-Host ""

Write-Host "# Database Password" -ForegroundColor Green
Write-Host "DB_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host "POSTGRES_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host ""

Write-Host "# Redis Password" -ForegroundColor Green
Write-Host "REDIS_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host ""

Write-Host "# RabbitMQ Password" -ForegroundColor Green
Write-Host "RABBITMQ_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host ""

Write-Host "# API Keys" -ForegroundColor Green
Write-Host "API_KEY=[guid]::NewGuid().ToString()"
Write-Host "DEVICE_API_KEY=[guid]::NewGuid().ToString()"
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Secrets generated successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   - Store these secrets securely"
Write-Host "   - Never commit them to version control"
Write-Host "   - Use different secrets for each environment"
Write-Host "   - Rotate secrets every 90 days"


# Usage: .\scripts\generate-secrets.ps1

$ErrorActionPreference = "Stop"

Write-Host "🔐 Generating secure secrets for Care Monitoring System" -ForegroundColor Cyan
Write-Host ""

function Generate-RandomBase64 {
    param([int]$Length = 32)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Generate-RandomHex {
    param([int]$Length = 16)
    $bytes = New-Object byte[] $Length
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📝 Generated Secrets (copy these to your .env files):" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

Write-Host "# JWT Secrets" -ForegroundColor Green
Write-Host "JWT_SECRET=$(Generate-RandomBase64 -Length 32)"
Write-Host "JWT_REFRESH_SECRET=$(Generate-RandomBase64 -Length 32)"
Write-Host ""

Write-Host "# Database Password" -ForegroundColor Green
Write-Host "DB_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host "POSTGRES_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host ""

Write-Host "# Redis Password" -ForegroundColor Green
Write-Host "REDIS_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host ""

Write-Host "# RabbitMQ Password" -ForegroundColor Green
Write-Host "RABBITMQ_PASSWORD=$(Generate-RandomBase64 -Length 24)"
Write-Host ""

Write-Host "# API Keys" -ForegroundColor Green
Write-Host "API_KEY=[guid]::NewGuid().ToString()"
Write-Host "DEVICE_API_KEY=[guid]::NewGuid().ToString()"
Write-Host ""

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Secrets generated successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "   - Store these secrets securely"
Write-Host "   - Never commit them to version control"
Write-Host "   - Use different secrets for each environment"
Write-Host "   - Rotate secrets every 90 days"







