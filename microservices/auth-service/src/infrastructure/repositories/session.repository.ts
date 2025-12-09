import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  deviceInfo?: Record<string, any>;
  expiresAt: Date;
  createdAt: Date;
}

@Injectable()
export class SessionRepository {
  async initialize() {
    const db = getDatabaseConnection();
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        device_info JSONB,
        ip_address INET,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions(refresh_token)
    `);
  }

  async create(data: {
    userId: string;
    accessToken: string;
    refreshToken: string;
    deviceInfo?: Record<string, any>;
  }): Promise<Session> {
    const db = getDatabaseConnection();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

    const result = await db.query(
      `INSERT INTO sessions (user_id, access_token, refresh_token, device_info, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.userId, data.accessToken, data.refreshToken, JSON.stringify(data.deviceInfo || {}), expiresAt],
    );
    return this.mapRowToSession(result.rows[0]);
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refreshToken],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToSession(result.rows[0]);
  }

  async updateTokens(sessionId: string, accessToken: string, refreshToken: string): Promise<void> {
    const db = getDatabaseConnection();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await db.query(
      'UPDATE sessions SET access_token = $1, refresh_token = $2, expires_at = $3 WHERE id = $4',
      [accessToken, refreshToken, expiresAt, sessionId],
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
  }

  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      deviceInfo: row.device_info,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }
}

