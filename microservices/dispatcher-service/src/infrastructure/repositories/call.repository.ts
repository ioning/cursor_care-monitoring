import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';
import { CallPriority, CallStatus } from '../../../../shared/types/common.types';

export interface EmergencyCall {
  id: string;
  wardId: string;
  callType: string;
  priority: CallPriority;
  status: CallStatus;
  dispatcherId?: string;
  source: string;
  healthSnapshot?: Record<string, any>;
  locationSnapshot?: Record<string, any>;
  aiAnalysis?: Record<string, any>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedAt?: Date;
  resolvedAt?: Date;
}

@Injectable()
export class CallRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS emergency_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ward_id UUID NOT NULL,
        call_type VARCHAR(50) NOT NULL,
        priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'assigned', 'in_progress', 'resolved', 'canceled')),
        dispatcher_id UUID,
        source VARCHAR(50) NOT NULL,
        health_snapshot JSONB,
        location_snapshot JSONB,
        ai_analysis JSONB,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        assigned_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ
      )
    `);

    // Базовые индексы
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_ward_id ON emergency_calls(ward_id)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_status ON emergency_calls(status)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_priority ON emergency_calls(priority)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_dispatcher_id ON emergency_calls(dispatcher_id)
    `);

    // Составные индексы для частых запросов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_status_priority_created 
      ON emergency_calls(status, priority, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_dispatcher_status 
      ON emergency_calls(dispatcher_id, status, created_at DESC)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_ward_status_created 
      ON emergency_calls(ward_id, status, created_at DESC)
    `);

    // GIN индексы для JSONB полей
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_health_snapshot_gin 
      ON emergency_calls USING GIN (health_snapshot)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_location_snapshot_gin 
      ON emergency_calls USING GIN (location_snapshot)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_ai_analysis_gin 
      ON emergency_calls USING GIN (ai_analysis)
    `);

    // Частичный индекс для активных вызовов
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_calls_active_priority 
      ON emergency_calls(priority, created_at DESC) 
      WHERE status IN ('created', 'assigned', 'in_progress')
    `);
  }

  async create(data: {
    id: string;
    wardId: string;
    callType: string;
    priority: CallPriority;
    status: CallStatus;
    source: string;
    healthSnapshot?: Record<string, any>;
    locationSnapshot?: Record<string, any>;
    aiAnalysis?: Record<string, any>;
  }): Promise<EmergencyCall> {
    const db = getDatabaseConnection();
    const result = await db.query(
      `INSERT INTO emergency_calls (id, ward_id, call_type, priority, status, source, health_snapshot, location_snapshot, ai_analysis)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.id,
        data.wardId,
        data.callType,
        data.priority,
        data.status,
        data.source,
        data.healthSnapshot ? JSON.stringify(data.healthSnapshot) : null,
        data.locationSnapshot ? JSON.stringify(data.locationSnapshot) : null,
        data.aiAnalysis ? JSON.stringify(data.aiAnalysis) : null,
      ],
    );
    return this.mapRowToCall(result.rows[0]);
  }

  async findById(id: string): Promise<EmergencyCall | null> {
    const db = getDatabaseConnection();
    const result = await db.query('SELECT * FROM emergency_calls WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToCall(result.rows[0]);
  }

  async findByFilters(
    filters: { status?: string; priority?: string; dispatcherId?: string },
    pagination: { page: number; limit: number },
  ): Promise<[EmergencyCall[], number]> {
    const db = getDatabaseConnection();
    const { status, priority, dispatcherId } = filters;
    const { page, limit } = pagination;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    if (priority) {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }

    if (dispatcherId) {
      conditions.push(`dispatcher_id = $${paramIndex++}`);
      params.push(dispatcherId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const dataResult = await db.query(
      `SELECT * FROM emergency_calls ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset],
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM emergency_calls ${whereClause}`,
      params,
    );

    return [
      dataResult.rows.map((row) => this.mapRowToCall(row)),
      parseInt(countResult.rows[0].total),
    ];
  }

  async updateStatus(
    id: string,
    status: CallStatus,
    dispatcherId?: string,
    notes?: string,
  ): Promise<void> {
    const db = getDatabaseConnection();
    const updates: string[] = [`status = $1`, `updated_at = NOW()`];
    const values: any[] = [status];

    let paramIndex = 2;

    if (dispatcherId) {
      updates.push(`dispatcher_id = $${paramIndex++}`);
      updates.push(`assigned_at = NOW()`);
      values.push(dispatcherId);
    }

    if (notes) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (status === 'resolved') {
      updates.push(`resolved_at = NOW()`);
    }

    values.push(id);

    await db.query(
      `UPDATE emergency_calls SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
  }

  private mapRowToCall(row: any): EmergencyCall {
    return {
      id: row.id,
      wardId: row.ward_id,
      callType: row.call_type,
      priority: row.priority,
      status: row.status,
      dispatcherId: row.dispatcher_id,
      source: row.source,
      healthSnapshot: row.health_snapshot,
      locationSnapshot: row.location_snapshot,
      aiAnalysis: row.ai_analysis,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignedAt: row.assigned_at,
      resolvedAt: row.resolved_at,
    };
  }
}



    if (notes) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (status === 'resolved') {
      updates.push(`resolved_at = NOW()`);
    }

    values.push(id);

    await db.query(
      `UPDATE emergency_calls SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
  }

  private mapRowToCall(row: any): EmergencyCall {
    return {
      id: row.id,
      wardId: row.ward_id,
      callType: row.call_type,
      priority: row.priority,
      status: row.status,
      dispatcherId: row.dispatcher_id,
      source: row.source,
      healthSnapshot: row.health_snapshot,
      locationSnapshot: row.location_snapshot,
      aiAnalysis: row.ai_analysis,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignedAt: row.assigned_at,
      resolvedAt: row.resolved_at,
    };
  }
}



    if (notes) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }

    if (status === 'resolved') {
      updates.push(`resolved_at = NOW()`);
    }

    values.push(id);

    await db.query(
      `UPDATE emergency_calls SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values,
    );
  }

  private mapRowToCall(row: any): EmergencyCall {
    return {
      id: row.id,
      wardId: row.ward_id,
      callType: row.call_type,
      priority: row.priority,
      status: row.status,
      dispatcherId: row.dispatcher_id,
      source: row.source,
      healthSnapshot: row.health_snapshot,
      locationSnapshot: row.location_snapshot,
      aiAnalysis: row.ai_analysis,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignedAt: row.assigned_at,
      resolvedAt: row.resolved_at,
    };
  }
}

