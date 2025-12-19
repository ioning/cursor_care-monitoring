import { Pool } from 'pg';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createLogger } from '../logger';

export interface MigrationConfig {
  database: string;
  host: string;
  port: number;
  user: string;
  password: string;
  migrationsPath: string;
}

export class MigrationRunner {
  private db: Pool;
  private logger = createLogger({ serviceName: 'migration-runner' });

  constructor(private config: MigrationConfig) {
    this.db = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    });
  }

  async initialize() {
    await this.db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  async runMigrations() {
    await this.initialize();

    const migrations = this.getMigrations();
    const executedMigrations = await this.getExecutedMigrations();

    for (const migration of migrations) {
      if (executedMigrations.includes(migration.name)) {
        this.logger.info(`Migration already executed: ${migration.name}`);
        continue;
      }

      this.logger.info(`Running migration: ${migration.name}`);
      await this.executeMigration(migration);
      await this.recordMigration(migration.name);
    }

    this.logger.info('All migrations completed');
  }

  async rollbackLast() {
    const executedMigrations = await this.getExecutedMigrations();
    if (executedMigrations.length === 0) {
      this.logger.warn('No migrations to rollback');
      return;
    }

    const lastMigration = executedMigrations[executedMigrations.length - 1];
    const migrations = this.getMigrations();
    const migration = migrations.find((m) => m.name === lastMigration);

    if (!migration) {
      throw new Error(`Migration file not found: ${lastMigration}`);
    }

    if (!migration.down) {
      throw new Error(`Rollback not supported for: ${lastMigration}`);
    }

    this.logger.info(`Rolling back migration: ${lastMigration}`);
    await this.executeMigration(migration, true);
    await this.removeMigrationRecord(lastMigration);
  }

  private getMigrations() {
    if (!existsSync(this.config.migrationsPath)) {
      this.logger.warn(`Migrations path does not exist: ${this.config.migrationsPath}`);
      return [];
    }

    const files = readdirSync(this.config.migrationsPath)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    return files.map((file) => {
      const content = readFileSync(join(this.config.migrationsPath, file), 'utf-8');
      const [up, down] = this.parseMigration(content);
      return {
        name: file,
        up,
        down,
      };
    });
  }

  private parseMigration(content: string): [string, string | null] {
    const upMarker = '-- UP';
    const downMarker = '-- DOWN';

    const upIndex = content.indexOf(upMarker);
    const downIndex = content.indexOf(downMarker);

    if (upIndex === -1) {
      throw new Error('Migration must contain -- UP marker');
    }

    const up = downIndex !== -1
      ? content.substring(upIndex + upMarker.length, downIndex).trim()
      : content.substring(upIndex + upMarker.length).trim();

    const down = downIndex !== -1
      ? content.substring(downIndex + downMarker.length).trim()
      : null;

    return [up, down];
  }

  private async executeMigration(migration: { up: string; down?: string | null }, isRollback = false) {
    const sql = isRollback ? migration.down : migration.up;
    if (!sql) {
      throw new Error('Migration SQL is empty');
    }

    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async getExecutedMigrations(): Promise<string[]> {
    const result = await this.db.query('SELECT name FROM migrations ORDER BY executed_at');
    return result.rows.map((row) => row.name);
  }

  private async recordMigration(name: string) {
    await this.db.query('INSERT INTO migrations (name) VALUES ($1)', [name]);
  }

  private async removeMigrationRecord(name: string) {
    await this.db.query('DELETE FROM migrations WHERE name = $1', [name]);
  }

  async close() {
    await this.db.end();
  }
}

