import { createDatabaseConnection } from '../../shared/libs/database';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Migration Rollback Tests', () => {
  let db: any;

  beforeAll(async () => {
    db = createDatabaseConnection({
      host: process.env.TEST_DB_HOST || 'localhost',
      port: parseInt(process.env.TEST_DB_PORT || '5432'),
      database: process.env.TEST_DB_NAME || 'test_db',
      user: process.env.TEST_DB_USER || 'cms_user',
      password: process.env.TEST_DB_PASSWORD || 'cms_password',
    });
  });

  afterAll(async () => {
    if (db) {
      await db.end();
    }
  });

  describe('Auth Service Migrations', () => {
    it('should rollback 002_add_organization_id_to_users migration', async () => {
      // Apply migration
      const migrationPath = join(__dirname, '../../database/migrations/auth/002_add_organization_id_to_users.sql');
      const migration = readFileSync(migrationPath, 'utf-8');
      
      // Extract UP section
      const upSection = migration.split('-- DOWN Migration')[0];
      const upStatements = upSection
        .split('-- UP Migration')[1]
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('--'))
        .join('\n');

      // Apply UP
      await db.query(upStatements);

      // Verify column exists
      const checkColumn = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
      `);
      expect(checkColumn.rows.length).toBe(1);

      // Extract DOWN section
      const downSection = migration.split('-- DOWN Migration')[1];
      const downStatements = downSection
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('--'))
        .join('\n');

      // Apply DOWN (rollback)
      await db.query(downStatements);

      // Verify column is removed
      const checkColumnAfter = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'organization_id'
      `);
      expect(checkColumnAfter.rows.length).toBe(0);
    });
  });

  describe('Migration Format Validation', () => {
    it('should validate migration file format', () => {
      const migrationPath = join(__dirname, '../../database/migrations/auth/002_add_organization_id_to_users.sql');
      const migration = readFileSync(migrationPath, 'utf-8');

      // Check for UP section
      expect(migration).toContain('-- UP');
      expect(migration).toContain('-- DOWN');

      // Check no duplicate UP sections
      const upCount = (migration.match(/-- UP/g) || []).length;
      expect(upCount).toBeLessThanOrEqual(1);
    });
  });
});

