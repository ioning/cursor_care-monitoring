import { Injectable } from '@nestjs/common';
import { createDatabaseConnection, getDatabaseConnection } from '@care-monitoring/shared/libs/database';
import { UserRole } from '@care-monitoring/shared/types/common.types';

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
    // IMPORTANT:
    // On Windows it's common to have global DB_* environment variables set (e.g. DB_USER=postgres),
    // which breaks local docker-compose defaults (cms_user/cms_password). For auth-service we prefer
    // service-scoped variables first, then safe defaults.
    const db = createDatabaseConnection({
      host: process.env.AUTH_DB_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.AUTH_DB_PORT || process.env.DB_PORT || '5432'),
      database: process.env.AUTH_DB_NAME || process.env.DB_NAME || 'auth_db',
      user: process.env.AUTH_DB_USER || 'cms_user',
      password: process.env.AUTH_DB_PASSWORD || 'cms_password',
      application_name: 'auth-service',
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
    id?: string; // Опциональный ID (для внутреннего создания)
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    role: UserRole;
    organizationId?: string;
    emailVerified?: boolean;
  }): Promise<User> {
    const db = getDatabaseConnection();
    
    // Если ID указан, используем его, иначе генерируем автоматически
    if (data.id) {
      const result = await db.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, organization_id, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.id,
          data.email,
          data.passwordHash,
          data.fullName,
          data.phone || null,
          data.role,
          data.organizationId || null,
          data.emailVerified !== undefined ? data.emailVerified : false,
        ],
      );
      return this.mapRowToUser(result.rows[0]);
    } else {
      const result = await db.query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, organization_id, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          data.email,
          data.passwordHash,
          data.fullName,
          data.phone || null,
          data.role,
          data.organizationId || null,
          data.emailVerified !== undefined ? data.emailVerified : false,
        ],
      );
      return this.mapRowToUser(result.rows[0]);
    }
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
