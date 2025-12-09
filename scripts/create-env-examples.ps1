# PowerShell script to create .env.example files for all services
# Usage: .\scripts\create-env-examples.ps1

$ErrorActionPreference = "Stop"

Write-Host "📝 Creating .env.example files for all services..." -ForegroundColor Cyan

# API Gateway
@"
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Services URLs
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
DEVICE_SERVICE_URL=http://device-service:3003
TELEMETRY_SERVICE_URL=http://telemetry-service:3004
ALERT_SERVICE_URL=http://alert-service:3005
LOCATION_SERVICE_URL=http://location-service:3006
BILLING_SERVICE_URL=http://billing-service:3007
INTEGRATION_SERVICE_URL=http://integration-service:3008
DISPATCHER_SERVICE_URL=http://dispatcher-service:3009
ANALYTICS_SERVICE_URL=http://analytics-service:3010
AI_PREDICTION_SERVICE_URL=http://ai-prediction-service:3011
ORGANIZATION_SERVICE_URL=http://organization-service:3012

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
"@ | Out-File -FilePath "api-gateway\.env.example" -Encoding utf8 -NoNewline

# Auth Service
@"
# Application
NODE_ENV=development
PORT=3001
SERVICE_NAME=auth-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/auth_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=auth_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SESSION_TTL=86400

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Password
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Email (for verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@caremonitoring.ru
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@caremonitoring.ru

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\auth-service\.env.example" -Encoding utf8 -NoNewline

# User Service
@"
# Application
NODE_ENV=development
PORT=3002
SERVICE_NAME=user-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/user_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=user_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CACHE_TTL=300

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Auth Service (for token validation)
AUTH_SERVICE_URL=http://auth-service:3001

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\user-service\.env.example" -Encoding utf8 -NoNewline

# Device Service
@"
# Application
NODE_ENV=development
PORT=3003
SERVICE_NAME=device-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/device_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=device_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Device Protocols
BLE_SCAN_INTERVAL=5000
LORA_WAN_GATEWAY_URL=http://lorawan-gateway:8080

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\device-service\.env.example" -Encoding utf8 -NoNewline

# Telemetry Service
@"
# Application
NODE_ENV=development
PORT=3004
SERVICE_NAME=telemetry-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/telemetry_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=telemetry_db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_PARTITION_RETENTION_DAYS=90

# ClickHouse (for archive)
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=telemetry_archive
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CACHE_TTL=60

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events
RABBITMQ_TELEMETRY_QUEUE=telemetry-queue

# Processing
TELEMETRY_BATCH_SIZE=100
TELEMETRY_BATCH_TIMEOUT=5000
ANOMALY_DETECTION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\telemetry-service\.env.example" -Encoding utf8 -NoNewline

# Alert Service
@"
# Application
NODE_ENV=development
PORT=3005
SERVICE_NAME=alert-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/alert_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=alert_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events
RABBITMQ_ALERTS_QUEUE=alerts-queue

# Integration Service
INTEGRATION_SERVICE_URL=http://integration-service:3008

# Alert Rules
ALERT_RULES_RELOAD_INTERVAL=60
ALERT_ESCALATION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\alert-service\.env.example" -Encoding utf8 -NoNewline

# Location Service
@"
# Application
NODE_ENV=development
PORT=3006
SERVICE_NAME=location-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/location_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=location_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# PostGIS
POSTGIS_ENABLED=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_LOCATION_CACHE_TTL=300

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# External Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
YANDEX_MAPS_API_KEY=your-yandex-maps-api-key

# Geofencing
GEOFENCE_CHECK_INTERVAL=30
GEOFENCE_RADIUS_DEFAULT=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\location-service\.env.example" -Encoding utf8 -NoNewline

# Billing Service
@"
# Application
NODE_ENV=development
PORT=3007
SERVICE_NAME=billing-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/billing_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=billing_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Payment Providers
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
YOOKASSA_WEBHOOK_SECRET=your-webhook-secret

TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_PASSWORD=your-password
TINKOFF_WEBHOOK_SECRET=your-webhook-secret

# Currency
DEFAULT_CURRENCY=RUB

# Subscription
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
SUBSCRIPTION_RESTRICTION_DAYS=7

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\billing-service\.env.example" -Encoding utf8 -NoNewline

# Integration Service
@"
# Application
NODE_ENV=development
PORT=3008
SERVICE_NAME=integration-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/integration_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=integration_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# SMS Providers
SMS_RU_API_ID=your-sms-ru-api-id
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email
SENDGRID_API_KEY=SG.your-sendgrid-api-key
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=alerts@caremonitoring.ru

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://api.caremonitoring.ru/integrations/telegram/webhook

# Push Notifications
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-firebase-project-id
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_BUNDLE_ID=ru.caremonitoring.app
APNS_KEY_PATH=/certs/apns-key.p8

# Rate Limiting
SMS_RATE_LIMIT=100
EMAIL_RATE_LIMIT=1000
PUSH_RATE_LIMIT=10000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\integration-service\.env.example" -Encoding utf8 -NoNewline

# Dispatcher Service
@"
# Application
NODE_ENV=development
PORT=3009
SERVICE_NAME=dispatcher-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/dispatcher_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=dispatcher_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Location Service
LOCATION_SERVICE_URL=http://location-service:3006

# Integration Service
INTEGRATION_SERVICE_URL=http://integration-service:3008

# SMP Integration
SMP_API_URL=https://smp-api.example.com
SMP_API_KEY=your-smp-api-key

# Voice Calls
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\dispatcher-service\.env.example" -Encoding utf8 -NoNewline

# Analytics Service
@"
# Application
NODE_ENV=development
PORT=3010
SERVICE_NAME=analytics-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/analytics_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=analytics_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\analytics-service\.env.example" -Encoding utf8 -NoNewline

# AI Prediction Service
@"
# Application
NODE_ENV=development
PORT=3011
SERVICE_NAME=ai-prediction-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/ai_prediction_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=ai_prediction_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_MODEL_CACHE_TTL=3600

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events
RABBITMQ_TELEMETRY_QUEUE=telemetry-queue
RABBITMQ_PREDICTIONS_QUEUE=ai-predictions-queue

# ML Models
MODEL_STORAGE_PATH=/models
MODEL_REGISTRY_URL=http://model-registry:8080
FALL_PREDICTION_MODEL_VERSION=2.1.0
HEALTH_DETERIORATION_MODEL_VERSION=1.5.0

# Inference
INFERENCE_WORKERS=4
INFERENCE_TIMEOUT_MS=120
INFERENCE_BATCH_SIZE=32

# External AI Services
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
TENSORFLOW_SERVING_URL=http://tensorflow-serving:8501
PYTORCH_SERVING_URL=http://pytorch-serving:8080

# Training
TRAINING_DATA_PATH=/data/training
TRAINING_WORKERS=2
TRAINING_GPU_ENABLED=false

# Monitoring
MLFLOW_TRACKING_URI=http://mlflow:5000
MLFLOW_EXPERIMENT_NAME=care-monitoring

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\ai-prediction-service\.env.example" -Encoding utf8 -NoNewline

# Organization Service
@"
# Application
NODE_ENV=development
PORT=3012
SERVICE_NAME=organization-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/organization_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=organization_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\organization-service\.env.example" -Encoding utf8 -NoNewline

# Frontend apps
@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Care Monitoring - Guardian
VITE_APP_VERSION=1.0.0

# Features
VITE_AI_INSIGHTS_ENABLED=true
VITE_REAL_TIME_UPDATES_ENABLED=true
VITE_MAP_PROVIDER=google

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXX-Y
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
"@ | Out-File -FilePath "frontend\apps\guardian-app\.env.example" -Encoding utf8 -NoNewline

@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Care Monitoring - Dispatcher
VITE_APP_VERSION=1.0.0

# Features
VITE_MAP_PROVIDER=google
VITE_VOICE_CALLS_ENABLED=true
"@ | Out-File -FilePath "frontend\apps\dispatcher-app\.env.example" -Encoding utf8 -NoNewline

@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Care Monitoring - Admin
VITE_APP_VERSION=1.0.0

# Features
VITE_ADMIN_FEATURES_ENABLED=true
"@ | Out-File -FilePath "frontend\apps\admin-app\.env.example" -Encoding utf8 -NoNewline

@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Care Monitoring
VITE_APP_VERSION=1.0.0

# Features
VITE_REGISTRATION_ENABLED=true
VITE_LOGIN_ENABLED=true
"@ | Out-File -FilePath "frontend\apps\landing-app\.env.example" -Encoding utf8 -NoNewline

Write-Host "✅ All .env.example files created successfully!" -ForegroundColor Green


# Usage: .\scripts\create-env-examples.ps1

$ErrorActionPreference = "Stop"

Write-Host "📝 Creating .env.example files for all services..." -ForegroundColor Cyan

# API Gateway
@"
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Services URLs
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
DEVICE_SERVICE_URL=http://device-service:3003
TELEMETRY_SERVICE_URL=http://telemetry-service:3004
ALERT_SERVICE_URL=http://alert-service:3005
LOCATION_SERVICE_URL=http://location-service:3006
BILLING_SERVICE_URL=http://billing-service:3007
INTEGRATION_SERVICE_URL=http://integration-service:3008
DISPATCHER_SERVICE_URL=http://dispatcher-service:3009
ANALYTICS_SERVICE_URL=http://analytics-service:3010
AI_PREDICTION_SERVICE_URL=http://ai-prediction-service:3011
ORGANIZATION_SERVICE_URL=http://organization-service:3012

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Monitoring
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
"@ | Out-File -FilePath "api-gateway\.env.example" -Encoding utf8 -NoNewline

# Auth Service
@"
# Application
NODE_ENV=development
PORT=3001
SERVICE_NAME=auth-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/auth_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=auth_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SESSION_TTL=86400

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Password
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Email (for verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@caremonitoring.ru
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@caremonitoring.ru

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\auth-service\.env.example" -Encoding utf8 -NoNewline

# User Service
@"
# Application
NODE_ENV=development
PORT=3002
SERVICE_NAME=user-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/user_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=user_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CACHE_TTL=300

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Auth Service (for token validation)
AUTH_SERVICE_URL=http://auth-service:3001

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\user-service\.env.example" -Encoding utf8 -NoNewline

# Device Service
@"
# Application
NODE_ENV=development
PORT=3003
SERVICE_NAME=device-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/device_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=device_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Device Protocols
BLE_SCAN_INTERVAL=5000
LORA_WAN_GATEWAY_URL=http://lorawan-gateway:8080

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\device-service\.env.example" -Encoding utf8 -NoNewline

# Telemetry Service
@"
# Application
NODE_ENV=development
PORT=3004
SERVICE_NAME=telemetry-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/telemetry_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=telemetry_db
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20
DATABASE_PARTITION_RETENTION_DAYS=90

# ClickHouse (for archive)
CLICKHOUSE_HOST=clickhouse
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=telemetry_archive
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CACHE_TTL=60

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events
RABBITMQ_TELEMETRY_QUEUE=telemetry-queue

# Processing
TELEMETRY_BATCH_SIZE=100
TELEMETRY_BATCH_TIMEOUT=5000
ANOMALY_DETECTION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\telemetry-service\.env.example" -Encoding utf8 -NoNewline

# Alert Service
@"
# Application
NODE_ENV=development
PORT=3005
SERVICE_NAME=alert-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/alert_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=alert_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events
RABBITMQ_ALERTS_QUEUE=alerts-queue

# Integration Service
INTEGRATION_SERVICE_URL=http://integration-service:3008

# Alert Rules
ALERT_RULES_RELOAD_INTERVAL=60
ALERT_ESCALATION_ENABLED=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\alert-service\.env.example" -Encoding utf8 -NoNewline

# Location Service
@"
# Application
NODE_ENV=development
PORT=3006
SERVICE_NAME=location-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/location_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=location_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# PostGIS
POSTGIS_ENABLED=true

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_LOCATION_CACHE_TTL=300

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# External Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
YANDEX_MAPS_API_KEY=your-yandex-maps-api-key

# Geofencing
GEOFENCE_CHECK_INTERVAL=30
GEOFENCE_RADIUS_DEFAULT=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\location-service\.env.example" -Encoding utf8 -NoNewline

# Billing Service
@"
# Application
NODE_ENV=development
PORT=3007
SERVICE_NAME=billing-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/billing_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=billing_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Payment Providers
YOOKASSA_SHOP_ID=your-shop-id
YOOKASSA_SECRET_KEY=your-secret-key
YOOKASSA_WEBHOOK_SECRET=your-webhook-secret

TINKOFF_TERMINAL_KEY=your-terminal-key
TINKOFF_PASSWORD=your-password
TINKOFF_WEBHOOK_SECRET=your-webhook-secret

# Currency
DEFAULT_CURRENCY=RUB

# Subscription
SUBSCRIPTION_GRACE_PERIOD_DAYS=3
SUBSCRIPTION_RESTRICTION_DAYS=7

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\billing-service\.env.example" -Encoding utf8 -NoNewline

# Integration Service
@"
# Application
NODE_ENV=development
PORT=3008
SERVICE_NAME=integration-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/integration_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=integration_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# SMS Providers
SMS_RU_API_ID=your-sms-ru-api-id
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email
SENDGRID_API_KEY=SG.your-sendgrid-api-key
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=alerts@caremonitoring.ru

# Telegram
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_WEBHOOK_URL=https://api.caremonitoring.ru/integrations/telegram/webhook

# Push Notifications
FIREBASE_SERVER_KEY=your-firebase-server-key
FIREBASE_PROJECT_ID=your-firebase-project-id
APNS_KEY_ID=your-apns-key-id
APNS_TEAM_ID=your-apns-team-id
APNS_BUNDLE_ID=ru.caremonitoring.app
APNS_KEY_PATH=/certs/apns-key.p8

# Rate Limiting
SMS_RATE_LIMIT=100
EMAIL_RATE_LIMIT=1000
PUSH_RATE_LIMIT=10000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\integration-service\.env.example" -Encoding utf8 -NoNewline

# Dispatcher Service
@"
# Application
NODE_ENV=development
PORT=3009
SERVICE_NAME=dispatcher-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/dispatcher_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=dispatcher_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Location Service
LOCATION_SERVICE_URL=http://location-service:3006

# Integration Service
INTEGRATION_SERVICE_URL=http://integration-service:3008

# SMP Integration
SMP_API_URL=https://smp-api.example.com
SMP_API_KEY=your-smp-api-key

# Voice Calls
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\dispatcher-service\.env.example" -Encoding utf8 -NoNewline

# Analytics Service
@"
# Application
NODE_ENV=development
PORT=3010
SERVICE_NAME=analytics-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/analytics_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=analytics_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\analytics-service\.env.example" -Encoding utf8 -NoNewline

# AI Prediction Service
@"
# Application
NODE_ENV=development
PORT=3011
SERVICE_NAME=ai-prediction-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/ai_prediction_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=ai_prediction_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_MODEL_CACHE_TTL=3600

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events
RABBITMQ_TELEMETRY_QUEUE=telemetry-queue
RABBITMQ_PREDICTIONS_QUEUE=ai-predictions-queue

# ML Models
MODEL_STORAGE_PATH=/models
MODEL_REGISTRY_URL=http://model-registry:8080
FALL_PREDICTION_MODEL_VERSION=2.1.0
HEALTH_DETERIORATION_MODEL_VERSION=1.5.0

# Inference
INFERENCE_WORKERS=4
INFERENCE_TIMEOUT_MS=120
INFERENCE_BATCH_SIZE=32

# External AI Services
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
TENSORFLOW_SERVING_URL=http://tensorflow-serving:8501
PYTORCH_SERVING_URL=http://pytorch-serving:8080

# Training
TRAINING_DATA_PATH=/data/training
TRAINING_WORKERS=2
TRAINING_GPU_ENABLED=false

# Monitoring
MLFLOW_TRACKING_URI=http://mlflow:5000
MLFLOW_EXPERIMENT_NAME=care-monitoring

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\ai-prediction-service\.env.example" -Encoding utf8 -NoNewline

# Organization Service
@"
# Application
NODE_ENV=development
PORT=3012
SERVICE_NAME=organization-service

# Database
DATABASE_URL=postgresql://cms_user:cms_password@postgres:5432/organization_db
DB_HOST=postgres
DB_PORT=5432
DB_USER=cms_user
DB_PASSWORD=cms_password
DB_NAME=organization_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://cms:cms@rabbitmq:5672
RABBITMQ_EXCHANGE=care-monitoring.events

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
"@ | Out-File -FilePath "microservices\organization-service\.env.example" -Encoding utf8 -NoNewline

# Frontend apps
@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Care Monitoring - Guardian
VITE_APP_VERSION=1.0.0

# Features
VITE_AI_INSIGHTS_ENABLED=true
VITE_REAL_TIME_UPDATES_ENABLED=true
VITE_MAP_PROVIDER=google

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXX-Y
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
"@ | Out-File -FilePath "frontend\apps\guardian-app\.env.example" -Encoding utf8 -NoNewline

@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Care Monitoring - Dispatcher
VITE_APP_VERSION=1.0.0

# Features
VITE_MAP_PROVIDER=google
VITE_VOICE_CALLS_ENABLED=true
"@ | Out-File -FilePath "frontend\apps\dispatcher-app\.env.example" -Encoding utf8 -NoNewline

@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000
VITE_APP_NAME=Care Monitoring - Admin
VITE_APP_VERSION=1.0.0

# Features
VITE_ADMIN_FEATURES_ENABLED=true
"@ | Out-File -FilePath "frontend\apps\admin-app\.env.example" -Encoding utf8 -NoNewline

@"
# Application
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Care Monitoring
VITE_APP_VERSION=1.0.0

# Features
VITE_REGISTRATION_ENABLED=true
VITE_LOGIN_ENABLED=true
"@ | Out-File -FilePath "frontend\apps\landing-app\.env.example" -Encoding utf8 -NoNewline

Write-Host "✅ All .env.example files created successfully!" -ForegroundColor Green







