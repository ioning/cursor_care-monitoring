import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';
import { OrganizationStatus, SubscriptionTier } from '../../../../shared/types/common.types';

export interface Organization {
  id: string;
  name: string;
  slug: string; // Уникальный идентификатор для URL
  description?: string;
  status: OrganizationStatus;
  subscriptionTier: SubscriptionTier;
  subscriptionPlanId?: string;
  maxWards?: number; // Лимит подопечных
  maxDispatchers?: number; // Лимит диспетчеров
  maxGuardians?: number; // Лимит опекунов
  features: Record<string, any>; // JSONB - доступные функции
  settings: Record<string, any>; // JSONB - настройки организации
  billingEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: Record<string, any>; // JSONB
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OrganizationRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
        subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise', 'custom')),
        subscription_plan_id UUID,
        max_wards INTEGER,
        max_dispatchers INTEGER,
        max_guardians INTEGER,
        features JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{}',
        billing_email VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        address JSONB,
        trial_ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier)
    `);
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    subscriptionTier?: SubscriptionTier;
    maxWards?: number;
    maxDispatchers?: number;
    maxGuardians?: number;
    features?: Record<string, any>;
    settings?: Record<string, any>;
    billingEmail?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: Record<string, any>;
    trialDays?: number;
  }): Promise<Organization> {
    const db = getDatabaseConnection();
    const trialEndsAt = data.trialDays
      ? new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await db.query(
      `INSERT INTO organizations (
        name, slug, description, subscription_tier, max_wards, max_dispatchers, 
        max_guardians, features, settings, billing_email, contact_email, 
        contact_phone, address, trial_ends_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.name,
        data.slug,
        data.description || null,
        data.subscriptionTier || 'basic',
        data.maxWards || null,
        data.maxDispatchers || null,
        data.maxGuardians || null,
        JSON.stringify(data.features || {}),
        JSON.stringify(data.settings || {}),
        data.billingEmail || null,
        data.contactEmail || null,
        data.contactPhone || null,
        data.address ? JSON.stringify(data.address) : null,
        trialEndsAt,
        trialEndsAt ? 'trial' : 'active',
      ],
    );
    return this.mapRowToOrganization(result.rows[0]);
  }

  async findById(id: string): Promise<Organization | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM organizations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToOrganization(result.rows[0]);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM organizations WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToOrganization(result.rows[0]);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const db = getDatabaseConnection();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.subscriptionTier !== undefined) {
      updates.push(`subscription_tier = $${paramIndex++}`);
      values.push(data.subscriptionTier);
    }
    if (data.maxWards !== undefined) {
      updates.push(`max_wards = $${paramIndex++}`);
      values.push(data.maxWards);
    }
    if (data.maxDispatchers !== undefined) {
      updates.push(`max_dispatchers = $${paramIndex++}`);
      values.push(data.maxDispatchers);
    }
    if (data.maxGuardians !== undefined) {
      updates.push(`max_guardians = $${paramIndex++}`);
      values.push(data.maxGuardians);
    }
    if (data.features !== undefined) {
      updates.push(`features = $${paramIndex++}`);
      values.push(JSON.stringify(data.features));
    }
    if (data.settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(data.settings));
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapRowToOrganization(result.rows[0]);
  }

  async getStats(organizationId: string): Promise<{
    totalWards: number;
    totalDispatchers: number;
    totalGuardians: number;
    activeSubscriptions: number;
  }> {
    const db = getDatabaseConnection();

    // Подсчет подопечных (из user_service.wards или через API)
    const wardsResult = await db.query(
      `SELECT COUNT(*) as count FROM wards WHERE organization_id = $1 AND status = 'active'`,
      [organizationId],
    );
    const totalWards = parseInt(wardsResult.rows[0]?.count || '0', 10);

    // Подсчет диспетчеров (из auth.users)
    const dispatchersResult = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND role = 'dispatcher' AND status = 'active'`,
      [organizationId],
    );
    const totalDispatchers = parseInt(dispatchersResult.rows[0]?.count || '0', 10);

    // Подсчет опекунов (из auth.users)
    const guardiansResult = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND role = 'guardian' AND status = 'active'`,
      [organizationId],
    );
    const totalGuardians = parseInt(guardiansResult.rows[0]?.count || '0', 10);

    // Подсчет активных подписок (из billing.subscriptions)
    // Примечание: В реальной реализации это будет запрос к billing service
    // Для MVP проверяем локально, если таблица доступна
    let activeSubscriptions = 0;
    try {
      const subscriptionsResult = await db.query(
        `SELECT COUNT(*) as count FROM subscriptions WHERE organization_id = $1 AND status = 'active'`,
        [organizationId],
      );
      activeSubscriptions = parseInt(subscriptionsResult.rows[0]?.count || '0', 10);
    } catch (error) {
      // Таблица может быть в другой БД, это нормально
      activeSubscriptions = 0;
    }

    return {
      totalWards,
      totalDispatchers,
      totalGuardians,
      activeSubscriptions,
    };
  }

  private mapRowToOrganization(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      subscriptionTier: row.subscription_tier,
      subscriptionPlanId: row.subscription_plan_id,
      maxWards: row.max_wards,
      maxDispatchers: row.max_dispatchers,
      maxGuardians: row.max_guardians,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || {},
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings || {},
      billingEmail: row.billing_email,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address,
      trialEndsAt: row.trial_ends_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}




import { OrganizationStatus, SubscriptionTier } from '../../../../shared/types/common.types';

