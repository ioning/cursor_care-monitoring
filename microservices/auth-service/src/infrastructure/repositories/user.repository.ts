import { Injectable } from '@nestjs/common';
import { createDatabaseConnection, getDatabaseConnection } from '../../../../shared/libs/database';
import { UserRole } from '../../../../shared/types/common.types';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  organizationId?: string; // ID организации (tenant)
  status: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

@Injectable()
export class UserRepository {
  async initialize() {
    const db = createDatabaseConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'auth_db',
      user: process.env.DB_USER || 'cms_user',
      password: process.env.DB_PASSWORD || 'cms_password',
    });

    // Create users table if not exists
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        full_name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL CHECK (role IN ('guardian', 'ward', 'dispatcher', 'admin', 'organization_admin')),
        organization_id UUID, -- Связь с организацией
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        email_verified BOOLEAN DEFAULT FALSE,
        phone_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        last_login_at TIMESTAMPTZ,
        UNIQUE(email, organization_id) -- Email уникален в рамках организации
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email_organization ON users(email, organization_id)
    `);
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    organizationId?: string;
  }): Promise<User> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, phone, role, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.email,
        data.passwordHash,
        data.fullName,
        data.phone || null,
        data.role,
        data.organizationId || null,
      ],
    );
    return this.mapRowToUser(result.rows[0]);
  }

  async findByEmail(email: string, organizationId?: string): Promise<User | null> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM users WHERE email = $1';
    const params: any[] = [email];

    if (organizationId) {
      query += ' AND organization_id = $2';
      params.push(organizationId);
    } else {
      query += ' AND organization_id IS NULL';
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToUser(result.rows[0]);
  }

  async findById(id: string): Promise<User | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToUser(result.rows[0]);
  }

  async updateLastLogin(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }

  async setEmailVerified(email: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE email = $1',
      [email]
    );
  }

  async setEmailVerifiedById(userId: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      'UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      phone: row.phone,
      role: row.role,
      organizationId: row.organization_id,
      status: row.status,
      emailVerified: row.email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }
}
