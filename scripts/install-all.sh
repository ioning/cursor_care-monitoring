#!/bin/bash

# Скрипт для установки всех зависимостей
set -euo pipefail

echo "🚀 Installing all dependencies..."
echo ""

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")"/.. && pwd)"

install_pkg() {
  local dir="$1"
  if [ -f "$dir/package.json" ]; then
    echo "📦 Installing $(basename "$dir")..."
    (cd "$dir" && npm install)
    echo "✅ Installed $(basename "$dir")"
    echo ""
  fi
}

# 1. shared
install_pkg "$ROOT_DIR/shared"

# 2. frontend packages
install_pkg "$ROOT_DIR/frontend/packages/realtime"

# 3. api-gateway
install_pkg "$ROOT_DIR/api-gateway"

# 4. microservices
echo "📦 Installing microservices..."
for service in "$ROOT_DIR"/microservices/*/; do
  install_pkg "$service"
done
echo "✅ All microservices installed"
echo ""

# 5. frontend apps
echo "📦 Installing frontend apps..."
for app in "$ROOT_DIR"/frontend/apps/*/; do
  install_pkg "$app"
done
echo "✅ All frontend apps installed"
echo ""

echo "🎉 All dependencies installed successfully!"