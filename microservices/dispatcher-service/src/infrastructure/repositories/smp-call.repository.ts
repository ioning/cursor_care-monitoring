import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface SMPCall {
  id: string;
  callId: string;
  smpProviderId: string;
  serviceType: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  calledAt: Date;
  completedAt?: Date;
  notes?: string;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SMPCostSummary {
  providerId: string;
  providerName: string;
  totalCalls: number;
  totalCost: number;
  currency: string;
  period: {
    from: Date;
    to: Date;
  };
  byServiceType: Record<
    string,
    {
      count: number;
      cost: number;
    }
  >;
}

@Injectable()
export class SMPCallRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS smp_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        call_id UUID NOT NULL REFERENCES emergency_calls(id) ON DELETE CASCADE,
        smp_provider_id UUID NOT NULL REFERENCES smp_providers(id),
        service_type VARCHAR(100) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1.0,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'RUB',
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
        called_at TIMESTAMPTZ DEFAULT NOW(),
        completed_at TIMESTAMPTZ,
        notes TEXT,
        organization_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_calls_call_id ON smp_calls(call_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_id ON smp_calls(smp_provider_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_calls_status ON smp_calls(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_calls_called_at ON smp_calls(called_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_calls_organization ON smp_calls(organization_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_calls_service_type ON smp_calls(service_type)`);
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_status_date
      ON smp_calls(smp_provider_id, status, called_at DESC)
    `);
  }

  async create(smpCall: Omit<SMPCall, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMPCall> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO smp_calls (
        call_id, smp_provider_id, service_type, quantity, unit_price, total_price,
        currency, status, called_at, completed_at, notes, organization_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        smpCall.callId,
        smpCall.smpProviderId,
        smpCall.serviceType,
        smpCall.quantity,
        smpCall.unitPrice,
        smpCall.totalPrice,
        smpCall.currency,
        smpCall.status,
        smpCall.calledAt,
        smpCall.completedAt || null,
        smpCall.notes || null,
        smpCall.organizationId || null,
      ],
    );
    return this.mapRowToCall(result.rows[0]);
  }

  async findById(id: string): Promise<SMPCall | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM smp_calls WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRowToCall(result.rows[0]) : null;
  }

  async find(filters: {
    providerId?: string;
    callId?: string;
    from?: Date;
    to?: Date;
    status?: string;
    organizationId?: string;
  }): Promise<SMPCall[]> {
    const db = getDatabaseConnection();
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filters.providerId) {
      conditions.push(`smp_provider_id = $${i++}`);
      params.push(filters.providerId);
    }
    if (filters.callId) {
      conditions.push(`call_id = $${i++}`);
      params.push(filters.callId);
    }
    if (filters.from) {
      conditions.push(`called_at >= $${i++}`);
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push(`called_at <= $${i++}`);
      params.push(filters.to);
    }
    if (filters.status) {
      conditions.push(`status = $${i++}`);
      params.push(filters.status);
    }
    if (filters.organizationId) {
      conditions.push(`organization_id = $${i++}`);
      params.push(filters.organizationId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(`SELECT * FROM smp_calls ${where} ORDER BY called_at DESC`, params);
    return result.rows.map((row: any) => this.mapRowToCall(row));
  }

  async updateStatus(id: string, status: string, completedAt?: Date): Promise<SMPCall> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `UPDATE smp_calls
       SET status = $1,
           completed_at = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, completedAt || null, id],
    );
    if (!result.rows[0]) {
      throw new Error(`SMPCall ${id} not found`);
    }
    return this.mapRowToCall(result.rows[0]);
  }

  async getCostSummary(filters: {
    from?: Date;
    to?: Date;
    providerId?: string;
    organizationId?: string;
  }): Promise<SMPCostSummary[]> {
    const db = getDatabaseConnection();
    const conditions: string[] = [];
    const params: any[] = [];
    let i = 1;

    if (filters.from) {
      conditions.push(`sc.called_at >= $${i++}`);
      params.push(filters.from);
    }
    if (filters.to) {
      conditions.push(`sc.called_at <= $${i++}`);
      params.push(filters.to);
    }
    if (filters.providerId) {
      conditions.push(`sc.smp_provider_id = $${i++}`);
      params.push(filters.providerId);
    }
    if (filters.organizationId) {
      conditions.push(`sc.organization_id = $${i++}`);
      params.push(filters.organizationId);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Aggregate per provider/service_type
    const result = await db.query(
      `
      SELECT
        p.id as provider_id,
        p.name as provider_name,
        sc.currency as currency,
        sc.service_type as service_type,
        COUNT(*) as call_count,
        COALESCE(SUM(sc.total_price), 0) as total_cost,
        MIN(sc.called_at) as period_from,
        MAX(sc.called_at) as period_to
      FROM smp_calls sc
      JOIN smp_providers p ON p.id = sc.smp_provider_id
      ${where}
      GROUP BY p.id, p.name, sc.currency, sc.service_type
      ORDER BY p.name ASC, sc.service_type ASC
      `,
      params,
    );

    const byProvider = new Map<string, SMPCostSummary>();

    for (const row of result.rows as any[]) {
      const providerId = row.provider_id;
      const existing = byProvider.get(providerId);
      const periodFrom = new Date(row.period_from);
      const periodTo = new Date(row.period_to);
      const count = parseInt(row.call_count, 10);
      const cost = parseFloat(row.total_cost);

      if (!existing) {
        byProvider.set(providerId, {
          providerId,
          providerName: row.provider_name,
          totalCalls: count,
          totalCost: cost,
          currency: row.currency,
          period: { from: periodFrom, to: periodTo },
          byServiceType: {
            [row.service_type]: { count, cost },
          },
        });
        continue;
      }

      existing.totalCalls += count;
      existing.totalCost += cost;
      existing.period.from = existing.period.from < periodFrom ? existing.period.from : periodFrom;
      existing.period.to = existing.period.to > periodTo ? existing.period.to : periodTo;
      existing.byServiceType[row.service_type] = { count, cost };
    }

    return Array.from(byProvider.values());
  }

  private mapRowToCall(row: any): SMPCall {
    return {
      id: row.id,
      callId: row.call_id,
      smpProviderId: row.smp_provider_id,
      serviceType: row.service_type,
      quantity: parseFloat(row.quantity),
      unitPrice: parseFloat(row.unit_price),
      totalPrice: parseFloat(row.total_price),
      currency: row.currency,
      status: row.status,
      calledAt: new Date(row.called_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      notes: row.notes ?? undefined,
      organizationId: row.organization_id ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}


