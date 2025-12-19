import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

@Injectable()
export class ReportRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        report_type VARCHAR(50) NOT NULL,
        filters JSONB,
        status VARCHAR(20) NOT NULL CHECK (status IN ('generating', 'completed', 'failed')),
        file_url TEXT,
        template_id UUID,
        template_name VARCHAR(255),
        report_config JSONB DEFAULT '{}',
        recipients JSONB DEFAULT '[]',
        export_formats TEXT[] DEFAULT ARRAY['pdf'],
        scheduled_generation BOOLEAN DEFAULT FALSE,
        schedule_config JSONB,
        is_comparative BOOLEAN DEFAULT FALSE,
        comparison_periods JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_template ON reports(template_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_reports_scheduled ON reports(scheduled_generation) WHERE scheduled_generation = TRUE
    `);
  }

  async create(data: {
    userId: string;
    reportType: string;
    filters?: any;
    status: string;
    templateId?: string;
    templateName?: string;
    reportConfig?: any;
    recipients?: string[];
    exportFormats?: string[];
    scheduledGeneration?: boolean;
    scheduleConfig?: any;
    isComparative?: boolean;
    comparisonPeriods?: any;
  }): Promise<string> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO reports (
        user_id, report_type, filters, status, template_id, template_name,
        report_config, recipients, export_formats, scheduled_generation,
        schedule_config, is_comparative, comparison_periods
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        data.userId,
        data.reportType,
        data.filters ? JSON.stringify(data.filters) : null,
        data.status,
        data.templateId || null,
        data.templateName || null,
        data.reportConfig ? JSON.stringify(data.reportConfig) : '{}',
        data.recipients ? JSON.stringify(data.recipients) : '[]',
        data.exportFormats || ['pdf'],
        data.scheduledGeneration || false,
        data.scheduleConfig ? JSON.stringify(data.scheduleConfig) : null,
        data.isComparative || false,
        data.comparisonPeriods ? JSON.stringify(data.comparisonPeriods) : null,
      ],
    );
    return result.rows[0].id;
  }

  async findById(id: string): Promise<any> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM reports WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToReport(result.rows[0]);
  }

  async findByUserId(userId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM reports
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
    return result.rows.map((row: any) => this.mapRowToReport(row));
  }

  async findScheduledReports(): Promise<any[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM reports
       WHERE scheduled_generation = TRUE AND status = 'generating'
       ORDER BY created_at ASC`,
    );
    return result.rows.map((row: any) => this.mapRowToReport(row));
  }

  private mapRowToReport(row: any): any {
    return {
      id: row.id,
      userId: row.user_id,
      reportType: row.report_type,
      filters: row.filters ? (typeof row.filters === 'string' ? JSON.parse(row.filters) : row.filters) : null,
      status: row.status,
      fileUrl: row.file_url,
      templateId: row.template_id,
      templateName: row.template_name,
      reportConfig: row.report_config ? (typeof row.report_config === 'string' ? JSON.parse(row.report_config) : row.report_config) : {},
      recipients: row.recipients ? (typeof row.recipients === 'string' ? JSON.parse(row.recipients) : row.recipients) : [],
      exportFormats: row.export_formats || ['pdf'],
      scheduledGeneration: row.scheduled_generation,
      scheduleConfig: row.schedule_config ? (typeof row.schedule_config === 'string' ? JSON.parse(row.schedule_config) : row.schedule_config) : null,
      isComparative: row.is_comparative,
      comparisonPeriods: row.comparison_periods ? (typeof row.comparison_periods === 'string' ? JSON.parse(row.comparison_periods) : row.comparison_periods) : null,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const db = getDatabaseConnection();
    const updates: string[] = [`status = $1`];
    const values: any[] = [status];

    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
    }

    values.push(id);

    await db.query(
      `UPDATE reports SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values,
    );
  }
}

