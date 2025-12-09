#!/bin/bash

# Script to generate secure secrets for Care Monitoring System
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Generating secure secrets for Care Monitoring System"
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl is required but not installed"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Generated Secrets (copy these to your .env files):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "# JWT Secrets"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo ""

echo "# Database Password"
echo "DB_PASSWORD=$(openssl rand -base64 24)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "# Redis Password"
echo "REDIS_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "# RabbitMQ Password"
echo "RABBITMQ_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "# API Keys (generate UUIDs)"
if command -v uuidgen &> /dev/null; then
    echo "API_KEY=$(uuidgen)"
    echo "DEVICE_API_KEY=$(uuidgen)"
else
    echo "# Install uuidgen for UUID generation: apt-get install uuid-runtime (Linux) or brew install uuidgen (macOS)"
    echo "API_KEY=$(openssl rand -hex 16)"
    echo "DEVICE_API_KEY=$(openssl rand -hex 16)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secrets generated successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Store these secrets securely"
echo "   - Never commit them to version control"
echo "   - Use different secrets for each environment"
echo "   - Rotate secrets every 90 days"



# Script to generate secure secrets for Care Monitoring System
# Usage: ./scripts/generate-secrets.sh

set -e

echo "🔐 Generating secure secrets for Care Monitoring System"
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl is required but not installed"
    exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Generated Secrets (copy these to your .env files):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "# JWT Secrets"
echo "JWT_SECRET=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)"
echo ""

echo "# Database Password"
echo "DB_PASSWORD=$(openssl rand -base64 24)"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "# Redis Password"
echo "REDIS_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "# RabbitMQ Password"
echo "RABBITMQ_PASSWORD=$(openssl rand -base64 24)"
echo ""

echo "# API Keys (generate UUIDs)"
if command -v uuidgen &> /dev/null; then
    echo "API_KEY=$(uuidgen)"
    echo "DEVICE_API_KEY=$(uuidgen)"
else
    echo "# Install uuidgen for UUID generation: apt-get install uuid-runtime (Linux) or brew install uuidgen (macOS)"
    echo "API_KEY=$(openssl rand -hex 16)"
    echo "DEVICE_API_KEY=$(openssl rand -hex 16)"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Secrets generated successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Store these secrets securely"
echo "   - Never commit them to version control"
echo "   - Use different secrets for each environment"
echo "   - Rotate secrets every 90 days"







