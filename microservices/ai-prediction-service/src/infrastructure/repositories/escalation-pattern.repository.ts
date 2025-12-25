import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface EscalationPattern {
  id: string;
  wardId: string;
  initialSeverity: string; // 'low' | 'medium' | 'high'
  finalSeverity: string; // 'critical'
  initialAlertId: string;
  finalAlertId: string;
  escalationTimeMs: number; // Время в миллисекундах от initial до final
  alertType: string;
  metricsSnapshot?: Record<string, any>;
  createdAt: Date;
}

export interface EscalationStats {
  averageTimeToCritical: number; // Среднее время до критической ситуации в миллисекундах
  medianTimeToCritical: number;
  minTimeToCritical: number;
  maxTimeToCritical: number;
  escalationCount: number;
  byAlertType: Record<string, {
    averageTime: number;
    count: number;
  }>;
}

@Injectable()
export class EscalationPatternRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS escalation_patterns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        initial_severity VARCHAR(20) NOT NULL CHECK (initial_severity IN ('low', 'medium', 'high')),
        final_severity VARCHAR(20) NOT NULL CHECK (final_severity = 'critical'),
        initial_alert_id UUID NOT NULL,
        final_alert_id UUID NOT NULL,
        escalation_time_ms BIGINT NOT NULL,
        alert_type VARCHAR(50),
        metrics_snapshot JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Индексы для быстрого поиска
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_escalation_ward_id 
      ON escalation_patterns(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_escalation_initial_severity 
      ON escalation_patterns(initial_severity)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_escalation_alert_type 
      ON escalation_patterns(alert_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_escalation_ward_type 
      ON escalation_patterns(ward_id, alert_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_escalation_created_at 
      ON escalation_patterns(created_at DESC)
    `);
  }

  async save(pattern: {
    wardId: string;
    initialSeverity: string;
    finalSeverity: string;
    initialAlertId: string;
    finalAlertId: string;
    escalationTimeMs: number;
    alertType?: string;
    metricsSnapshot?: Record<string, any>;
  }): Promise<string> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO escalation_patterns (
        ward_id, initial_severity, final_severity, initial_alert_id, 
        final_alert_id, escalation_time_ms, alert_type, metrics_snapshot
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id`,
      [
        pattern.wardId,
        pattern.initialSeverity,
        pattern.finalSeverity,
        pattern.initialAlertId,
        pattern.finalAlertId,
        pattern.escalationTimeMs,
        pattern.alertType || null,
        pattern.metricsSnapshot ? JSON.stringify(pattern.metricsSnapshot) : null,
      ],
    );
    return result.rows[0].id;
  }

  async getStats(
    wardId: string,
    options?: {
      alertType?: string;
      initialSeverity?: string;
      days?: number;
    },
  ): Promise<EscalationStats> {
    const db = getDatabaseConnection();
    const days = options?.days || 90;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const conditions: string[] = ['ward_id = $1', 'created_at >= $2'];
    const params: any[] = [wardId, fromDate];
    let paramIndex = 3;

    if (options?.alertType) {
      conditions.push(`alert_type = $${paramIndex}`);
      params.push(options.alertType);
      paramIndex++;
    }

    if (options?.initialSeverity) {
      conditions.push(`initial_severity = $${paramIndex}`);
      params.push(options.initialSeverity);
      paramIndex++;
    }

    // Получаем статистику по времени эскалации
    const statsQuery = `
      SELECT 
        COUNT(*) as count,
        AVG(escalation_time_ms) as avg_time,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY escalation_time_ms) as median_time,
        MIN(escalation_time_ms) as min_time,
        MAX(escalation_time_ms) as max_time
      FROM escalation_patterns
      WHERE ${conditions.join(' AND ')}
    `;

    const statsResult = await db.query(statsQuery, params);
    const stats = statsResult.rows[0];

    // Получаем статистику по типам алертов
    const typeStatsQuery = `
      SELECT 
        alert_type,
        COUNT(*) as count,
        AVG(escalation_time_ms) as avg_time
      FROM escalation_patterns
      WHERE ${conditions.join(' AND ')} AND alert_type IS NOT NULL
      GROUP BY alert_type
    `;

    const typeStatsResult = await db.query(typeStatsQuery, params);
    const byAlertType: Record<string, { averageTime: number; count: number }> = {};

    typeStatsResult.rows.forEach((row: any) => {
      byAlertType[row.alert_type] = {
        averageTime: Math.round(parseFloat(row.avg_time) || 0),
        count: parseInt(row.count, 10),
      };
    });

    return {
      averageTimeToCritical: Math.round(parseFloat(stats.avg_time) || 0),
      medianTimeToCritical: Math.round(parseFloat(stats.median_time) || 0),
      minTimeToCritical: parseInt(stats.min_time, 10) || 0,
      maxTimeToCritical: parseInt(stats.max_time, 10) || 0,
      escalationCount: parseInt(stats.count, 10) || 0,
      byAlertType,
    };
  }

  async findRecentEscalations(
    wardId: string,
    limit: number = 10,
  ): Promise<EscalationPattern[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT 
        id,
        ward_id as "wardId",
        initial_severity as "initialSeverity",
        final_severity as "finalSeverity",
        initial_alert_id as "initialAlertId",
        final_alert_id as "finalAlertId",
        escalation_time_ms as "escalationTimeMs",
        alert_type as "alertType",
        metrics_snapshot as "metricsSnapshot",
        created_at as "createdAt"
      FROM escalation_patterns
      WHERE ward_id = $1
      ORDER BY created_at DESC
      LIMIT $2`,
      [wardId, limit],
    );

    return result.rows.map((row: any) => ({
      ...row,
      metricsSnapshot:
        typeof row.metricsSnapshot === 'string'
          ? JSON.parse(row.metricsSnapshot)
          : row.metricsSnapshot,
    }));
  }

  async getAverageTimeToCritical(
    wardId: string,
    initialSeverity: string,
    alertType?: string,
  ): Promise<number | null> {
    const db = getDatabaseConnection();
    const conditions: string[] = [
      'ward_id = $1',
      'initial_severity = $2',
      'final_severity = $3',
    ];
    const params: any[] = [wardId, initialSeverity, 'critical'];
    let paramIndex = 4;

    if (alertType) {
      conditions.push(`alert_type = $${paramIndex}`);
      params.push(alertType);
      paramIndex++;
    }

    const result = await db.query(
      `SELECT AVG(escalation_time_ms) as avg_time
       FROM escalation_patterns
       WHERE ${conditions.join(' AND ')}`,
      params,
    );

    const avgTime = result.rows[0]?.avg_time;
    return avgTime ? Math.round(parseFloat(avgTime)) : null;
  }
}

