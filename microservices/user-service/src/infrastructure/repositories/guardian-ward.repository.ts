import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface GuardianWard {
  id: string;
  guardianId: string;
  wardId: string;
  relationship: string;
  isPrimary?: boolean;
  relationshipType?: 'ward' | 'spouse' | 'child' | 'parent' | 'sibling' | 'relative' | 'friend' | 'caregiver' | 'doctor' | 'other';
  accessLevel?: 'full' | 'limited' | 'view_only';
  notificationPreferences?: any;
  dutySchedule?: any;
  canManageOtherGuardians?: boolean;
  temporaryPrimaryGuardian?: boolean;
  temporaryPeriodStart?: Date;
  temporaryPeriodEnd?: Date;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
}

@Injectable()
export class GuardianWardRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS guardian_wards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        guardian_id UUID NOT NULL,
        ward_id UUID NOT NULL,
        relationship VARCHAR(50) DEFAULT 'ward',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(guardian_id, ward_id)
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_guardian_wards_guardian ON guardian_wards(guardian_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_guardian_wards_ward ON guardian_wards(ward_id)
    `);
  }

  async create(data: {
    guardianId: string;
    wardId: string;
    relationship?: string;
  }): Promise<GuardianWard> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO guardian_wards (guardian_id, ward_id, relationship)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.guardianId, data.wardId, data.relationship || 'ward'],
    );
    return this.mapRowToGuardianWard(result.rows[0]);
  }

  async findWardsByGuardianId(guardianId: string): Promise<any[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT w.*, gw.relationship, gw.relationship_type, gw.is_primary, gw.access_level,
              gw.notification_preferences, gw.duty_schedule, gw.created_at as linked_at
       FROM guardian_wards gw
       JOIN wards w ON w.id = gw.ward_id
       WHERE gw.guardian_id = $1 AND w.status = 'active'
       ORDER BY gw.is_primary DESC NULLS LAST, gw.created_at DESC`,
      [guardianId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      medicalInfo: row.medical_info,
      emergencyContact: row.emergency_contact,
      relationship: row.relationship,
      relationshipType: row.relationship_type,
      isPrimary: row.is_primary,
      accessLevel: row.access_level,
      notificationPreferences: row.notification_preferences,
      dutySchedule: row.duty_schedule,
      linkedAt: row.linked_at,
    }));
  }

  async findGuardiansByWardId(wardId: string): Promise<any[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `SELECT gw.*, u.full_name, u.email, u.phone
       FROM guardian_wards gw
       JOIN users u ON u.id = gw.guardian_id
       WHERE gw.ward_id = $1
       ORDER BY gw.is_primary DESC NULLS LAST, gw.created_at ASC`,
      [wardId],
    );
    return result.rows.map((row) => ({
      id: row.id,
      guardianId: row.guardian_id,
      wardId: row.ward_id,
      relationship: row.relationship,
      relationshipType: row.relationship_type,
      isPrimary: row.is_primary,
      accessLevel: row.access_level,
      notificationPreferences: row.notification_preferences,
      dutySchedule: row.duty_schedule,
      canManageOtherGuardians: row.can_manage_other_guardians,
      temporaryPrimaryGuardian: row.temporary_primary_guardian,
      temporaryPeriodStart: row.temporary_period_start,
      temporaryPeriodEnd: row.temporary_period_end,
      status: row.status,
      guardianName: row.full_name,
      guardianEmail: row.email,
      guardianPhone: row.phone,
      createdAt: row.created_at,
    }));
  }

  async update(id: string, updates: Partial<GuardianWard>): Promise<GuardianWard> {
    const db = getDatabaseConnection();
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    (Object.keys(updates) as (keyof GuardianWard)[]).forEach((key) => {
      if (key !== 'id' && updates[key] !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        if (key === 'notificationPreferences' || key === 'dutySchedule') {
          fields.push(`${dbKey} = $${paramIndex}::jsonb`);
          values.push(JSON.stringify(updates[key] as any));
        } else {
          fields.push(`${dbKey} = $${paramIndex}`);
          values.push(updates[key] as any);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const result = await db.query(
      `UPDATE guardian_wards 
       SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} 
       RETURNING *`,
      values,
    );

    return this.mapRowToGuardianWard(result.rows[0]);
  }

  async hasAccess(guardianId: string, wardId: string): Promise<boolean> {
    const db = getDatabaseConnection();
    // Проверяем наличие активной связи опекун-подопечный
    const result = await db.query(
      `SELECT 1 FROM guardian_wards 
       WHERE guardian_id = $1 AND ward_id = $2 
       AND (status IS NULL OR status = 'active')`,
      [guardianId, wardId],
    );
    return result.rows.length > 0;
  }

  async findByGuardianAndWard(guardianId: string, wardId: string): Promise<GuardianWard | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      'SELECT * FROM guardian_wards WHERE guardian_id = $1 AND ward_id = $2',
      [guardianId, wardId],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToGuardianWard(result.rows[0]);
  }

  async deleteByWardId(wardId: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('DELETE FROM guardian_wards WHERE ward_id = $1', [wardId]);
  }

  private mapRowToGuardianWard(row: any): GuardianWard {
    return {
      id: row.id,
      guardianId: row.guardian_id,
      wardId: row.ward_id,
      relationship: row.relationship,
      isPrimary: row.is_primary,
      relationshipType: row.relationship_type,
      accessLevel: row.access_level,
      notificationPreferences: row.notification_preferences,
      dutySchedule: row.duty_schedule,
      canManageOtherGuardians: row.can_manage_other_guardians,
      temporaryPrimaryGuardian: row.temporary_primary_guardian,
      temporaryPeriodStart: row.temporary_period_start,
      temporaryPeriodEnd: row.temporary_period_end,
      status: row.status,
      createdAt: row.created_at,
    };
  }
}

