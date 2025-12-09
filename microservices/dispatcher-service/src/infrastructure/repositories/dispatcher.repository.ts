import { Injectable } from '@nestjs/common';
import { getDatabaseConnection } from '../../../../shared/libs/database';

export interface Dispatcher {
  id: string;
  userId: string;
  name: string;
  available: boolean;
  activeCalls: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DispatcherRepository {
  async initialize() {
    const db = getDatabaseConnection();

    await db.query(`
      CREATE TABLE IF NOT EXISTS dispatchers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        available BOOLEAN DEFAULT TRUE,
        active_calls INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_dispatchers_available ON dispatchers(available)
    `);
  }

  async findAvailable(): Promise<Dispatcher | null> {
    const db = getDatabaseConnection();
    const result = await db.query(
      'SELECT * FROM dispatchers WHERE available = TRUE ORDER BY active_calls ASC LIMIT 1',
    );
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToDispatcher(result.rows[0]);
  }

  async updateAvailability(dispatcherId: string, available: boolean): Promise<void> {
    const db = getDatabaseConnection();
    await db.query(
      'UPDATE dispatchers SET available = $1, updated_at = NOW() WHERE id = $2',
      [available, dispatcherId],
    );
  }

  private mapRowToDispatcher(row: any): Dispatcher {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      available: row.available,
      activeCalls: row.active_calls,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

