import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Geofence {
  id: string;
  wardId: string;
  name: string;
  type: string;
  shape: 'circle' | 'polygon';
  centerLatitude: number | null;
  centerLongitude: number | null;
  radius: number | null;
  polygonPoints?: Array<{ latitude: number; longitude: number }> | null;
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
        shape VARCHAR(20) NOT NULL DEFAULT 'circle' CHECK (shape IN ('circle', 'polygon')),
        center_latitude DECIMAL(10, 8),
        center_longitude DECIMAL(11, 8),
        radius DECIMAL(10, 2),
        polygon_points JSONB,
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
    shape: 'circle' | 'polygon';
    centerLatitude?: number | null;
    centerLongitude?: number | null;
    radius?: number | null;
    polygonPoints?: Array<{ latitude: number; longitude: number }> | null;
    enabled: boolean;
  }): Promise<Geofence> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO geofences (id, ward_id, name, type, shape, center_latitude, center_longitude, radius, polygon_points, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.id,
        data.wardId,
        data.name,
        data.type,
        data.shape,
        data.centerLatitude ?? null,
        data.centerLongitude ?? null,
        data.radius ?? null,
        data.polygonPoints ? JSON.stringify(data.polygonPoints) : null,
        data.enabled,
      ],
    );
    return this.mapRowToGeofence(result.rows[0]);
  }

  async findByWardId(wardId: string, options?: { enabled?: boolean }): Promise<Geofence[]> {
    const db = getDatabaseConnection();
    const enabledClause =
      options?.enabled === undefined ? '' : ' AND enabled = $2';
    const params = options?.enabled === undefined ? [wardId] : [wardId, options.enabled];

    const result = await db.query(`SELECT * FROM geofences WHERE ward_id = $1${enabledClause}`, params);
    return result.rows.map((row: any) => this.mapRowToGeofence(row));
  }

  async update(
    geofenceId: string,
    patch: Partial<{
      name: string;
      enabled: boolean;
      type: string;
      shape: 'circle' | 'polygon';
      centerLatitude: number | null;
      centerLongitude: number | null;
      radius: number | null;
      polygonPoints: Array<{ latitude: number; longitude: number }> | null;
    }>,
  ): Promise<Geofence | null> {
    const db = getDatabaseConnection();

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;

    const add = (sql: string, value: any) => {
      sets.push(sql.replace('$i', `$${i}`));
      values.push(value);
      i += 1;
    };

    if (patch.name !== undefined) add(`name = $i`, patch.name);
    if (patch.enabled !== undefined) add(`enabled = $i`, patch.enabled);
    if (patch.type !== undefined) add(`type = $i`, patch.type);
    if (patch.shape !== undefined) add(`shape = $i`, patch.shape);
    if (patch.centerLatitude !== undefined) add(`center_latitude = $i`, patch.centerLatitude);
    if (patch.centerLongitude !== undefined) add(`center_longitude = $i`, patch.centerLongitude);
    if (patch.radius !== undefined) add(`radius = $i`, patch.radius);
    if (patch.polygonPoints !== undefined)
      add(`polygon_points = $i`, patch.polygonPoints ? JSON.stringify(patch.polygonPoints) : null);

    if (sets.length === 0) {
      const current = await db.query('SELECT * FROM geofences WHERE id = $1', [geofenceId]);
      return current.rows[0] ? this.mapRowToGeofence(current.rows[0]) : null;
    }

    values.push(geofenceId);

    const result = await db.query(
      `UPDATE geofences SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      values,
    );

    return result.rows[0] ? this.mapRowToGeofence(result.rows[0]) : null;
  }

  async delete(geofenceId: string): Promise<boolean> {
    const db = getDatabaseConnection();
    const result = await db.query('DELETE FROM geofences WHERE id = $1', [geofenceId]);
    return result.rowCount > 0;
  }

  private mapRowToGeofence(row: any): Geofence {
    return {
      id: row.id,
      wardId: row.ward_id,
      name: row.name,
      type: row.type,
      shape: row.shape || 'circle',
      centerLatitude: row.center_latitude !== null ? parseFloat(row.center_latitude) : null,
      centerLongitude: row.center_longitude !== null ? parseFloat(row.center_longitude) : null,
      radius: row.radius !== null ? parseFloat(row.radius) : null,
      polygonPoints: row.polygon_points ?? null,
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

