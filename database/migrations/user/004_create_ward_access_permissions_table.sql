-- UP
-- Таблица для хранения гранулярных прав доступа пользователей к данным подопечных
CREATE TABLE IF NOT EXISTS ward_access_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES users(id), -- Кто предоставил доступ
  access_level VARCHAR(50) DEFAULT 'viewer' CHECK (access_level IN ('viewer', 'editor', 'admin')),
  
  -- Права на телеметрию
  can_view_telemetry BOOLEAN DEFAULT FALSE,
  can_view_heart_rate BOOLEAN DEFAULT FALSE,
  can_view_blood_pressure BOOLEAN DEFAULT FALSE,
  can_view_oxygen_saturation BOOLEAN DEFAULT FALSE,
  can_view_temperature BOOLEAN DEFAULT FALSE,
  can_view_activity BOOLEAN DEFAULT FALSE,
  
  -- Права на алерты
  can_view_alerts BOOLEAN DEFAULT FALSE,
  can_view_critical_alerts BOOLEAN DEFAULT FALSE,
  can_view_warnings BOOLEAN DEFAULT FALSE,
  can_view_info_alerts BOOLEAN DEFAULT FALSE,
  can_manage_alerts BOOLEAN DEFAULT FALSE,
  
  -- Права на отчеты
  can_view_reports BOOLEAN DEFAULT FALSE,
  can_view_weekly_reports BOOLEAN DEFAULT FALSE,
  can_view_custom_reports BOOLEAN DEFAULT FALSE,
  can_export_reports BOOLEAN DEFAULT FALSE,
  
  -- Права на устройства
  can_view_devices BOOLEAN DEFAULT FALSE,
  can_manage_devices BOOLEAN DEFAULT FALSE,
  can_configure_devices BOOLEAN DEFAULT FALSE,
  
  -- Права на настройки
  can_modify_alert_thresholds BOOLEAN DEFAULT FALSE,
  can_manage_notifications BOOLEAN DEFAULT FALSE,
  can_view_financial_info BOOLEAN DEFAULT FALSE,
  
  -- Временные ограничения
  access_start_date TIMESTAMPTZ,
  access_end_date TIMESTAMPTZ,
  is_temporary BOOLEAN DEFAULT FALSE,
  
  -- Метаданные
  comment TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  
  UNIQUE(ward_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_ward ON ward_access_permissions(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_user ON ward_access_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_status ON ward_access_permissions(status);
CREATE INDEX IF NOT EXISTS idx_ward_access_permissions_dates ON ward_access_permissions(access_start_date, access_end_date);

-- Таблица для аудита действий пользователей
CREATE TABLE IF NOT EXISTS ward_access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL, -- 'view_telemetry', 'view_report', 'export_data', 'modify_settings', etc.
  action_details JSONB,
  resource_type VARCHAR(50), -- 'telemetry', 'report', 'alert', 'device', 'settings'
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ward_access_audit_ward ON ward_access_audit_log(ward_id);
CREATE INDEX IF NOT EXISTS idx_ward_access_audit_user ON ward_access_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ward_access_audit_type ON ward_access_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_ward_access_audit_created ON ward_access_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ward_access_audit_severity ON ward_access_audit_log(severity);

-- DOWN
DROP INDEX IF EXISTS idx_ward_access_audit_severity;
DROP INDEX IF EXISTS idx_ward_access_audit_created;
DROP INDEX IF EXISTS idx_ward_access_audit_type;
DROP INDEX IF EXISTS idx_ward_access_audit_user;
DROP INDEX IF EXISTS idx_ward_access_audit_ward;
DROP TABLE IF EXISTS ward_access_audit_log;

DROP INDEX IF EXISTS idx_ward_access_permissions_dates;
DROP INDEX IF EXISTS idx_ward_access_permissions_status;
DROP INDEX IF EXISTS idx_ward_access_permissions_user;
DROP INDEX IF EXISTS idx_ward_access_permissions_ward;
DROP TABLE IF EXISTS ward_access_permissions;

