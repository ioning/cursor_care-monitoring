import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

@Injectable()
export class PaymentRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'RUB',
        method VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
        metadata JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)
    `);
  }

  async create(data: {
    id: string;
    userId: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    metadata?: Record<string, any>;
  }): Promise<Payment> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO payments (id, user_id, amount, currency, method, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.id,
        data.userId,
        data.amount,
        data.currency,
        data.method,
        data.status,
        data.metadata ? JSON.stringify(data.metadata) : null,
      ],
    );
    return this.mapRowToPayment(result.rows[0]);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const db = getDatabaseConnection();
    const updates: string[] = [`status = $1`, `updated_at = NOW()`];
    const values: any[] = [status];

    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
    }

    values.push(id);

    await db.query(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = $${values.length}`,
      values,
    );
  }

  private mapRowToPayment(row: any): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      method: row.method,
      status: row.status,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
    };
  }
}

