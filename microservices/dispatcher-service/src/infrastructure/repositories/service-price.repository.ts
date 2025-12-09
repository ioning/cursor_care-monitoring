import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

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

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_service_prices_active ON service_prices(is_active)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_service_prices_type ON service_prices(service_type)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_service_prices_organization ON service_prices(organization_id)
    `);

    // Insert default service prices if table is empty
    const countResult = await db.query('SELECT COUNT(*) as count FROM service_prices');
    if (parseInt(countResult.rows[0].count) === 0) {
      await this.insertDefaultPrices();
    }
  }

  private async insertDefaultPrices() {
    const db = getDatabaseConnection();
    const defaultPrices = [
      {
        service_type: 'emergency_call',
        service_name: 'Ğ­ĞºÑÑ‚Ñ€ĞµĞ½Ğ½Ñ‹Ğ¹ Ğ²Ñ‹Ğ·Ğ¾Ğ²',
        base_price: 5000,
        currency: 'RUB',
        unit: 'per_call',
        description: 'Ğ­ĞºÑÑ‚Ñ€ĞµĞ½Ğ½Ñ‹Ğ¹ Ğ²Ñ‹Ğ·Ğ¾Ğ² ÑĞºĞ¾Ñ€Ğ¾Ğ¹ Ğ¼ĞµĞ´Ğ¸Ñ†Ğ¸Ğ½ÑĞºĞ¾Ğ¹ Ğ¿Ğ¾Ğ¼Ğ¾Ñ‰Ğ¸',
        is_active: true,
      },
      {
        service_type: 'ambulance',
        service_name: 'Ğ¡ĞºĞ¾Ñ€Ğ°Ñ Ğ¿Ğ¾Ğ¼Ğ¾Ñ‰ÑŒ',
        base_price: 8000,
        currency: 'RUB',
        unit: 'per_call',
        description: 'Ğ’Ñ‹Ğ·Ğ¾Ğ² Ğ±Ñ€Ğ¸Ğ³Ğ°Ğ´Ñ‹ ÑĞºĞ¾Ñ€Ğ¾Ğ¹ Ğ¼ĞµĞ´Ğ¸Ñ†Ğ¸Ğ½ÑĞºĞ¾Ğ¹ Ğ¿Ğ¾Ğ¼Ğ¾Ñ‰Ğ¸',
        is_active: true,
      },
      {
        service_type: 'medical_consultation',
        service_name: 'ĞœĞµĞ´Ğ¸Ñ†Ğ¸Ğ½ÑĞºĞ°Ñ ĞºĞ¾Ğ½ÑÑƒĞ»ÑŒÑ‚Ğ°Ñ†Ğ¸Ñ',
        base_price: 3000,
        currency: 'RUB',
        unit: 'per_call',
        description: 'ĞšĞ¾Ğ½ÑÑƒĞ»ÑŒÑ‚Ğ°Ñ†Ğ¸Ñ Ğ²Ñ€Ğ°Ñ‡Ğ° Ğ¿Ğ¾ Ñ‚ĞµĞ»ĞµÑ„Ğ¾Ğ½Ñƒ',
        is_active: true,
      },
      {
        service_type: 'transportation',
        service_name: 'Ğ¢Ñ€Ğ°Ğ½ÑĞ¿Ğ¾Ñ€Ñ‚Ğ¸Ñ€Ğ¾Ğ²ĞºĞ°',
        base_price: 50,
        currency: 'RUB',
        unit: 'per_km',
        description: 'Ğ¢Ñ€Ğ°Ğ½ÑĞ¿Ğ¾Ñ€Ñ‚Ğ¸Ñ€Ğ¾Ğ²ĞºĞ° Ğ¿Ğ°Ñ†Ğ¸ĞµĞ½Ñ‚Ğ° (Ğ·Ğ° ĞºĞ¸Ğ»Ğ¾Ğ¼ĞµÑ‚Ñ€)',
        is_active: true,
      },
      {
        service_type: 'home_visit',
        service_name: 'Ğ’Ñ‹ĞµĞ·Ğ´ Ğ½Ğ° Ğ´Ğ¾Ğ¼',
        base_price: 6000,
        currency: 'RUB',
        unit: 'per_call',
        description: 'Ğ’Ñ‹ĞµĞ·Ğ´ Ğ¼ĞµĞ´Ğ¸Ñ†Ğ¸Ğ½ÑĞºĞ¾Ğ¹ Ğ±Ñ€Ğ¸Ğ³Ğ°Ğ´Ñ‹ Ğ½Ğ° Ğ´Ğ¾Ğ¼',
        is_active: true,
      },
    ];

    for (const price of defaultPrices) {
      await db.query(
        `INSERT INTO service_prices (
          service_type, service_name, base_price, currency, unit, description, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (service_type) DO NOTHING`,
        [
          price.service_type,
          price.service_name,
          price.base_price,
          price.currency,
          price.unit,
          price.description,
          price.is_active,
        ],
      );
    }
  }

  async findAll(organizationId?: string): Promise<ServicePrice[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM service_prices';
    const params: any[] = [];

    if (organizationId) {
      query += ' WHERE organization_id = $1 OR organization_id IS NULL';
      params.push(organizationId);
    }

    query += ' ORDER BY service_name ASC';

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToPrice(row));
  }

  async findByType(serviceType: string, organizationId?: string): Promise<ServicePrice | null> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM service_prices WHERE service_type = $1';
    const params: any[] = [serviceType];

    if (organizationId) {
      query += ' AND (organization_id = $2 OR organization_id IS NULL)';
      params.push(organizationId);
    }

    query += ' ORDER BY organization_id NULLS LAST LIMIT 1';

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPrice(result.rows[0]);
  }

  async findActive(organizationId?: string): Promise<ServicePrice[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM service_prices WHERE is_active = TRUE';
    const params: any[] = [];

    if (organizationId) {
      query += ' AND (organization_id = $1 OR organization_id IS NULL)';
      params.push(organizationId);
    }

    query += ' ORDER BY service_name ASC';

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToPrice(row));
  }

  async create(price: Omit<ServicePrice, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServicePrice> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO service_prices (
        service_type, service_name, base_price, currency, unit, description, is_active, organization_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        price.serviceType,
        price.serviceName,
        price.basePrice,
        price.currency,
        price.unit,
        price.description || null,
        price.isActive,
        price.organizationId || null,
      ],
    );

    return this.mapRowToPrice(result.rows[0]);
  }

  async update(id: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
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
      return this.findByType(id) as Promise<ServicePrice>;
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE service_prices SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapRowToPrice(result.rows[0]);
  }

  private mapRowToPrice(row: any): ServicePrice {
    return {
      id: row.id,
      serviceType: row.service_type,
      serviceName: row.service_name,
      basePrice: parseFloat(row.base_price),
      currency: row.currency,
      unit: row.unit,
      description: row.description,
      isActive: row.is_active,
      organizationId: row.organization_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}


import { getDatabaseConnection } from '../../../../shared/libs/database';

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
  creatÿÿÿÿÿÿE E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿE ±F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿE ÿÿÿ!E ¯E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ*E +E ,E -E .E /E 0E 1E 2E 3E 4E 5E 6E 7E 8E 9E :E ;E <E =E >E ?E @E AE BE CE DE EE FE GE HE IE JE KE LE ME NE OE PE QE RE SE TE UE VE WE XE YE ZE [E \E ]E ^E _E `E aE bE cE dE hG ÿÿÿÿÿÿhE 5F ÿÿÿÿÿÿlE mE nE oE pE qE rE sE tE uE vE wE xE yE zE {E |E }E ~E E €E E ‚E ƒE „E …E †E ‡E ˆE ‰E ŠE ‹E ŒE E E E E ‘E ’E “E ”E •E –E —E ˜E ™E šE ›E œE E E ŸE  E ¡E ¢E £E ¤E ¥E ¦E ®G ¨E ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÁE ÔE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÜE İE ßE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÕE æE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿŞE îE ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿöE çE ÿÿÿÿÿÿÿÿÿÿÿÿ<F ÿÿÿÿÿÿïE =F ÿÿÿAF ÿÿÿÿÿÿÿÿÿÿÿÿ÷E øE ùE úE ûE üE ıE şE ÿE  F F F F F F F F F 	F 
F F F F F F F F F F F F F F F F F F F F F F  F !F "F #F $F %F &F 'F (F )F mG ÿÿÿÿÿÿ-F ÿÿÿ/F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿOF ÿÿÿ>F VF ÿÿÿÿÿÿBF ÿÿÿÿÿÿÿÿÿÿÿÿZF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿPF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ[F fF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿgF rF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿsF }F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ~F ‰F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ†F ÿÿÿÿÿÿÿÿÿŠF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ®F ¿F ÿÿÿÿÿÿ²F ÃF ÿÿÿµF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ½F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÄF ÒF ÿÿÿÿÿÿÿÿÿÖF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÏF ÜF ÑF ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ×F âF ÿÿÿÿÿÿÿÿÿÿÿÿİF éF ÿÿÿÿÿÿÿÿÿÿÿÿãF ¶D ÿÿÿæF ¹D ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿóF G õF G ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿG G ÿÿÿG G ÿÿÿÿÿÿÿÿÿÿÿÿG ÿÿÿÿÿÿG ÿÿÿÿÿÿÿÿÿÿÿÿ"G ÿÿÿG &G G )G ÿÿÿG ,G ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ#G 3G ÿÿÿÿÿÿ'G 6G ÿÿÿÿÿÿÿÿÿÿÿÿ-G ;G ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ4G GG ÿÿÿ7G KG ÿÿÿÿÿÿÿÿÿ<G RG ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿCG ÿÿÿÿÿÿÿÿÿÿÿÿHG \G ÿÿÿÿÿÿLG _G aG ÿÿÿPG ÿÿÿÿÿÿSG dG eG ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿ[G ÿÿÿ]G ,F ÿÿÿ`G .F ÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿÿiG ğG ÿÿÿlG ÿÿÿnG oG pG qG rG sG tG uG vG wG xG yG zG {G |G }G ~G G €G G ‚G ƒG „G …G †G ‡G ˆG ‰G ŠG ‹G ŒG G G G G ‘G ’G “G ”G •G –G —G ˜G ™G šG ›G œG G G ŸG  G ¡G ¢G £G ¤G ¥G ¦G §G ¨G ©G ªG «G ¬G ÿÿÿÿÿÿ¯G °G ±G ²G ³G ´G µG ¶G ·G ¸G ¹G ºG »G ¼G ½G ¾G ¿G ÀG ÁG ÂG ÃG ÄG ÅG ÆG ÇG ÈG ÉG ÊG ËG ÌG ÍG ÎG ÏG ĞG ÑG ÒG ÓG ÔG ÕG ÖG ×G ØG ÙG ÚG ÛG ÜG İG ŞG ßG àG áG âG ãG äG åG æG çG èG éG êG ëG ìG íG ÿÿÿÿÿÿÿÿÿñG òG óG ôG õG öG ÷G øG ùG úG ûG üG ıG şG ÿG  H H H H H H H H H 	H 
H H H H H H H H H H H H H H H H H H H H H H  H !H "H #H $H %H &H 'H (H )H *H +H ,H -H .H /H ÿÿÿ                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              