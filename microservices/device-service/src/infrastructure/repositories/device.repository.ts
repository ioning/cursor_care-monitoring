import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../../shared/libs/database';

export interface Device {
  id: string;
  userId: string;
  wardId?: string;
  name: string;
  deviceType: string;
  apiKey: string;
  firmwareVersion?: string;
  macAddress?: string;
  serialNumber?: string;
  status: string;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DeviceRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        ward_id UUID,
        name VARCHAR(255) NOT NULL,
        device_type VARCHAR(50) NOT NULL,
        api_key VARCHAR(255) UNIQUE NOT NULL,
        firmware_version VARCHAR(50),
        mac_address VARCHAR(17),
        serial_number VARCHAR(100),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
        last_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_devices_user_id ON devices(user_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_devices_ward_id ON devices(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_devices_api_key ON devices(api_key)
    `);
  }

  async create(data: {
    id: string;
    userId: string;
    apiKey: string;
    name: string;
    deviceType: string;
    firmwareVersion?: string;
    macAddress?: string;
    serialNumber?: string;
  }): Promise<Device> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO devices (id, user_id, name, device_type, api_key, firmware_version, mac_address, serial_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.id,
        data.userId,
        data.name,
        data.deviceType,
        data.apiKey,
        data.firmwareVersion || null,
        data.macAddress || null,
        data.serialNumber || null,
      ],
    );
    return this.mapRowToDevice(result.rows[0]);
  }

  async findById(id: string): Promise<Device | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM devices WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToDevice(result.rows[0]);
  }

  async findByApiKey(apiKey: string): Promise<Device | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM devices WHERE api_key = $1', [apiKey]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToDevice(result.rows[0]);
  }

  async findByUserId(userId: string, wardId?: string): Promise<Device[]> {
    const db = getDatabaseConnection();
    let query = 'SELECT * FROM devices WHERE user_id = $1';
    const params: any[] = [userId];

    if (wardId) {
      query += ' AND ward_id = $2';
      params.push(wardId);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.query(query, params);
    return result.rows.map((row) => this.mapRowToDevice(row));
  }

  async update(id: string, data: Partial<Device>): Promise<Device> {
    const db = getDatabaseConnection();
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.firmwareVersion !== undefined) {
      updates.push(`firmware_version = $${paramIndex++}`);
      values.push(data.firmwareVersion);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    await db.query(
      `UPDATE devices SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Device not found after update');
    }
    return updated;
  }

  async linkToWard(deviceId: string, wardId: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('UPDATE devices SET ward_id = $1, updated_at = NOW() WHERE id = $2', [
      wardId,
      deviceId,
    ]);
  }

  async unlinkFromWard(deviceId: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('UPDATE devices SET ward_id = NULL, updated_at = NOW() WHERE id = $1', [
      deviceId,
    ]);
  }

  async updateLastSeen(deviceId: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('UPDATE devices SET last_seen_at = NOW() WHERE id = $1', [deviceId]);
  }

  async delete(id: string): Promise<void> {
    const db = getDatabaseConnection();
    await db.query('UPDATE devices SET status = $1 WHERE id = $2', ['inactive', id]);
  }

  private mapRowToDevice(row: any): Device {
    return {
      id: row.id,
      userId: row.user_id,
      wardId: row.ward_id,
      name: row.name,
      deviceType: row.device_type,
      apiKey: row.api_key,
      firmwareVersion: row.firmware_version,
      macAddress: row.mac_address,
      serialNumber: row.serial_number,
      status: row.status,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

