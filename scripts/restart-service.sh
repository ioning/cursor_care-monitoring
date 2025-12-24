#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <service-name>"
    echo "Available services: api-gateway, auth-service, user-service, device-service, telemetry-service, alert-service, location-service, billing-service, integration-service, dispatcher-service, analytics-service, ai-prediction-service, organization-service"
    exit 1
fi

SERVICE_NAME="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Маппинг имен сервисов на порты и npm скрипты
declare -A SERVICE_MAP
SERVICE_MAP["api-gateway"]="3000:dev:gateway:api-gateway"
SERVICE_MAP["auth-service"]="3001:dev:auth:microservices/auth-service"
SERVICE_MAP["user-service"]="3002:dev:user:microservices/user-service"
SERVICE_MAP["device-service"]="3003:dev:device:microservices/device-service"
SERVICE_MAP["telemetry-service"]="3004:dev:telemetry:microservices/telemetry-service"
SERVICE_MAP["alert-service"]="3005:dev:alert:microservices/alert-service"
SERVICE_MAP["location-service"]="3006:dev:location:microservices/location-service"
SERVICE_MAP["billing-service"]="3007:dev:billing:microservices/billing-service"
SERVICE_MAP["integration-service"]="3008:dev:integration:microservices/integration-service"
SERVICE_MAP["dispatcher-service"]="3009:dev:dispatcher-service:microservices/dispatcher-service"
SERVICE_MAP["analytics-service"]="3010:dev:analytics:microservices/analytics-service"
SERVICE_MAP["ai-prediction-service"]="3011:dev:ai-prediction:microservices/ai-prediction-service"
SERVICE_MAP["organization-service"]="3012:dev:organization:microservices/organization-service"

SERVICE_NAME_LOWER=$(echo "$SERVICE_NAME" | tr '[:upper:]' '[:lower:]')

if [ -z "${SERVICE_MAP[$SERVICE_NAME_LOWER]}" ]; then
    echo "Error: Unknown service: $SERVICE_NAME"
    echo "Available services: ${!SERVICE_MAP[@]}"
    exit 1
fi

SERVICE_INFO="${SERVICE_MAP[$SERVICE_NAME_LOWER]}"
PORT=$(echo "$SERVICE_INFO" | cut -d: -f1)
SCRIPT=$(echo "$SERVICE_INFO" | cut -d: -f2)
SERVICE_PATH=$(echo "$SERVICE_INFO" | cut -d: -f3-)

echo "Restarting service: $SERVICE_NAME (port $PORT)..."

# Останавливаем процесс на порту
echo "Stopping service on port $PORT..."
if command -v lsof &> /dev/null; then
    PID=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
        echo "  Killing process $PID on port $PORT"
        kill -9 $PID 2>/dev/null || true
        sleep 2
    else
        echo "  No process found on port $PORT"
    fi
elif command -v fuser &> /dev/null; then
    fuser -k $PORT/tcp 2>/dev/null || true
    sleep 2
else
    echo "  Warning: lsof or fuser not found, cannot automatically kill process on port $PORT"
    echo "  Please stop the service manually"
fi

# Дополнительно ищем процессы node связанные с этим сервисом
echo "Searching for Node.js processes for $SERVICE_NAME..."
NODE_PIDS=$(ps aux | grep -E "node.*$SERVICE_PATH" | grep -v grep | awk '{print $2}' || true)
if [ -n "$NODE_PIDS" ]; then
    echo "$NODE_PIDS" | while read PID; do
        echo "  Killing Node.js process $PID for $SERVICE_NAME"
        kill -9 $PID 2>/dev/null || true
    done
    sleep 2
fi

# Устанавливаем переменные окружения если не заданы
export JWT_SECRET="${JWT_SECRET:-please-change-me}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-please-change-refresh}"

echo "Starting service $SERVICE_NAME..."
echo "  Running: npm run $SCRIPT"

# Запускаем сервис в фоновом режиме
nohup npm run "$SCRIPT" > "$ROOT/.service-jobs/$SERVICE_NAME_LOWER.log" 2>&1 &
JOB_PID=$!

# Сохраняем информацию о процессе
JOBS_DIR="$ROOT/.service-jobs"
mkdir -p "$JOBS_DIR"
cat > "$JOBS_DIR/$SERVICE_NAME_LOWER-job.json" <<EOF
{
  "serviceName": "$SERVICE_NAME",
  "pid": $JOB_PID,
  "port": $PORT,
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "Service $SERVICE_NAME restart initiated (PID: $JOB_PID)"
echo "Service is starting in background..."
echo "Logs: $JOBS_DIR/$SERVICE_NAME_LOWER.log"

exit 0

