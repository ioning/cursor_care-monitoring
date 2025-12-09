import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface WardAccessAuditLog {
  id: string;
  wardId: string;
  userId: string;
  actionType: string;
  actionDetails?: any;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'info' | 'warning' | 'critical';
  createdAt: Date;
}

export interface CreateAuditLogDto {
  wardId: string;
  userId: string;
  actionType: string;
  actionDetails?: any;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity?: 'info' | 'warning' | 'critical';
}

@Injectable()
export class WardAccessAuditRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS ward_access_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        user_id UUID NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        action_details JSONB,
        resource_type VARCHAR(50),
        resource_id UUID,
        ip_address INET,
        user_agent TEXT,
        severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_audit_ward ON ward_access_audit_log(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_audit_user ON ward_access_audit_log(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_audit_type ON ward_access_audit_log(action_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_audit_created ON ward_access_audit_log(created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_ward_access_audit_severity ON ward_access_audit_log(severity)
    `);
  }

  async create(data: CreateAuditLogDto): Promise<WardAccessAuditLog> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO ward_access_audit_log (
        ward_id, user_id, action_type, action_details, resource_type, 
        resource_id, ip_address, user_agent, severity
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        data.wardId,
        data.userId,
        data.actionType,
        data.actionDetails ? JSON.stringify(data.actionDetails) : null,
        data.resourceType || null,
        data.resourceId || null,
        data.ipAddress || null,
        data.userAgent || null,
        data.severity || 'info',
      ],
    );
    return this.mapRowToAuditLog(result.rows[0]);
  }

  async findByWardId(
    wardId: string,
    filters?: {
      userId?: string;
      actionType?: string;
      severity?: string;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<WardAccessAuditLog[]> {
    const db = getDatabaseConnection();
    let query = `SELECT * FROM ward_access_audit_log WHERE ward_id = $1`;
    const values: any[] = [wardId];
    let paramIndex = 2;

    if (filters?.userId) {
      query += ` AND user_id = $${paramIndex}`;
      values.push(filters.userId);
      paramIndex++;
    }

    if (filters?.actionType) {
      query += ` AND action_type = $${paramIndex}`;
      values.push(filters.actionType);
      paramIndex++;
    }

    if (filters?.severity) {
      query += ` AND severity = $${paramIndex}`;
      values.push(filters.severity);
      paramIndex++;
    }

    if (filters?.from) {
      query += ` AND created_at >= $${paramIndex}`;
      values.push(filters.from);
      paramIndex++;
    }

    if (filters?.to) {
      query += ` AND created_at <= $${paramIndex}`;
      values.push(filters.to);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      query += ` LIMIT $${paramIndex}`;
      values.push(filters.limit);
      paramIndex++;
    }

    if (filters?.offset) {
      query += ` OFFSET $${paramIndex}`;
      values.push(filters.offset);
    }

    const result = await db.query(query, values);
    return result.rows.map(row => this.mapRowToAuditLog(row));
  }

  async detectSuspiciousActivity(wardId: string, userId: string, timeWindowMinutes: number = 60): Promise<boolean> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM ward_access_audit_log
       WHERE ward_id = $1 
         AND user_id = $2 
         AND action_type IN ('export_data', 'view_report')
         AND created_at > NOW() - INTERVAL '${timeWindowMinutes} minutes'
       HAVING COUNT(*) > 10`,
      [wardId, userId],
    );
    return result.rows.length > 0 && parseInt(result.rows[0].count) > 10;
  }

  private mapRowToAuditLog(row: any): WardAccessAuditLog {
    return {
      id: row.id,
      wardId: row.ward_id,
      userId: row.user_id,
      actionType: row.action_type,
      actionDetails: row.action_details ? JSON.parse(row.action_details) : null,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      severity: row.severity,
      createdAt: row.created_at,
    };
  }
}


