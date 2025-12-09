import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface ReportFile {
  id: string;
  reportId: string;
  fileFormat: 'pdf' | 'csv' | 'json' | 'xlsx' | 'hl7_fhir';
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  generatedAt: Date;
  expiresAt?: Date;
  downloadCount: number;
}

@Injectable()
export class ReportFileRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS report_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        report_id UUID NOT NULL,
        file_format VARCHAR(20) NOT NULL CHECK (file_format IN ('pdf', 'csv', 'json', 'xlsx', 'hl7_fhir')),
        file_path TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        generated_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        download_count INTEGER DEFAULT 0
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_files_report ON report_files(report_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_files_format ON report_files(file_format)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_report_files_expires ON report_files(expires_at) WHERE expires_at IS NOT NULL
    `);
  }

  async create(data: {
    reportId: string;
    fileFormat: 'pdf' | 'csv' | 'json' | 'xlsx' | 'hl7_fhir';
    filePath: string;
    fileSize?: number;
    mimeType?: string;
    expiresAt?: Date;
  }): Promise<ReportFile> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO report_files (report_id, file_format, file_path, file_size, mime_type, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.reportId,
        data.fileFormat,
        data.filePath,
        data.fileSize || null,
        data.mimeType || null,
        data.expiresAt || null,
      ],
    );
    return this.mapRowToFile(result.rows[0]);
  }

  async findByReportId(reportId: string): Promise<ReportFile[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_files
       WHERE report_id = $1
       ORDER BY generated_at DESC`,
      [reportId],
    );
    return result.rows.map(row => this.mapRowToFile(row));
  }

  async findByReportIdAndFormat(reportId: string, format: string): Promise<ReportFile | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM report_files
       WHERE report_id = $1 AND file_format = $2
       ORDER BY generated_at DESC
       LIMIT 1`,
      [reportId, format],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToFile(result.rows[0]);
  }

  async incrementDownloadCount(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      `UPDATE report_files 
       SET download_count = download_count + 1 
       WHERE id = $1`,
      [id],
    );
  }

  async deleteExpiredFiles(): Promise<number> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `DELETE FROM report_files 
       WHERE expires_at IS NOT NULL AND expires_at < NOW()
       RETURNING id`,
    );
    return result.rows.length;
  }

  private mapRowToFile(row: any): ReportFile {
    return {
      id: row.id,
      reportId: row.report_id,
      fileFormat: row.file_format,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      generatedAt: row.generated_at,
      expiresAt: row.expires_at,
      downloadCount: row.download_count,
    };
  }
}


