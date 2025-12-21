import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface ServicePrice {
  id: string;
  serviceType: string;
  serviceName: string;
  basePrice: number;
  currency: string;
  unit: string; // 'per_call', 'per_hour', 'per_km', 'per_day', 'per_month'
  description?: string;
  isActive: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ServicePriceRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS service_prices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_type VARCHAR(100) NOT NULL UNIQUE,
        service_name VARCHAR(255) NOT NULL,
        base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
        currency VARCHAR(3) DEFAULT 'RUB',
        unit VARCHAR(50) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        organization_id UUID,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Backward-compatible schema upgrades (older migrations created service_prices without organization_id)
    await db.query(`ALTER TABLE service_prices ADD COLUMN IF NOT EXISTS organization_id UUID`);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_service_prices_organization ON service_prices(organization_id)`);

    const countResult = await db.query('SELECT COUNT(*) as count FROM service_prices');
    if (parseInt(countResult.rows[0].count, 10) === 0) {
      await this.insertDefaultPrices();
    }
  }

  async findAll(organizationId?: string): Promise<ServicePrice[]> {
    const db = getDatabaseConnection();

    const params: any[] = [];
    let where = '';

    // If org specified, return org-specific + global (organization_id IS NULL)
    if (organizationId) {
      where = 'WHERE (organization_id = $1 OR organization_id IS NULL)';
      params.push(organizationId);
    }

    const result = await db.query(
      `SELECT * FROM service_prices ${where} ORDER BY service_type ASC, organization_id NULLS LAST`,
      params,
    );
    return result.rows.map((row: any) => this.mapRowToPrice(row));
  }

  async findActive(organizationId?: string): Promise<ServicePrice[]> {
    const db = getDatabaseConnection();

    const params: any[] = [];
    let where = 'WHERE is_active = TRUE';

    if (organizationId) {
      where += ' AND (organization_id = $1 OR organization_id IS NULL)';
      params.push(organizationId);
    }

    const result = await db.query(
      `SELECT * FROM service_prices ${where} ORDER BY service_type ASC, organization_id NULLS LAST`,
      params,
    );
    return result.rows.map((row: any) => this.mapRowToPrice(row));
  }

  async findByType(serviceType: string, organizationId?: string): Promise<ServicePrice | null> {
    const db = getDatabaseConnection();

    if (!organizationId) {
      const result = await db.query(
        `SELECT * FROM service_prices WHERE service_type = $1 AND organization_id IS NULL LIMIT 1`,
        [serviceType],
      );
      return result.rows[0] ? this.mapRowToPrice(result.rows[0]) : null;
    }

    // Prefer org-specific price; fallback to global
    const result = await db.query(
      `SELECT * FROM service_prices
       WHERE service_type = $1 AND (organization_id = $2 OR organization_id IS NULL)
       ORDER BY organization_id NULLS LAST
       LIMIT 1`,
      [serviceType, organizationId],
    );

    return result.rows[0] ? this.mapRowToPrice(result.rows[0]) : null;
  }

  async create(price: Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServicePrice> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO service_prices (
        service_type, service_name, base_price, currency, unit, description, is_active, organization_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *`,
      [
        price.serviceType,
        price.serviceName,
        price.basePrice,
        price.currency || 'RUB',
        price.unit,
        price.description || null,
        price.isActive ?? true,
        price.organizationId || null,
      ],
    );
    return this.mapRowToPrice(result.rows[0]);
  }

  async update(priceId: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
    const db = getDatabaseConnection();

    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const maybeSet = (col: string, val: any) => {
      if (val === undefined) return;
      setParts.push(`${col} = $${idx++}`);
      values.push(val);
    };

    maybeSet('service_name', updates.serviceName);
    maybeSet('base_price', updates.basePrice);
    maybeSet('currency', updates.currency);
    maybeSet('unit', updates.unit);
    maybeSet('description', updates.description ?? null);
    maybeSet('is_active', updates.isActive);
    maybeSet('organization_id', updates.organizationId ?? null);

    // Always bump updated_at
    setParts.push(`updated_at = NOW()`);

    values.push(priceId);

    const result = await db.query(
      `UPDATE service_prices SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );

    if (!result.rows[0]) {
      throw new Error(`ServicePrice ${priceId} not found`);
    }

    return this.mapRowToPrice(result.rows[0]);
  }

  private async insertDefaultPrices() {
    const db = getDatabaseConnection();
    const defaults: Array<Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        serviceType: 'ambulance_call',
        serviceName: 'Вызов скорой помощи',
        basePrice: 0,
        currency: 'RUB',
        unit: 'per_call',
        description: 'Базовая стоимость вызова (пример/дефолт)',
        isActive: true,
        organizationId: undefined,
      },
      {
        serviceType: 'doctor_visit',
        serviceName: 'Вызов врача на дом',
        basePrice: 0,
        currency: 'RUB',
        unit: 'per_call',
        description: 'Базовая стоимость визита врача (пример/дефолт)',
        isActive: true,
        organizationId: undefined,
      },
    ];

    for (const p of defaults) {
      await db.query(
        `INSERT INTO service_prices (service_type, service_name, base_price, currency, unit, description, is_active, organization_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (service_type) DO NOTHING`,
        [
          p.serviceType,
          p.serviceName,
          p.basePrice,
          p.currency,
          p.unit,
          p.description || null,
          p.isActive ?? true,
          p.organizationId || null,
        ],
      );
    }
  }

  private mapRowToPrice(row: any): ServicePrice {
    return {
      id: row.id,
      serviceType: row.service_type,
      serviceName: row.service_name,
      basePrice: parseFloat(row.base_price),
      currency: row.currency,
      unit: row.unit,
      description: row.description ?? undefined,
      isActive: row.is_active,
      organizationId: row.organization_id ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}


