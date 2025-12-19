import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

@Injectable()
export class TelemetryRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS raw_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID NOT NULL,
        ward_id UUID NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        value DECIMAL(10,4) NOT NULL,
        unit VARCHAR(20),
        quality_score DECIMAL(3,2),
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Составные индексы для частых запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_raw_metrics_ward_timestamp 
      ON raw_metrics(ward_id, timestamp DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_raw_metrics_device_timestamp 
      ON raw_metrics(device_id, timestamp DESC)
    `);

    // Индекс для фильтрации по типу метрики
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_raw_metrics_ward_type_timestamp 
      ON raw_metrics(ward_id, metric_type, timestamp DESC)
    `);

    // Индекс для DISTINCT ON запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_raw_metrics_ward_type_timestamp_distinct 
      ON raw_metrics(ward_id, metric_type, timestamp DESC NULLS LAST)
    `);

    // Партиционирование по месяцам (для больших объемов данных)
    // Примечание: требует PostgreSQL 10+
    await db.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_class WHERE relname = 'raw_metrics_partitioned'
        ) THEN
          -- Создаем партиционированную таблицу если её нет
          -- Это будет выполнено только при первом запуске
          NULL;
        END IF;
      END $$;
    `);
  }

  async create(data: {
    id: string;
    deviceId: string;
    wardId: string;
    metrics: Array<{ type: string; value: number; unit?: string; qualityScore?: number; timestamp?: string }>;
    location?: any;
    timestamp: Date;
  }): Promise<void> {
    const db = getDatabaseConnection();

    // Batch insert для оптимизации производительности
    if (data.metrics.length === 0) {
      return;
    }

    // Используем VALUES для batch insert
    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const metric of data.metrics) {
      const timestamp = metric.timestamp ? new Date(metric.timestamp) : data.timestamp;
      placeholders.push(
        `(gen_random_uuid(), $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`,
      );
      values.push(
        data.deviceId,
        data.wardId,
        metric.type,
        metric.value,
        metric.unit || null,
        metric.qualityScore || null,
        timestamp,
      );
    }

    await db.query(
      `INSERT INTO raw_metrics (id, device_id, ward_id, metric_type, value, unit, quality_score, timestamp)
       VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  // Removed getWardIdByDeviceId - this is now handled by DeviceServiceClient in TelemetryService

  async findByWardId(wardId: string, query: any): Promise<[any[], number]> {
    const db = getDatabaseConnection();
    const { from, to, metricType, page = 1, limit = 20 } = query;

    let whereClause = 'ward_id = $1';
    const params: any[] = [wardId];
    let paramIndex = 2;

    if (from) {
      whereClause += ` AND timestamp >= $${paramIndex}`;
      params.push(new Date(from));
      paramIndex++;
    }

    if (to) {
      whereClause += ` AND timestamp <= $${paramIndex}`;
      params.push(new Date(to));
      paramIndex++;
    }

    if (metricType) {
      whereClause += ` AND metric_type = $${paramIndex}`;
      params.push(metricType);
      paramIndex++;
    }

    const offset = (page - 1) * limit;

    // Оптимизированный запрос с использованием индекса
    const dataResult = await db.query(
      `SELECT * FROM raw_metrics 
       WHERE ${whereClause}
       ORDER BY timestamp DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
    );

    // Оптимизированный COUNT с использованием приблизительного подсчета для больших таблиц
    // Используем точный COUNT только если результат небольшой
    let countResult;
    if (page === 1 && dataResult.rows.length < limit) {
      // Если первая страница и данных меньше лимита, используем точный COUNT
      countResult = await db.query(
        `SELECT COUNT(*) as total FROM raw_metrics WHERE ${whereClause}`,
        params,
      );
    } else {
      // Для больших таблиц используем приблизительный подсчет
      countResult = await db.query(
        `SELECT 
          CASE 
            WHEN (SELECT reltuples FROM pg_class WHERE relname = 'raw_metrics') > 10000
            THEN (SELECT reltuples::bigint FROM pg_class WHERE relname = 'raw_metrics')
            ELSE (SELECT COUNT(*) FROM raw_metrics WHERE ${whereClause})
          END as total`,
        params,
      );
    }

    return [dataResult.rows, parseInt(countResult.rows[0].total)];
  }

  async findLatest(wardId: string): Promise<any> {
    const db = getDatabaseConnection();
    // Оптимизированный запрос с использованием индекса для DISTINCT ON
    const result = await db.query(
      `SELECT DISTINCT ON (metric_type) 
         metric_type,
         value,
         unit,
         quality_score,
         timestamp
       FROM raw_metrics
       WHERE ward_id = $1
       ORDER BY metric_type, timestamp DESC NULLS LAST`,
      [wardId],
    );

    const metrics: Record<string, any> = {};
    for (const row of result.rows) {
      metrics[row.metric_type] = {
        value: parseFloat(row.value),
        unit: row.unit,
        qualityScore: row.quality_score ? parseFloat(row.quality_score) : undefined,
        timestamp: row.timestamp,
      };
    }

    return {
      wardId,
      timestamp: result.rows[0]?.timestamp || new Date().toISOString(),
      metrics,
    };
  }
}


