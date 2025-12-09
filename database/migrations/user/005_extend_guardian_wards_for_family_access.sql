-- UP
-- Расширение таблицы guardian_wards для поддержки семейного доступа
ALTER TABLE guardian_wards
  ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS relationship_type VARCHAR(50) DEFAULT 'ward' CHECK (relationship_type IN (
    'ward', 'spouse', 'child', 'parent', 'sibling', 'relative', 'friend', 'caregiver', 'doctor', 'other'
  )),
  ADD COLUMN IF NOT EXISTS access_level VARCHAR(50) DEFAULT 'full' CHECK (access_level IN ('full', 'limited', 'view_only')),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duty_schedule JSONB DEFAULT '{}', -- Расписание дежурств
  ADD COLUMN IF NOT EXISTS can_manage_other_guardians BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS temporary_primary_guardian BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS temporary_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS temporary_period_end TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended'));

-- Создание индексов для новых полей
CREATE INDEX IF NOT EXISTS idx_guardian_wards_primary ON guardian_wards(ward_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_guardian_wards_relationship ON guardian_wards(relationship_type);
CREATE INDEX IF NOT EXISTS idx_guardian_wards_status ON guardian_wards(status);
CREATE INDEX IF NOT EXISTS idx_guardian_wards_temporary ON guardian_wards(temporary_period_start, temporary_period_end) WHERE temporary_primary_guardian = TRUE;

-- Таблица для семейного чата/координации
CREATE TABLE IF NOT EXISTS family_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  message_type VARCHAR(50) DEFAULT 'message' CHECK (message_type IN ('message', 'system_alert', 'coordination', 'status_update')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Дополнительные данные (алерт, статус и т.д.)
  is_read BOOLEAN DEFAULT FALSE,
  read_by JSONB DEFAULT '[]', -- Массив ID пользователей, которые прочитали
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_family_chat_ward ON family_chat_messages(ward_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_chat_sender ON family_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_family_chat_type ON family_chat_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_family_chat_unread ON family_chat_messages(ward_id, is_read) WHERE is_read = FALSE;

-- Таблица для отслеживания обработки алертов опекунами
CREATE TABLE IF NOT EXISTS alert_guardian_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL, -- Ссылка на алерт (может быть в другой БД)
  guardian_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
  response_type VARCHAR(50) NOT NULL CHECK (response_type IN ('acknowledged', 'handling', 'resolved', 'false_alarm', 'emergency_call')),
  response_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alert_id, guardian_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_guardian_responses_alert ON alert_guardian_responses(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_guardian_responses_guardian ON alert_guardian_responses(guardian_id);
CREATE INDEX IF NOT EXISTS idx_alert_guardian_responses_ward ON alert_guardian_responses(ward_id);

-- DOWN
DROP INDEX IF EXISTS idx_alert_guardian_responses_ward;
DROP INDEX IF EXISTS idx_alert_guardian_responses_guardian;
DROP INDEX IF EXISTS idx_alert_guardian_responses_alert;
DROP TABLE IF EXISTS alert_guardian_responses;

DROP INDEX IF EXISTS idx_family_chat_unread;
DROP INDEX IF EXISTS idx_family_chat_type;
DROP INDEX IF EXISTS idx_family_chat_sender;
DROP INDEX IF EXISTS idx_family_chat_ward;
DROP TABLE IF EXISTS family_chat_messages;

DROP INDEX IF EXISTS idx_guardian_wards_temporary;
DROP INDEX IF EXISTS idx_guardian_wards_status;
DROP INDEX IF EXISTS idx_guardian_wards_relationship;
DROP INDEX IF EXISTS idx_guardian_wards_primary;

ALTER TABLE guardian_wards
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS temporary_period_end,
  DROP COLUMN IF EXISTS temporary_period_start,
  DROP COLUMN IF EXISTS temporary_primary_guardian,
  DROP COLUMN IF EXISTS can_manage_other_guardians,
  DROP COLUMN IF EXISTS duty_schedule,
  DROP COLUMN IF EXISTS notification_preferences,
  DROP COLUMN IF EXISTS access_level,
  DROP COLUMN IF EXISTS relationship_type,
  DROP COLUMN IF EXISTS is_primary;


