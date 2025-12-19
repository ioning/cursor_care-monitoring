import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface FamilyChatMessage {
  id: string;
  wardId: string;
  senderId: string;
  messageType: 'message' | 'system_alert' | 'coordination' | 'status_update';
  content: string;
  metadata?: any;
  isRead: boolean;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFamilyChatMessageDto {
  wardId: string;
  senderId: string;
  messageType?: 'message' | 'system_alert' | 'coordination' | 'status_update';
  content: string;
  metadata?: any;
}

@Injectable()
export class FamilyChatRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS family_chat_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        sender_id UUID NOT NULL,
        message_type VARCHAR(50) DEFAULT 'message' CHECK (message_type IN ('message', 'system_alert', 'coordination', 'status_update')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        is_read BOOLEAN DEFAULT FALSE,
        read_by JSONB DEFAULT '[]',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_family_chat_ward ON family_chat_messages(ward_id, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_family_chat_sender ON family_chat_messages(sender_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_family_chat_type ON family_chat_messages(message_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_family_chat_unread ON family_chat_messages(ward_id, is_read) WHERE is_read = FALSE
    `);
  }

  async create(data: CreateFamilyChatMessageDto): Promise<FamilyChatMessage> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO family_chat_messages (ward_id, sender_id, message_type, content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.wardId,
        data.senderId,
        data.messageType || 'message',
        data.content,
        data.metadata ? JSON.stringify(data.metadata) : '{}',
      ],
    );
    return this.mapRowToMessage(result.rows[0]);
  }

  async findByWardId(wardId: string, limit: number = 50, offset: number = 0): Promise<FamilyChatMessage[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT * FROM family_chat_messages
       WHERE ward_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [wardId, limit, offset],
    );
    return result.rows.map(row => this.mapRowToMessage(row));
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT read_by FROM family_chat_messages WHERE id = $1`,
      [messageId],
    );
    
    if (result.rows.length === 0) {
      return;
    }

    const readBy = result.rows[0].read_by || [];
    if (!readBy.includes(userId)) {
      readBy.push(userId);
    }

    await db.query(
      `UPDATE family_chat_messages
       SET read_by = $1, is_read = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(readBy), messageId],
    );
  }

  async getUnreadCount(wardId: string, userId: string): Promise<number> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT COUNT(*) as count
       FROM family_chat_messages
       WHERE ward_id = $1
         AND (is_read = FALSE OR NOT (read_by @> $2::jsonb))`,
      [wardId, JSON.stringify([userId])],
    );
    return parseInt(result.rows[0].count);
  }

  private mapRowToMessage(row: any): FamilyChatMessage {
    return {
      id: row.id,
      wardId: row.ward_id,
      senderId: row.sender_id,
      messageType: row.message_type,
      content: row.content,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {},
      isRead: row.is_read,
      readBy: row.read_by ? (typeof row.read_by === 'string' ? JSON.parse(row.read_by) : row.read_by) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}


