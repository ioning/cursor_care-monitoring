import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  wardId?: string;
  isGlobal: boolean;
  isPublic: boolean;
  structure: any;
  visualizationConfig: any;
  metricsConfig: any[];
  defaultPeriod: string;
  includeTrends: boolean;
  includeStatistics: boolean;
  includeAiRecommendations: boolean;
  includeAlertsAnalysis: boolean;
  category?: string;
  tags?: string[];
  usageCount: number;
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReportTemplateDto {
  name: string;
  description?: string;
  createdBy: string;
  wardId?: string;
  isGlobal?: boolean;
  isPublic?: boolean;
  structure: any;
  visualizationConfig?: any;
  metricsConfig?: any[];
  defaultPeriod?: string;
  includeTrends?: boolean;
  includeStatistics?: boolean;
  includeAiRecommendations?: boolean;
  includeAlertsAnalysis?: boolean;
  category?: string;
  tags?: string[];
}

@Injectable()
export class ReportTemplateRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS report_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by UUID NOT NULL,
        ward_id UUID,
        is_global BOOLEAN DEFAULT FALSE,
        is_public BOOLEAN DEFAULT FALSE,
        structure JSONB NOT NULL,
        visualization_config JSONB DEFAULT '{}',
        metrics_config JSONB DEFAULT '[]',
        default_period VARCHAR(50) DEFAULT '7d',
        include_trends BOOLEAN DEFAULT TRUE,
        include_statistics BOOLEAN DEFAULT TRUE,
        include_ai_recommendations BOOLEAN DEFAULT TRUE,
        include_alerts_analysis BOOLEAN DEFAULT TRUE,
        category VARCHAR(50),
        tags TEXT[],
        usage_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON report_templates(created_by)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_ward ON report_templates(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_global ON report_templates(is_global) WHERE is_global = TRUE
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_public ON report_templates(is_public) WHERE is_public = TRUE
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_templates_status ON report_templates(status)
    `);
  }

  async create(data: CreateReportTemplateDto): Promise<ReportTemplate> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO report_templates (
        name, description, created_by, ward_id, is_global, is_public,
        structure, visualization_config, metrics_config, default_period,
        include_trends, include_statistics, include_ai_recommendations,
        include_alerts_analysis, category, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        data.name,
        data.description || null,
        data.createdBy,
        data.wardId || null,
        data.isGlobal || false,
        data.isPublic || false,
        JSON.stringify(data.structure),
        JSON.stringify(data.visualizationConfig || {}),
        JSON.stringify(data.metricsConfig || []),
        data.defaultPeriod || '7d',
        data.includeTrends !== undefined ? data.includeTrends : true,
        data.includeStatistics !== undefined ? data.includeStatistics : true,
        data.includeAiRecommendations !== undefined ? data.includeAiRecommendations : true,
        data.includeAlertsAnalysis !== undefined ? data.includeAlertsAnalysis : true,
        data.category || null,
        data.tags || [],
      ],
    );
    return this.mapRowToTemplate(result.rows[0]);
  }

  async findById(id: string): Promise<ReportTemplate | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_templates WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToTemplate(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<ReportTemplate[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_templates
       WHERE created_by = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  async findGlobalTemplates(): Promise<ReportTemplate[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_templates
       WHERE is_global = TRUE AND status = 'active'
       ORDER BY usage_count DESC, created_at DESC`,
    );
    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  async findPublicTemplates(): Promise<ReportTemplate[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_templates
       WHERE is_public = TRUE AND status = 'active'
       ORDER BY usage_count DESC, created_at DESC`,
    );
    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  async findByWardId(wardId: string): Promise<ReportTemplate[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_templates
       WHERE (ward_id = $1 OR is_global = TRUE OR is_public = TRUE)
         AND status = 'active'
       ORDER BY created_at DESC`,
      [wardId],
    );
    return result.rows.map((row: any) => this.mapRowToTemplate(row));
  }

  async update(id: string, updates: Partial<ReportTemplate>): Promise<ReportTemplate> {
    const db = getDatabaseConnection();
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const key of Object.keys(updates) as Array<keyof ReportTemplate>) {
      if (key === 'id') continue;
      const value = updates[key];
      if (value === undefined) continue;

      const dbKey = String(key).replace(/([A-Z])/g, '_$1').toLowerCase();
      if (key === 'structure' || key === 'visualizationConfig' || key === 'metricsConfig') {
        fields.push(`${dbKey} = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(value));
      } else if (key === 'tags') {
        fields.push(`${dbKey} = $${paramIndex}::text[]`);
        values.push(value as any);
      } else {
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value as any);
      }
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE report_templates 
       SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values,
    );

    return this.mapRowToTemplate(result.rows[0]);
  }

  async incrementUsageCount(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `UPDATE report_templates 
       SET usage_count = usage_count + 1 
       WHERE id = $1`,
      [id],
    );
  }

  async delete(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `UPDATE report_templates 
       SET status = 'archived' 
       WHERE id = $1`,
      [id],
    );
  }

  private mapRowToTemplate(row: any): ReportTemplate {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdBy: row.created_by,
      wardId: row.ward_id,
      isGlobal: row.is_global,
      isPublic: row.is_public,
      structure: typeof row.structure === 'string' ? JSON.parse(row.structure) : row.structure,
      visualizationConfig: typeof row.visualization_config === 'string' ? JSON.parse(row.visualization_config) : row.visualization_config,
      metricsConfig: typeof row.metrics_config === 'string' ? JSON.parse(row.metrics_config) : row.metrics_config,
      defaultPeriod: row.default_period,
      includeTrends: row.include_trends,
      includeStatistics: row.include_statistics,
      includeAiRecommendations: row.include_ai_recommendations,
      includeAlertsAnalysis: row.include_alerts_analysis,
      category: row.category,
      tags: row.tags || [],
      usageCount: row.usage_count,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}


