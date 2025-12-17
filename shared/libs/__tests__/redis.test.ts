import { createRedisConnection, getRedisClient, closeRedisConnection } from '../redis';

// Mock redis
jest.mock('redis', () => {
  const mockClient = {
    connect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  };

  return {
    createClient: jest.fn(() => mockClient),
  };
});

describe('Redis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRedisConnection', () => {
    it('should create Redis connection', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
        password: 'password',
      };

      await createRedisConnection(config);

      const redis = require('redis');
      expect(redis.createClient).toHaveBeenCalled();
    });
  });

  describe('getRedisClient', () => {
    it('should return Redis client', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
      };

      await createRedisConnection(config);
      const client = getRedisClient();

      expect(client).toBeDefined();
    });

    it('should throw error if connection not created', () => {
      expect(() => getRedisClient()).toThrow('Redis connection not initialized');
    });
  });

  describe('closeRedisConnection', () => {
    it('should close Redis connection', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
      };

      await createRedisConnection(config);
      const client = getRedisClient();
      (client.quit as jest.Mock).mockResolvedValue(undefined);

      await closeRedisConnection();

      expect(client.quit).toHaveBeenCalled();
    });
  });
});

