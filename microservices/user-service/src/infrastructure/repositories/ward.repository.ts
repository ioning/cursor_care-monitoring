import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Ward {
  id: string;
  fullName: string;
  dateOfBirth?: Date;
  gender?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  avatarUrl?: string;
  organizationId?: string; // Tenant isolation
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WardRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS wards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        date_of_birth DATE,
        gender VARCHAR(20),
        medical_info TEXT,
        emergency_contact TEXT,
        avatar_url TEXT,
        organization_id UUID, -- Tenant isolation (optional in local/dev)
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Backward-compatible schema upgrades (older migrations created wards without organization_id)
    await db.query(`ALTER TABLE wards ADD COLUMN IF NOT EXISTS organization_id UUID`);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wards_status ON wards(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wards_organization_id ON wards(organization_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_wards_organization_status ON wards(organization_id, status)
    `);
  }

  async create(data: {
    id: string;
    fullName: string;
    dateOfBirth?: string;
    gender?: string;
    medicalInfo?: string;
    emergencyContact?: string;
    organizationId?: string; // Optional in local/dev
  }): Promise<Ward> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO wards (id, full_name, date_of_birth, gender, medical_info, emergency_contact, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.id,
        data.fullName,
        data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        data.gender || null,
        data.medicalInfo || null,
        data.emergencyContact || null,
        data.organizationId || null,
      ],
    );
    return this.mapRowToWard(result.rows[0]);
  }

  async findById(id: string, organizationId?: string): Promise<Ward | null> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM wards WHERE id = $1';
    const params: any[] = [id];

    if (organizationId) {
      query += ' AND organization_id = $2';
      params.push(organizationId);
    }

    const result = await db.query(query, params);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToWard(result.rows[0]);
  }

  async findByOrganization(organizationId: string, filters?: { status?: string }): Promise<Ward[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM wards WHERE organization_id = $1';
    const params: any[] = [organizationId];

    if (filters?.status) {
      query += ' AND status = $2';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToWard(row));
  }

  async update(id: string, data: Partial<Ward>, organizationId?: string): Promise<Ward> {
    const db = getDatabaseConnection();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(data.fullName);
    }
    if (data.dateOfBirth !== undefined) {
      updates.push(`date_of_birth = $${paramIndex++}`);
      values.push(data.dateOfBirth);
    }
    if (data.gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`);
      values.push(data.gender);
    }
    if (data.medicalInfo !== undefined) {
      updates.push(`medical_info = $${paramIndex++}`);
      values.push(data.medicalInfo);
    }
    if (data.emergencyContact !== undefined) {
      updates.push(`emergency_contact = $${paramIndex++}`);
      values.push(data.emergencyContact);
    }
    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      values.push(data.avatarUrl);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    let query = `UPDATE wards SET ${updates.join(', ')} WHERE id = $${paramIndex}`;
    if (organizationId) {
      paramIndex++;
      query += ` AND organization_id = $${paramIndex}`;
      values.push(organizationId);
    }

    await db.query(query, values);

    const updated = await this.findById(id, organizationId);
    if (!updated) {
      throw new Error('Ward not found after update');
    }
    return updated;
  }

  async delete(id: string, organizationId?: string): Promise<void> {
    const db = getDatabaseConnection();
    if (organizationId) {
      await db.query('UPDATE wards SET status = $1 WHERE id = $2 AND organization_id = $3', [
        'archived',
        id,
        organizationId,
      ]);
    } else {
      await db.query('UPDATE wards SET status = $1 WHERE id = $2', ['archived', id]);
    }
  }

  private mapRowToWard(row: any): Ward {
    return {
      id: row.id,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      medicalInfo: row.medical_info,
      emergencyContact: row.emergency_contact,
      avatarUrl: row.avatar_url,
      organizationId: row.organization_id,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}


