# PowerShell script to build all Docker images for Care Monitoring System
# Usage: .\scripts\build-docker.ps1 [version]
# Example: .\scripts\build-docker.ps1 latest
# Example: .\scripts\build-docker.ps1 1.0.0

param(
    [string]$Version = "latest",
    [string]$Registry = "care-monitoring"
)

$ErrorActionPreference = "Stop"

$Services = @(
    "api-gateway",
    "microservices/auth-service",
    "microservices/user-service",
    "microservices/device-service",
    "microservices/telemetry-service",
    "microservices/alert-service",
    "microservices/location-service",
    "microservices/billing-service",
    "microservices/integration-service",
    "microservices/dispatcher-service",
    "microservices/analytics-service",
    "microservices/ai-prediction-service",
    "microservices/organization-service"
)

Write-Host "🔨 Building Docker images with version: $Version" -ForegroundColor Cyan
Write-Host "📦 Registry: $Registry" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "package.json") -or -not (Test-Path "microservices")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

# Build each service
foreach ($service in $Services) {
    $serviceName = Split-Path $service -Leaf
    $imageName = "$Registry/$serviceName`:$Version"
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "🔨 Building $imageName..." -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    $dockerfilePath = Join-Path $service "Dockerfile"
    
    if (docker build -f $dockerfilePath -t $imageName .) {
        Write-Host "✅ Successfully built $imageName" -ForegroundColor Green
        
        # Also tag as latest if version is not latest
        if ($Version -ne "latest") {
            docker tag $imageName "$Registry/$serviceName`:latest"
            Write-Host "✅ Tagged as $Registry/$serviceName`:latest" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Failed to build $imageName" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "🎉 All images built successfully!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📊 Image summary:" -ForegroundColor Cyan
docker images | Select-String "$Registry" | Select-String "$Version"
Write-Host ""
Write-Host "💡 To push images to registry:" -ForegroundColor Yellow
Write-Host "   docker push $Registry/<service-name>:$Version" -ForegroundColor Yellow







