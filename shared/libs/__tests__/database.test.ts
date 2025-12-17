import { createDatabaseConnection, getDatabaseConnection, closeDatabaseConnection, healthCheck } from '../database';

// Mock pg module
jest.mock('pg', () => {
  const mockPool = {
    query: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  };
  return {
    Pool: jest.fn(() => mockPool),
  };
});

describe('Database', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset pool
    (getDatabaseConnection as any).pool = null;
  });

  describe('createDatabaseConnection', () => {
    it('should create a new database connection', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      };

      const pool = createDatabaseConnection(config);

      expect(pool).toBeDefined();
    });

    it('should return existing pool if already created', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      };

      const pool1 = createDatabaseConnection(config);
      const pool2 = createDatabaseConnection(config);

      expect(pool1).toBe(pool2);
    });

    it('should use custom pool configuration', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
        max: 100,
        min: 10,
        idleTimeoutMillis: 120000,
      };

      const pool = createDatabaseConnection(config);

      expect(pool).toBeDefined();
    });
  });

  describe('getDatabaseConnection', () => {
    it('should return existing connection', () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      };

      createDatabaseConnection(config);
      const connection = getDatabaseConnection();

      expect(connection).toBeDefined();
    });

    it('should throw error if connection not created', () => {
      expect(() => getDatabaseConnection()).toThrow('Database connection not initialized');
    });
  });

  describe('closeDatabaseConnection', () => {
    it('should close database connection', async () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      };

      createDatabaseConnection(config);
      const pool = getDatabaseConnection();
      (pool.end as jest.Mock).mockResolvedValue(undefined);

      await closeDatabaseConnection();

      expect(pool.end).toHaveBeenCalled();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connection is active', async () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      };

      createDatabaseConnection(config);
      const pool = getDatabaseConnection();
      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ now: new Date() }] });

      const result = await healthCheck();

      expect(result.healthy).toBe(true);
      expect(result.latency).toBeGreaterThanOrEqual(0);
    });

    it('should return unhealthy status when connection fails', async () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        user: 'test_user',
        password: 'test_password',
      };

      createDatabaseConnection(config);
      const pool = getDatabaseConnection();
      (pool.query as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const result = await healthCheck();

      expect(result.healthy).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

