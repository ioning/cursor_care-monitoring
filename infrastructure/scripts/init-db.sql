-- Инициализация баз данных для микросервисов

-- Auth Service Database
CREATE DATABASE auth_db;
GRANT ALL PRIVILEGES ON DATABASE auth_db TO cms_user;

-- User Service Database
CREATE DATABASE user_db;
GRANT ALL PRIVILEGES ON DATABASE user_db TO cms_user;

-- Device Service Database
CREATE DATABASE device_db;
GRANT ALL PRIVILEGES ON DATABASE device_db TO cms_user;

-- Telemetry Service Database
CREATE DATABASE telemetry_db;
GRANT ALL PRIVILEGES ON DATABASE telemetry_db TO cms_user;

-- Alert Service Database
CREATE DATABASE alert_db;
GRANT ALL PRIVILEGES ON DATABASE alert_db TO cms_user;

-- Location Service Database
CREATE DATABASE location_db;
GRANT ALL PRIVILEGES ON DATABASE location_db TO cms_user;

-- Billing Service Database
CREATE DATABASE billing_db;
GRANT ALL PRIVILEGES ON DATABASE billing_db TO cms_user;

-- Integration Service Database
CREATE DATABASE integration_db;
GRANT ALL PRIVILEGES ON DATABASE integration_db TO cms_user;

-- Dispatcher Service Database
CREATE DATABASE dispatcher_db;
GRANT ALL PRIVILEGES ON DATABASE dispatcher_db TO cms_user;

-- Analytics Service Database
CREATE DATABASE analytics_db;
GRANT ALL PRIVILEGES ON DATABASE analytics_db TO cms_user;

-- AI Prediction Service Database
CREATE DATABASE ai_prediction_db;
GRANT ALL PRIVILEGES ON DATABASE ai_prediction_db TO cms_user;

-- Organization Service Database
CREATE DATABASE organization_db;
GRANT ALL PRIVILEGES ON DATABASE organization_db TO cms_user;

