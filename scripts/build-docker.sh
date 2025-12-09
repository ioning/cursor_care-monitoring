#!/bin/bash

# Script to build all Docker images for Care Monitoring System
# Usage: ./scripts/build-docker.sh [version]
# Example: ./scripts/build-docker.sh latest
# Example: ./scripts/build-docker.sh 1.0.0

set -e

VERSION=${1:-latest}
REGISTRY=${DOCKER_REGISTRY:-care-monitoring}

SERVICES=(
  "api-gateway"
  "microservices/auth-service"
  "microservices/user-service"
  "microservices/device-service"
  "microservices/telemetry-service"
  "microservices/alert-service"
  "microservices/location-service"
  "microservices/billing-service"
  "microservices/integration-service"
  "microservices/dispatcher-service"
  "microservices/analytics-service"
  "microservices/ai-prediction-service"
  "microservices/organization-service"
)

echo "🔨 Building Docker images with version: ${VERSION}"
echo "📦 Registry: ${REGISTRY}"
echo ""

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -d "microservices" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  exit 1
fi

# Build each service
for service in "${SERVICES[@]}"; do
  service_name=$(basename "$service")
  image_name="${REGISTRY}/${service_name}:${VERSION}"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔨 Building ${image_name}..."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  if docker build -f "${service}/Dockerfile" -t "${image_name}" .; then
    echo "✅ Successfully built ${image_name}"
    
    # Also tag as latest if version is not latest
    if [ "${VERSION}" != "latest" ]; then
      docker tag "${image_name}" "${REGISTRY}/${service_name}:latest"
      echo "✅ Tagged as ${REGISTRY}/${service_name}:latest"
    fi
  else
    echo "❌ Failed to build ${image_name}"
    exit 1
  fi
  
  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 All images built successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Image summary:"
docker images | grep "${REGISTRY}" | grep "${VERSION}" || true
echo ""
echo "💡 To push images to registry:"
echo "   docker push ${REGISTRY}/<service-name>:${VERSION}"







