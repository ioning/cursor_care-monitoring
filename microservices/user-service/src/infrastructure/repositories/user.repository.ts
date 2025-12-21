import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  organizationId?: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UserRepository {
  async initialize() {
    const db = getDatabaseConnection();

    // Create table (new installs)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(50) NOT NULL,
        organization_id UUID,
        status VARCHAR(20) DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Backward-compatible schema upgrades (older migrations may have created users without organization_id)
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID`);

    // Ensure uniqueness semantics for both legacy (no org) and multi-tenancy
    // - Legacy users: unique email when organization_id IS NULL
    // - Tenant users: unique (email, organization_id) when organization_id IS NOT NULL
    await db.query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key`);
    await db.query(`DROP INDEX IF EXISTS idx_users_email_organization`);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_null_org
      ON users(email)
      WHERE organization_id IS NULL
    `);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_organization
      ON users(email, organization_id)
      WHERE organization_id IS NOT NULL
    `);

    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)`);
  }

  async findById(id: string, organizationId?: string): Promise<User | null> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM users WHERE id = $1';
    const params: any[] = [id];

    if (organizationId) {
      query += ' AND organization_id = $2';
      params.push(organizationId);
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToUser(result.rows[0]);
  }

  async findByOrganization(organizationId: string, filters?: { role?: string }): Promise<User[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM users WHERE organization_id = $1';
    const params: any[] = [organizationId];

    if (filters?.role) {
      query += ' AND role = $2';
      params.push(filters.role);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToUser(row));
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const db = getDatabaseConnection();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(data.fullName);
    }
    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(data.phone);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('User not found after update');
    }
    return updated;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role,
      organizationId: row.organization_id,
      status: row.status,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}


