import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Subscription {
  id: string;
  userId?: string; // Optional for organization subscriptions
  organizationId?: string; // For organization-level subscriptions
  planId: string;
  status: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SubscriptionRepository {
  async initialize() {
    const db = getDatabaseConnection();

    // Create table for new installs
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        organization_id UUID,
        plan_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Backward-compatible schema upgrades (older migrations created user_id NOT NULL UNIQUE and no organization_id)
    await db.query(`ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS organization_id UUID`);
    await db.query(`ALTER TABLE subscriptions ALTER COLUMN user_id DROP NOT NULL`);

    // Drop legacy unique constraint on user_id if present (name varies by migration)
    await db.query(`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key`);

    // Enforce exactly one owner (user OR organization)
    await db.query(`ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS check_subscription_owner`);
    await db.query(`
      ALTER TABLE subscriptions
      ADD CONSTRAINT check_subscription_owner CHECK (
        (user_id IS NOT NULL AND organization_id IS NULL) OR
        (user_id IS NULL AND organization_id IS NOT NULL)
      )
    `);

    // Uniqueness per owner
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_subscriptions_user_id
      ON subscriptions(user_id)
      WHERE user_id IS NOT NULL
    `);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_subscriptions_organization_id
      ON subscriptions(organization_id)
      WHERE organization_id IS NOT NULL
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)`);
  }

  async create(data: {
    id: string;
    userId?: string;
    organizationId?: string;
    planId: string;
    status: string;
    startDate: Date;
    endDate: Date;
  }): Promise<Subscription> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO subscriptions (id, user_id, organization_id, plan_id, status, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.id,
        data.userId || null,
        data.organizationId || null,
        data.planId,
        data.status,
        data.startDate,
        data.endDate,
      ],
    );
    return this.mapRowToSubscription(result.rows[0]);
  }

  async findByOrganizationId(organizationId: string): Promise<Subscription | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM subscriptions WHERE organization_id = $1', [
      organizationId,
    ]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToSubscription(result.rows[0]);
  }

  async findByUserId(userId: string): Promise<Subscription | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToSubscription(result.rows[0]);
  }

  async updateStatus(userId: string, status: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      'UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE user_id = $2',
      [status, userId],
    );
  }

  private mapRowToSubscription(row: any): Subscription {
    return {
      id: row.id,
      userId: row.user_id,
      organizationId: row.organization_id,
      planId: row.plan_id,
      status: row.status,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
