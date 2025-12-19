import { Injectable } from '@nestjs/common';
import { createDatabaseConnection, getDatabaseConnection } from '../../../../../shared/libs/database';

export interface EmailVerificationCode {
  id: string;
  email: string;
  code: string;
  expiresAt: Date;
  consumed: boolean;
  createdAt: Date;
  userId?: string;
}

@Injectable()
export class EmailVerificationRepository {
  async initialize() {
    const db = createDatabaseConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'auth_db',
      user: process.env.DB_USER || 'cms_user',
      password: process.env.DB_PASSWORD || 'cms_password',
    });

    // In local/dev we may run without migrations; ensure table + indexes exist.
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_verification_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        code VARCHAR(20) NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        consumed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        user_id UUID
      )
    `);

    await db.query(
      'CREATE INDEX IF NOT EXISTS idx_email_verification_email ON email_verification_codes(email)'
    );
    await db.query(
      'CREATE INDEX IF NOT EXISTS idx_email_verification_code ON email_verification_codes(email, code)'
    );
    await db.query(
      'CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_codes(expires_at)'
    );
  }

  async createCode(email: string, code: string, expiresAt: Date, userId?: string): Promise<EmailVerificationCode> {
    const db = getDatabaseConnection();
    
    // Invalidate previous codes for this email
    await db.query(
      'UPDATE email_verification_codes SET consumed = TRUE WHERE email = $1 AND consumed = FALSE',
      [email]
    );

    const result = await db.query(
      `INSERT INTO email_verification_codes (email, code, expires_at, user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [email, code, expiresAt, userId || null]
    );

    return this.mapRowToCode(result.rows[0]);
  }

  async findValidCode(email: string, code: string): Promise<EmailVerificationCode | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM email_verification_codes 
       WHERE email = $1 AND code = $2 AND consumed = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCode(result.rows[0]);
  }

  async markConsumed(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      'UPDATE email_verification_codes SET consumed = TRUE WHERE id = $1',
      [id]
    );
  }

  async invalidateAllCodes(email: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      'UPDATE email_verification_codes SET consumed = TRUE WHERE email = $1 AND consumed = FALSE',
      [email]
    );
  }

  private mapRowToCode(row: any): EmailVerificationCode {
    return {
      id: row.id,
      email: row.email,
      code: row.code,
      expiresAt: row.expires_at,
      consumed: row.consumed,
      createdAt: row.created_at,
      userId: row.user_id,
    };
  }
}

