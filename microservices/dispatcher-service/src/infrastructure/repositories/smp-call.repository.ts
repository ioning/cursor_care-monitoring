import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

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
  byServiceType: Record<string, {
    count: number;
    cost: number;
  }>;
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
        service_type VARCHAR(100) NOT NULL REFERENCES service_prices(service_type),
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

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_call_id ON smp_calls(call_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_id ON smp_calls(smp_provider_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_status ON smp_calls(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_called_at ON smp_calls(called_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_organization ON smp_calls(organization_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_service_type ON smp_calls(service_type)
    `);

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCall(result.rows[0]);
  }

  async findByCallId(callId: string): Promise<SMPCall[]> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM smp_calls WHERE call_id = $1 ORDER BY called_at DESC', [callId]);
    return result.rows.map((row) => this.mapRowToCall(row));
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
    let paramIndex = 1;

    if (filters.providerId) {
      conditions.push(`smp_provider_id = $${paramIndex}`);
      params.push(filters.providerId);
      paramIndex++;
    }

    if (filters.callId) {
      conditions.push(`call_id = $${paramIndex}`);
      params.push(filters.callId);
      paramIndex++;
    }

    if (filters.from) {
      conditions.push(`called_at >= $${paramIndex}`);
      params.push(filters.from);
      paramIndex++;
    }

    if (filters.to) {
      conditions.push(`called_at <= $${paramIndex}`);
      params.push(filters.to);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      params.push(filters.organizationId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM smp_calls ${whereClause} ORDER BY called_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToCall(row));
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
    let paramIndex = 1;

    if (filters.from) {
      conditions.push(`sc.called_at >= $${paramIndex}`);
      params.push(filters.from);
      paramIndex++;
    }

    if (filters.to) {
      conditions.push(`sc.called_at <= $${paramIndex}`);
      params.push(filters.to);
      paramIndex++;
    }

    if (filters.providerId) {
      conditions.push(`sc.smp_provider_id = $${paramIndex}`);
      params.push(filters.providerId);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`sc.organization_id = $${paramIndex}`);
      params.push(filters.organizationId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get summary by provider
    const summaryQuery = `
      SELECT 
        sp.id as provider_id,
        sp.name as provider_name,
        COUNT(DISTINCT sc.id) as total_calls,
        COALESCE(SUM(sc.total_price), 0) as total_cost,
        COALESCE(MAX(sc.currency), 'RUB') as currency,
        MIN(sc.called_at) as period_from,
        MAX(sc.called_at) as period_to
      FROM smp_providers sp
      INNER JOIN smp_calls sc ON sc.smp_provider_id = sp.id
      ${whereClause}
      GROUP BY sp.id, sp.name
      HAVING COUNT(DISTINCT sc.id) > 0
      ORDER BY total_cost DESC
    `;

    const summaryResult = await db.query(summaryQuery, params);
    const summaries: SMPCostSummary[] = [];

    for (const row of summaryResult.rows) {
      // Get breakdown by service type for this provider
      const serviceTypeConditions: string[] = ['smp_provider_id = $1'];
      const serviceTypeParams: any[] = [row.provider_id];
      let stParamIndex = 2;

      if (filters.from) {
        serviceTypeConditions.push(`called_at >= $${stParamIndex}`);
        serviceTypeParams.push(filters.from);
        stParamIndex++;
      }

      if (filters.to) {
        serviceTypeConditions.push(`called_at <= $${stParamIndex}`);
        serviceTypeParams.push(filters.to);
        stParamIndex++;
      }

      if (filters.organizationId) {
        serviceTypeConditions.push(`organization_id = $${stParamIndex}`);
        serviceTypeParams.push(filters.organizationId);
      }

      const serviceTypeQuery = `
        SELECT 
          service_type,
          COUNT(*) as count,
          SUM(total_price) as cost
        FROM smp_calls
        WHERE ${serviceTypeConditions.join(' AND ')}
        GROUP BY service_type
      `;

      const serviceTypeResult = await db.query(serviceTypeQuery, serviceTypeParams);

      const byServiceType: Record<string, { count: number; cost: number }> = {};
      serviceTypeResult.rows.forEach((stRow) => {
        byServiceType[stRow.service_type] = {
          count: parseInt(stRow.count),
          cost: parseFloat(stRow.cost),
        };
      });

      summaries.push({
        providerId: row.provider_id,
        providerName: row.provider_name,
        totalCalls: parseInt(row.total_calls),
        totalCost: parseFloat(row.total_cost),
        currency: row.currency,
        period: {
          from: new Date(row.period_from),
          to: new Date(row.period_to),
        },
        byServiceType,
      });
    }

    return summaries;
  }

  async updateStatus(id: string, status: string, completedAt?: Date): Promise<SMPCall> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `UPDATE smp_calls 
       SET status = $1, completed_at = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, completedAt || null, id],
    );

    return this.mapRowToCall(result.rows[0]);
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
      notes: row.notes,
      organizationId: row.organization_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}





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
  byServiceType: Record<string, {
    count: number;
    cost: number;
  }>;
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
        service_type VARCHAR(100) NOT NULL REFERENCES service_prices(service_type),
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

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_call_id ON smp_calls(call_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_provider_id ON smp_calls(smp_provider_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_status ON smp_calls(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_called_at ON smp_calls(called_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_organization ON smp_calls(organization_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_calls_service_type ON smp_calls(service_type)
    `);

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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCall(result.rows[0]);
  }

  async findByCallId(callId: string): Promise<SMPCall[]> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM smp_calls WHERE call_id = $1 ORDER BY called_at DESC', [callId]);
    return result.rows.map((row) => this.mapRowToCall(row));
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
    let paramIndex = 1;

    if (filters.providerId) {
      conditions.push(`smp_provider_id = $${paramIndex}`);
      params.push(filters.providerId);
      paramIndex++;
    }

    if (filters.callId) {
      conditions.push(`call_id = $${paramIndex}`);
      params.push(filters.callId);
      paramIndex++;
    }

    if (filters.from) {
      conditions.push(`called_at >= $${paramIndex}`);
      params.push(filters.from);
      paramIndex++;
    }

    if (filters.to) {
      conditions.push(`called_at <= $${paramIndex}`);
      params.push(filters.to);
      paramIndex++;
    }

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`organization_id = $${paramIndex}`);
      params.push(filters.organizationId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM smp_calls ${whereClause} ORDER BY called_at DESC`;

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToCall(row));
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
    let paramIndex = 1;

    if (filters.from) {
      conditions.push(`sc.called_at >= $${paramIndex}`);
      params.push(filters.from);
      paramIndex++;
    }

    if (filters.to) {
      conditions.push(`sc.called_at <= $${paramIndex}`);
      params.push(filters.to);
      paramIndex++;
    }

    if (filters.providerId) {
      conditions.push(`sc.smp_provider_id = $${paramIndex}`);
      params.push(filters.providerId);
      paramIndex++;
    }

    if (filters.organizationId) {
      conditions.push(`sc.organization_id = $${paramIndex}`);
      params.push(filters.organizationId);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get summary by provider
    const summaryQuery = `
      SELECT 
        sp.id as provider_id,
        sp.name as provider_name,
        COUNT(DISTINCT sc.id) as total_calls,
        COALESCE(SUM(sc.total_price), 0) as total_cost,
        COALESCE(MAX(sc.currency), 'RUB') as currency,
        MIN(sc.called_at) as period_from,
        MAX(sc.called_at) as period_to
      FROM smp_providers sp
      INNER JOIN smp_calls sc ON sc.smp_provider_id = sp.id
      ${whereClause}
      GROUP BY sp.id, sp.name
      HAVING COUNT(DISTINCT sc.id) > 0
      ORDER BY total_cost DESC
    `;

    const summaryResult = await db.query(summaryQuery, params);
    const summaries: SMPCostSummary[] = [];

    for (const row of summaryResult.rows) {
      // Get breakdown by service type for this provider
      const serviceTypeConditions: string[] = ['smp_provider_id = $1'];
      const serviceTypeParams: any[] = [row.provider_id];
      let stParamIndex = 2;

      if (filters.from) {
        serviceTypeConditions.push(`called_at >= $${stParamIndex}`);
        serviceTypeParams.push(filters.from);
        stParamIndex++;
      }

      if (filters.to) {
        serviceTypeConditions.push(`called_at <= $${stParamIndex}`);
        serviceTypeParams.push(filters.to);
        stParamIndex++;
      }

      if (filters.organizationId) {
        serviceTypeConditions.push(`organization_id = $${stParamIndex}`);
        serviceTypeParams.push(filters.organizationId);
      }

      const serviceTypeQuery = `
        SELECT 
          service_type,
          COUNT(*) as count,
          SUM(total_price) as cost
        FROM smp_calls
        WHERE ${serviceTypeConditions.join(' AND ')}
        GROUP BY service_type
      `;

      const serviceTypeResult = await db.query(serviceTypeQuery, serviceTypeParams);

      const byServiceType: Record<string, { count: number; cost: number }> = {};
      serviceTypeResult.rows.forEach((stRow) => {
        byServiceType[stRow.service_type] = {
          count: parseInt(stRow.count),
          cost: parseFloat(stRow.cost),
        };
      });

      summaries.push({
        providerId: row.provider_id,
        providerName: row.provider_name,
        totalCalls: parseInt(row.total_calls),
        totalCost: parseFloat(row.total_cost),
        currency: row.currency,
        period: {
          from: new Date(row.period_from),
          to: new Date(row.period_to),
        },
        byServiceType,
      });
    }

    return summaries;
  }

  async updateStatus(id: string, status: string, completedAt?: Date): Promise<SMPCall> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `UPDATE smp_calls 
       SET status = $1, completed_at = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [status, completedAt || null, id],
    );

    return this.mapRowToCall(result.rows[0]);
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
      notes: row.notes,
      organizationId: row.organization_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

