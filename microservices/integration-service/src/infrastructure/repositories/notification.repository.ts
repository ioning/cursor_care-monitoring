import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  channel: string;
  status: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  sentAt?: Date;
}

@Injectable()
export class NotificationRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        type VARCHAR(50) NOT NULL,
        channel VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
        content TEXT NOT NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        sent_at TIMESTAMPTZ
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)
    `);
  }

  async create(data: {
    id: string;
    userId: string;
    type: string;
    channel: string;
    status: string;
    content: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO notifications (id, user_id, type, channel, status, content, metadata, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $5 = 'sent' THEN NOW() ELSE NULL END)
       RETURNING *`,
      [
        data.id,
        data.userId,
        data.type,
        data.channel,
        data.status,
        data.content,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );
    return this.mapRowToNotification(result.rows[0]);
  }

  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      channel: row.channel,
      status: row.status,
      content: row.content,
      metadata: row.metadata,
      createdAt: row.created_at,
      sentAt: row.sent_at,
    };
  }
}

