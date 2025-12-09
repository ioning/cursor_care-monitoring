import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface Location {
  id: string;
  wardId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source: string;
  timestamp: Date;
  organizationId?: string;
  createdAt: Date;
}

@Injectable()
export class LocationRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        accuracy DECIMAL(10, 2),
        source VARCHAR(50) NOT NULL,
        organization_id UUID,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_ward_id ON locations(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_timestamp ON locations(timestamp)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_ward_timestamp ON locations(ward_id, timestamp)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_organization_id ON locations(organization_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_locations_ward_organization ON locations(ward_id, organization_id)
    `);
  }

  async create(data: {
    id: string;
    wardId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: string;
    timestamp: Date;
    organizationId?: string;
  }): Promise<Location> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO locations (id, ward_id, latitude, longitude, accuracy, source, timestamp, organization_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.id,
        data.wardId,
        data.latitude,
        data.longitude,
        data.accuracy || null,
        data.source,
        data.timestamp,
        data.organizationId || null,
      ],
    );
    return this.mapRowToLocation(result.rows[0]);
  }

  async findLatest(wardId: string): Promise<Location | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      'SELECT * FROM locations WHERE ward_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [wardId],
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToLocation(result.rows[0]);
  }

  async findByWardId(
    wardId: string,
    filters: { from?: string; to?: string },
    pagination: { page: number; limit: number },
  ): Promise<[Location[], number]> {
    const db = getDatabaseConnection();
    const { from, to } = filters;
    const { page, limit } = pagination;

    const conditions: string[] = ['ward_id = $1'];
    const params: any[] = [wardId];
    let paramIndex = 2;

    if (from) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(new Date(from));
    }

    if (to) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(new Date(to));
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
      `SELECT * FROM locations ${whereClause} ORDER BY timestamp DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM locations ${whereClause}`,
      params,
    );

    return [
      dataResult.rows.map((row) => this.mapRowToLocation(row)),
      parseInt(countResult.rows[0].total),
    ];
  }

  private mapRowToLocation(row: any): Location {
    return {
      id: row.id,
      wardId: row.ward_id,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
      source: row.source,
      timestamp: row.timestamp,
      organizationId: row.organization_id,
      createdAt: row.created_at,
    };
  }
}


      wardId: row.ward_id,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
      source: row.source,
      timestamp: row.timestamp,
      organizationId: row.organization_id,
      createdAt: row.created_at,
    };
  }
}


      wardId: row.ward_id,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      accuracy: row.accuracy ? parseFloat(row.accuracy) : undefined,
      source: row.source,
      timestamp: row.timestamp,
      organizationId: row.organization_id,
      createdAt: row.created_at,
    };
  }
}