export interface Organization {
  id: string;
  name: string;
  slug: string; // Уникальный идентификатор для URL
  description?: string;
  status: OrganizationStatus;
  subscriptionTier: SubscriptionTier;
  subscriptionPlanId?: string;
  maxWards?: number; // Лимит подопечных
  maxDispatchers?: number; // Лимит диспетчеров
  maxGuardians?: number; // Лимит опекунов
  features: Record<string, any>; // JSONB - доступные функции
  settings: Record<string, any>; // JSONB - настройки организации
  billingEmail?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: Record<string, any>; // JSONB
  trialEndsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class OrganizationRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'trial' CHECK (status IN ('active', 'suspended', 'trial', 'expired')),
        subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'professional', 'enterprise', 'custom')),
        subscription_plan_id UUID,
        max_wards INTEGER,
        max_dispatchers INTEGER,
        max_guardians INTEGER,
        features JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{}',
        billing_email VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        address JSONB,
        trial_ends_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_organizations_subscription_tier ON organizations(subscription_tier)
    `);
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    subscriptionTier?: SubscriptionTier;
    maxWards?: number;
    maxDispatchers?: number;
    maxGuardians?: number;
    features?: Record<string, any>;
    settings?: Record<string, any>;
    billingEmail?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: Record<string, any>;
    trialDays?: number;
  }): Promise<Organization> {
    const db = getDatabaseConnection();
    const trialEndsAt = data.trialDays
      ? new Date(Date.now() + data.trialDays * 24 * 60 * 60 * 1000)
      : null;

    const result = await db.query(
      `INSERT INTO organizations (
        name, slug, description, subscription_tier, max_wards, max_dispatchers, 
        max_guardians, features, settings, billing_email, contact_email, 
        contact_phone, address, trial_ends_at, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.name,
        data.slug,
        data.description || null,
        data.subscriptionTier || 'basic',
        data.maxWards || null,
        data.maxDispatchers || null,
        data.maxGuardians || null,
        JSON.stringify(data.features || {}),
        JSON.stringify(data.settings || {}),
        data.billingEmail || null,
        data.contactEmail || null,
        data.contactPhone || null,
        data.address ? JSON.stringify(data.address) : null,
        trialEndsAt,
        trialEndsAt ? 'trial' : 'active',
      ],
    );
    return this.mapRowToOrganization(result.rows[0]);
  }

  async findById(id: string): Promise<Organization | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM organizations WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToOrganization(result.rows[0]);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM organizations WHERE slug = $1', [slug]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToOrganization(result.rows[0]);
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const db = getDatabaseConnection();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.subscriptionTier !== undefined) {
      updates.push(`subscription_tier = $${paramIndex++}`);
      values.push(data.subscriptionTier);
    }
    if (data.maxWards !== undefined) {
      updates.push(`max_wards = $${paramIndex++}`);
      values.push(data.maxWards);
    }
    if (data.maxDispatchers !== undefined) {
      updates.push(`max_dispatchers = $${paramIndex++}`);
      values.push(data.maxDispatchers);
    }
    if (data.maxGuardians !== undefined) {
      updates.push(`max_guardians = $${paramIndex++}`);
      values.push(data.maxGuardians);
    }
    if (data.features !== undefined) {
      updates.push(`features = $${paramIndex++}`);
      values.push(JSON.stringify(data.features));
    }
    if (data.settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`);
      values.push(JSON.stringify(data.settings));
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await db.query(
      `UPDATE organizations SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values,
    );

    return this.mapRowToOrganization(result.rows[0]);
  }

  async getStats(organizationId: string): Promise<{
    totalWards: number;
    totalDispatchers: number;
    totalGuardians: number;
    activeSubscriptions: number;
  }> {
    const db = getDatabaseConnection();

    // Подсчет подопечных (из user_service.wards или через API)
    const wardsResult = await db.query(
      `SELECT COUNT(*) as count FROM wards WHERE organization_id = $1 AND status = 'active'`,
      [organizationId],
    );
    const totalWards = parseInt(wardsResult.rows[0]?.count || '0', 10);

    // Подсчет диспетчеров (из auth.users)
    const dispatchersResult = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND role = 'dispatcher' AND status = 'active'`,
      [organizationId],
    );
    const totalDispatchers = parseInt(dispatchersResult.rows[0]?.count || '0', 10);

    // Подсчет опекунов (из auth.users)
    const guardiansResult = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE organization_id = $1 AND role = 'guardian' AND status = 'active'`,
      [organizationId],
    );
    const totalGuardians = parseInt(guardiansResult.rows[0]?.count || '0', 10);

    // Подсчет активных подписок (из billing.subscriptions)
    // Примечание: В реальной реализации это будет запрос к billing service
    // Для MVP проверяем локально, если таблица доступна
    let activeSubscriptions = 0;
    try {
      const subscriptionsResult = await db.query(
        `SELECT COUNT(*) as count FROM subscriptions WHERE organization_id = $1 AND status = 'active'`,
        [organizationId],
      );
      activeSubscriptions = parseInt(subscriptionsResult.rows[0]?.count || '0', 10);
    } catch (error) {
      // Таблица может быть в другой БД, это нормально
      activeSubscriptions = 0;
    }

    return {
      totalWards,
      totalDispatchers,
      totalGuardians,
      activeSubscriptions,
    };
  }

  private mapRowToOrganization(row: any): Organization {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      status: row.status,
      subscriptionTier: row.subscription_tier,
      subscriptionPlanId: row.subscription_plan_id,
      maxWards: row.max_wards,
      maxDispatchers: row.max_dispatchers,
      maxGuardians: row.max_guardians,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features || {},
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings || {},
      billingEmail: row.billing_email,
      contactEmail: row.contact_email,
      contactPhone: row.contact_phone,
      address: typeof row.address === 'string' ? JSON.parse(row.address) : row.address,
      trialEndsAt: row.trial_ends_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

