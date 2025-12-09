-- UP
-- Таблица для шаблонов отчетов
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  ward_id UUID REFERENCES wards(id) ON DELETE CASCADE, -- NULL для глобальных шаблонов
  is_global BOOLEAN DEFAULT FALSE, -- Глобальный шаблон доступен всем
  is_public BOOLEAN DEFAULT FALSE, -- Публичный шаблон может использоваться другими
  
  -- Структура отчета
  structure JSONB NOT NULL, -- Структура разделов и метрик
  visualization_config JSONB DEFAULT '{}', -- Настройки визуализации (типы графиков, цвета и т.д.)
  metrics_config JSONB DEFAULT '[]', -- Список метрик для включения
  
  -- Настройки генерации
  default_period VARCHAR(50) DEFAULT '7d', -- По умолчанию: 7d, 30d, custom
  include_trends BOOLEAN DEFAULT TRUE,
  include_statistics BOOLEAN DEFAULT TRUE,
  include_ai_recommendations BOOLEAN DEFAULT TRUE,
  include_alerts_analysis BOOLEAN DEFAULT TRUE,
  
  -- Метаданные
  category VARCHAR(50), -- 'cardiology', 'general', 'custom', etc.
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON report_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_report_templates_ward ON report_templates(ward_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_global ON report_templates(is_global) WHERE is_global = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_templates_public ON report_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_report_templates_status ON report_templates(status);

-- Расширение таблицы reports для поддержки шаблонов
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES report_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS report_config JSONB DEFAULT '{}', -- Конфигурация отчета (период, метрики и т.д.)
  ADD COLUMN IF NOT EXISTS recipients JSONB DEFAULT '[]', -- Список получателей отчета
  ADD COLUMN IF NOT EXISTS export_formats TEXT[] DEFAULT ARRAY['pdf'], -- Доступные форматы экспорта
  ADD COLUMN IF NOT EXISTS scheduled_generation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS schedule_config JSONB, -- Конфигурация расписания (cron expression и т.д.)
  ADD COLUMN IF NOT EXISTS is_comparative BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS comparison_periods JSONB; -- Для сравнительных отчетов

CREATE INDEX IF NOT EXISTS idx_reports_template ON reports(template_id);
CREATE INDEX IF NOT EXISTS idx_reports_scheduled ON reports(scheduled_generation) WHERE scheduled_generation = TRUE;

-- Таблица для хранения сгенерированных файлов отчетов
CREATE TABLE IF NOT EXISTS report_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  file_format VARCHAR(20) NOT NULL CHECK (file_format IN ('pdf', 'csv', 'json', 'xlsx', 'hl7_fhir')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type VARCHAR(100),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Для автоматической очистки старых файлов
  download_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_report_files_report ON report_files(report_id);
CREATE INDEX IF NOT EXISTS idx_report_files_format ON report_files(file_format);
CREATE INDEX IF NOT EXISTS idx_report_files_expires ON report_files(expires_at) WHERE expires_at IS NOT NULL;

-- DOWN
DROP INDEX IF EXISTS idx_report_files_expires;
DROP INDEX IF EXISTS idx_report_files_format;
DROP INDEX IF EXISTS idx_report_files_report;
DROP TABLE IF EXISTS report_files;

DROP INDEX IF EXISTS idx_reports_scheduled;
DROP INDEX IF EXISTS idx_reports_template;
ALTER TABLE reports
  DROP COLUMN IF EXISTS comparison_periods,
  DROP COLUMN IF EXISTS is_comparative,
  DROP COLUMN IF EXISTS schedule_config,
  DROP COLUMN IF EXISTS scheduled_generation,
  DROP COLUMN IF EXISTS export_formats,
  DROP COLUMN IF EXISTS recipients,
  DROP COLUMN IF EXISTS report_config,
  DROP COLUMN IF EXISTS template_name,
  DROP COLUMN IF EXISTS template_id;

DROP INDEX IF EXISTS idx_report_templates_status;
DROP INDEX IF EXISTS idx_report_templates_category;
DROP INDEX IF EXISTS idx_report_templates_public;
DROP INDEX IF EXISTS idx_report_templates_global;
DROP INDEX IF EXISTS idx_report_templates_ward;
DROP INDEX IF EXISTS idx_report_templates_created_by;
DROP TABLE IF EXISTS report_templates;


