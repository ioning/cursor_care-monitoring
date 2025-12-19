import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Invoice {
  id: string;
  userId: string;
  paymentId?: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  paidAt?: Date;
}

@Injectable()
export class InvoiceRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        payment_id UUID,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'RUB',
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'cancelled')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        paid_at TIMESTAMPTZ
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)
    `);
  }

  async create(data: {
    id: string;
    userId: string;
    paymentId?: string;
    amount: number;
    currency: string;
    status: string;
  }): Promise<Invoice> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO invoices (id, user_id, payment_id, amount, currency, status, paid_at)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'paid' THEN NOW() ELSE NULL END)
       RETURNING *`,
      [data.id, data.userId, data.paymentId || null, data.amount, data.currency, data.status],
    );
    return this.mapRowToInvoice(result.rows[0]);
  }

  async findByUserId(
    userId: string,
    pagination: { page: number; limit: number },
  ): Promise<[Invoice[], number]> {
    const db = getDatabaseConnection();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
      'SELECT * FROM invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset],
    );

    const countResult = await db.query(
      'SELECT COUNT(*) as total FROM invoices WHERE user_id = $1',
      [userId],
    );

    return [
      dataResult.rows.map((row: any) => this.mapRowToInvoice(row)),
      parseInt(countResult.rows[0].total),
    ];
  }

  async findByPaymentId(paymentId: string): Promise<Invoice | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM invoices WHERE payment_id = $1 LIMIT 1', [paymentId]);
    return result.rows[0] ? this.mapRowToInvoice(result.rows[0]) : null;
  }

  private mapRowToInvoice(row: any): Invoice {
    return {
      id: row.id,
      userId: row.user_id,
      paymentId: row.payment_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
      paidAt: row.paid_at,
    };
  }
}

