import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Geofence {
  id: string;
  wardId: string;
  name: string;
  type: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GeofenceRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS geofences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('safe_zone', 'restricted_zone')),
        center_latitude DECIMAL(10, 8) NOT NULL,
        center_longitude DECIMAL(11, 8) NOT NULL,
        radius DECIMAL(10, 2) NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_geofences_ward_id ON geofences(ward_id)
    `);
  }

  async create(data: {
    id: string;
    wardId: string;
    name: string;
    type: string;
    centerLatitude: number;
    centerLongitude: number;
    radius: number;
    enabled: boolean;
  }): Promise<Geofence> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO geofences (id, ward_id, name, type, center_latitude, center_longitude, radius, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.id,
        data.wardId,
        data.name,
        data.type,
        data.centerLatitude,
        data.centerLongitude,
        data.radius,
        data.enabled,
      ],
    );
    return this.mapRowToGeofence(result.rows[0]);
  }

  async findByWardId(wardId: string): Promise<Geofence[]> {
    const db = getDatabaseConnection();
    const result = await db.query(
      'SELECT * FROM geofences WHERE ward_id = $1 AND enabled = TRUE',
      [wardId],
    );
    return result.rows.map((row: any) => this.mapRowToGeofence(row));
  }

  private mapRowToGeofence(row: any): Geofence {
    return {
      id: row.id,
      wardId: row.ward_id,
      name: row.name,
      type: row.type,
      centerLatitude: parseFloat(row.center_latitude),
      centerLongitude: parseFloat(row.center_longitude),
      radius: parseFloat(row.radius),
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

