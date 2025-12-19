import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface SMPProvider {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  contractDate?: Date;
  isActive: boolean;
  serviceArea?: string;
  rating?: number;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SMPProviderRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS smp_providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        address TEXT,
        contract_number VARCHAR(100),
        contract_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        service_area VARCHAR(255),
        rating DECIMAL(3,2) CHECK (rating >= 0 AND rating <= 5),
        organization_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_providers_active ON smp_providers(is_active)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_providers_organization ON smp_providers(organization_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_smp_providers_name ON smp_providers(name)`);
  }

  async findAll(organizationId?: string): Promise<SMPProvider[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM smp_providers';
    const params: any[] = [];

    if (organizationId) {
      query += ' WHERE organization_id = $1';
      params.push(organizationId);
    }

    query += ' ORDER BY name ASC';

    const result = await db.query(query, params);
    return result.rows.map((row: any) => this.mapRowToProvider(row));
  }

  async findById(id: string): Promise<SMPProvider | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM smp_providers WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRowToProvider(result.rows[0]) : null;
  }

  async findActive(organizationId?: string): Promise<SMPProvider[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM smp_providers WHERE is_active = TRUE';
    const params: any[] = [];

    if (organizationId) {
      query += ' AND organization_id = $1';
      params.push(organizationId);
    }

    query += ' ORDER BY name ASC';
    const result = await db.query(query, params);
    return result.rows.map((row: any) => this.mapRowToProvider(row));
  }

  async create(provider: Omit<SMPProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMPProvider> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO smp_providers (
        name, phone, email, address, contract_number, contract_date,
        is_active, service_area, rating, organization_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        provider.name,
        provider.phone,
        provider.email || null,
        provider.address || null,
        provider.contractNumber || null,
        provider.contractDate || null,
        provider.isActive ?? true,
        provider.serviceArea || null,
        provider.rating ?? null,
        provider.organizationId || null,
      ],
    );
    return this.mapRowToProvider(result.rows[0]);
  }

  async update(providerId: string, updates: Partial<SMPProvider>): Promise<SMPProvider> {
    const db = getDatabaseConnection();

    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const maybeSet = (col: string, val: any) => {
      if (val === undefined) return;
      setParts.push(`${col} = $${idx++}`);
      values.push(val);
    };

    maybeSet('name', updates.name);
    maybeSet('phone', updates.phone);
    maybeSet('email', updates.email ?? null);
    maybeSet('address', updates.address ?? null);
    maybeSet('contract_number', updates.contractNumber ?? null);
    maybeSet('contract_date', updates.contractDate ?? null);
    maybeSet('is_active', updates.isActive);
    maybeSet('service_area', updates.serviceArea ?? null);
    maybeSet('rating', updates.rating ?? null);
    maybeSet('organization_id', updates.organizationId ?? null);

    setParts.push(`updated_at = NOW()`);
    values.push(providerId);

    const result = await db.query(
      `UPDATE smp_providers SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      throw new Error(`SMPProvider ${providerId} not found`);
    }

    return this.mapRowToProvider(result.rows[0]);
  }

  private mapRowToProvider(row: any): SMPProvider {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email ?? undefined,
      address: row.address ?? undefined,
      contractNumber: row.contract_number ?? undefined,
      contractDate: row.contract_date ? new Date(row.contract_date) : undefined,
      isActive: row.is_active,
      serviceArea: row.service_area ?? undefined,
      rating: row.rating !== null && row.rating !== undefined ? parseFloat(row.rating) : undefined,
      organizationId: row.organization_id ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}


