import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

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

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_providers_active ON smp_providers(is_active)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_providers_organization ON smp_providers(organization_id)
    `);
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
    return result.rows.map((row) => this.mapRowToProvider(row));
  }

  async findById(id: string): Promise<SMPProvider | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM smp_providers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProvider(result.rows[0]);
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
    return result.rows.map((row) => this.mapRowToProvider(row));
  }

  async create(provider: Omit<SMPProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMPProvider> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO smp_providers (
        name, phone, email, address, contract_number, contract_date,
        is_active, service_area, rating, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        provider.name,
        provider.phone,
        provider.email || null,
        provider.address || null,
        provider.contractNumber || null,
        provider.contractDate || null,
        provider.isActive,
        provider.serviceArea || null,
        provider.rating || null,
        provider.organizationId || null,
      ],
    );

    return this.mapRowToProvider(result.rows[0]);
  }

  async update(id: string, updates: Partial<SMPProvider>): Promise<SMPProvider> {
    const db = getDatabaseConnection();
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbKey} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id) as Promise<SMPProvider>;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE smp_providers SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapRowToProvider(result.rows[0]);
  }

  private mapRowToProvider(row: any): SMPProvider {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      address: row.address,
      contractNumber: row.contract_number,
      contractDate: row.contract_date ? new Date(row.contract_date) : undefined,
      isActive: row.is_active,
      serviceArea: row.service_area,
      rating: row.rating ? parseFloat(row.rating) : undefined,
      organizationId: row.organization_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}


import { getDatabaseConnection } from '../../../../shared/libs/database';

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

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_providers_active ON smp_providers(is_active)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_smp_providers_organization ON smp_providers(organization_id)
    `);
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
    return result.rows.map((row) => this.mapRowToProvider(row));
  }

  async findById(id: string): Promise<SMPProvider | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM smp_providers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToProvider(result.rows[0]);
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
    return result.rows.map((row) => this.mapRowToProvider(row));
  }

  async create(provider: Omit<SMPProvider, 'id' | 'createdAt' | 'updatedAt'>): Promise<SMPProvider> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO smp_providers (
        name, phone, email, address, contract_number, contract_date,
        is_active, service_area, rating, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        provider.name,
        pÿÿÿÿÿÿE E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿE ±F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿE ÿÿÿ!E ¯E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ*E +E ,E -E .E /E 0E 1E 2E 3E 4E 5E 6E 7E 8E 9E :E ;E <E =E >E ?E @E AE BE CE DE EE FE GE HE IE JE KE LE ME NE OE PE QE RE SE TE UE VE WE XE YE ZE [E \E ]E ^E _E `E aE bE cE dE hG ÿÿÿÿÿÿhE 5F ÿÿÿÿÿÿlE mE nE oE pE qE rE sE tE uE vE wE xE yE zE {E |E }E ~E E €E E ‚E ƒE „E …E †E ‡E ˆE ‰E ŠE ‹E ŒE E E E E ‘E ’E “E ”E •E –E —E ˜E ™E šE ›E œE E E ŸE  E ¡E ¢E £E ¤E ¥E ¦E ®G ¨E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÁE ÔE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÜE İE ßE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÕE æE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿŞE îE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿöE çE ÿÿÿÿÿÿÿÿÿÿÿÿ<F ÿÿÿÿÿÿïE =F ÿÿÿAF ÿÿÿÿÿÿÿÿÿÿÿÿ÷E øE ùE úE ûE üE ıE şE ÿE  F F F F F F F F F 	F 
F F F F F F F F F F F F F F F F F F F F F F  F !F "F #F $F %F &F 'F (F )F mG ÿÿÿÿÿÿ-F ÿÿÿ/F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿOF ÿÿÿ>F VF ÿÿÿÿÿÿBF ÿÿÿÿÿÿÿÿÿÿÿÿZF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿPF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ[F fF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿgF rF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿsF }F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ~F ‰F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ†F ÿÿÿÿÿÿÿÿÿŠF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ®F ¿F ÿÿÿÿÿÿ²F ÃF ÿÿÿµF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ½F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÄF ÒF ÿÿÿÿÿÿÿÿÿÖF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÏF ÜF ÑF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ×F âF ÿÿÿÿÿÿÿÿÿÿÿÿİF éF