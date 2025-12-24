#!/bin/bash

set -e

KEEP_INFRA=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-infra)
            KEEP_INFRA=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

echo "Restarting all services..."

# Порты всех сервисов
PORTS=(3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010 3011 3012 5173 5174 5175 5185)

echo "Stopping all services..."

# Останавливаем все процессы на портах
if command -v lsof &> /dev/null; then
    for PORT in "${PORTS[@]}"; do
        PID=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ -n "$PID" ]; then
            echo "  Killing process $PID on port $PORT"
            kill -9 $PID 2>/dev/null || true
        fi
    done
    sleep 2
elif command -v fuser &> /dev/null; then
    for PORT in "${PORTS[@]}"; do
        fuser -k $PORT/tcp 2>/dev/null || true
    done
    sleep 2
else
    echo "  Warning: lsof or fuser not found, cannot automatically kill processes"
fi

# Убиваем все node процессы связанные с проектом
echo "Stopping all Node.js processes for this project..."
NODE_PIDS=$(ps aux | grep -E "node.*($ROOT|api-gateway|microservices|frontend/apps)" | grep -v grep | awk '{print $2}' || true)
if [ -n "$NODE_PIDS" ]; then
    echo "$NODE_PIDS" | while read PID; do
        echo "  Killing Node.js process $PID"
        kill -9 $PID 2>/dev/null || true
    done
    sleep 3
fi

# Очищаем старые job файлы
JOBS_DIR="$ROOT/.service-jobs"
if [ -d "$JOBS_DIR" ]; then
    echo "Cleaning old service job files..."
    rm -f "$JOBS_DIR"/*-job.json
fi

# Если не нужно сохранять инфраструктуру, проверяем и перезапускаем
if [ "$KEEP_INFRA" = false ]; then
    echo "Checking infrastructure..."
    if docker compose -f infrastructure/docker-compose.yml ps --format json 2>/dev/null | grep -q '"State":"running"'; then
        echo "Infrastructure is running. Use --keep-infra to skip restart."
        echo "To restart infrastructure, run: npm run dev:infra:down && npm run dev:infra"
    else
        echo "Starting infrastructure..."
        npm run dev:infra
        sleep 5
    fi
fi

# Устанавливаем переменные окружения
export JWT_SECRET="${JWT_SECRET:-please-change-me}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-please-change-refresh}"

echo "Starting all services..."
echo "  Running: npm run dev:all"

# Запускаем все сервисы в фоновом режиме
mkdir -p "$JOBS_DIR"
nohup npm run dev:all > "$JOBS_DIR/all-services.log" 2>&1 &
JOB_PID=$!

# Сохраняем информацию о процессе
cat > "$JOBS_DIR/all-services-job.json" <<EOF
{
  "type": "all-services",
  "pid": $JOB_PID,
  "startedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "All services restart initiated (PID: $JOB_PID)"
echo "Services are starting in background..."
echo "Logs: $JOBS_DIR/all-services.log"

exit 0

