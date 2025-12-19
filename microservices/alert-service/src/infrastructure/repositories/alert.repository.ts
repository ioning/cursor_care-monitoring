import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';
import { AlertStatus, AlertSeverity } from '../../../../../shared/types/common.types';

export interface Alert {
  id: string;
  wardId: string;
  alertType: string;
  title: string;
  description?: string;
  severity: AlertSeverity;
  status: AlertStatus;
  aiConfidence?: number;
  riskScore?: number;
  priority?: number;
  dataSnapshot?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

@Injectable()
export class AlertRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'false_positive')),
        ai_confidence DECIMAL(3,2),
        risk_score DECIMAL(3,2),
        priority INTEGER,
        data_snapshot JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        acknowledged_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ
      )
    `);

    // Базовые индексы
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_ward_id ON alerts(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC)
    `);

    // Составные индексы для частых запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_ward_status 
      ON alerts(ward_id, status, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_ward_severity 
      ON alerts(ward_id, severity, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_status_severity_created 
      ON alerts(status, severity, created_at DESC)
    `);

    // GIN индекс для JSONB полей (для поиска внутри data_snapshot)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_data_snapshot_gin 
      ON alerts USING GIN (data_snapshot)
    `);

    // Частичный индекс для активных алертов (наиболее частый запрос)
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_active_ward 
      ON alerts(ward_id, created_at DESC) 
      WHERE status = 'active'
    `);
  }

  async create(data: {
    id: string;
    wardId: string;
    alertType: string;
    title: string;
    description?: string;
    severity: AlertSeverity;
    status: AlertStatus;
    aiConfidence?: number;
    riskScore?: number;
    priority?: number;
    dataSnapshot?: Record<string, any>;
  }): Promise<Alert> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO alerts (id, ward_id, alert_type, title, description, severity, status, ai_confidence, risk_score, priority, data_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.id,
        data.wardId,
        data.alertType,
        data.title,
        data.description || null,
        data.severity,
        data.status,
        data.aiConfidence || null,
        data.riskScore || null,
        data.priority || null,
        data.dataSnapshot ? JSON.stringify(data.dataSnapshot) : null,
      ],
    );
    return this.mapRowToAlert(result.rows[0]);
  }

  async findById(id: string): Promise<Alert | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM alerts WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToAlert(result.rows[0]);
  }

  async findByFilters(
    userId: string,
    filters: { wardId?: string; status?: string; severity?: string },
    pagination: { page: number; limit: number },
  ): Promise<[Alert[], number]> {
    const db = getDatabaseConnection();
    const { wardId, status, severity } = filters;
    const { page, limit } = pagination;

    // Build WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // For MVP, simplified - in production would join with guardian_wards
    if (wardId) {
      conditions.push(`ward_id = $${paramIndex++}`);
      params.push(wardId);
    }

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (severity) {
      conditions.push(`severity = $${paramIndex++}`);
      params.push(severity);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    // Оптимизированный запрос - выбираем только нужные поля
    const dataResult = await db.query(
      `SELECT 
         id, ward_id, alert_type, title, description, severity, status,
         ai_confidence, risk_score, priority, data_snapshot,
         created_at, updated_at, acknowledged_at, resolved_at
       FROM alerts 
       ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
    );

    // Оптимизированный COUNT - используем приблизительный подсчет для больших таблиц
    let countResult;
    if (page === 1 && dataResult.rows.length < limit) {
      countResult = await db.query(
        `SELECT COUNT(*) as total FROM alerts ${whereClause}`,
        params,
      );
    } else {
      // Для больших таблиц используем приблизительный подсчет
      countResult = await db.query(
        `SELECT 
          CASE 
            WHEN (SELECT reltuples FROM pg_class WHERE relname = 'alerts') > 10000
            THEN (SELECT reltuples::bigint FROM pg_class WHERE relname = 'alerts')
            ELSE (SELECT COUNT(*) FROM alerts ${whereClause})
          END as total`,
        params,
      );
    }

    return [
      dataResult.rows.map((row) => this.mapRowToAlert(row)),
      parseInt(countResult.rows[0].total),
    ];
  }

  async updateStatus(id: string, status: AlertStatus): Promise<Alert> {
    const db = getDatabaseConnection();
    const updates: string[] = [`status = $1`, `updated_at = NOW()`];
    const values: any[] = [status];

    if (status === 'acknowledged') {
      updates.push(`acknowledged_at = NOW()`);
    } else if (status === 'resolved') {
      updates.push(`resolved_at = NOW()`);
    }

    values.push(id);

    await db.query(
      `UPDATE alerts SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values,
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Alert not found after update');
    }
    return updated;
  }

  private mapRowToAlert(row: any): Alert {
    return {
      id: row.id,
      wardId: row.ward_id,
      alertType: row.alert_type,
      title: row.title,
      description: row.description,
      severity: row.severity,
      status: row.status,
      aiConfidence: row.ai_confidence ? parseFloat(row.ai_confidence) : undefined,
      riskScore: row.risk_score ? parseFloat(row.risk_score) : undefined,
      priority: row.priority,
      dataSnapshot: row.data_snapshot,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      acknowledgedAt: row.acknowledged_at,
      resolvedAt: row.resolved_at,
    };
  }
}


