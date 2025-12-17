import { UserRepository } from '../user.repository';
import { UserRole } from '../../../../../../shared/types/common.types';

jest.mock('../../../../../../shared/libs/database', () => {
  const mockQuery = jest.fn();
  return {
    createDatabaseConnection: jest.fn(() => ({
      query: mockQuery,
    })),
    getDatabaseConnection: jest.fn(() => ({
      query: mockQuery,
    })),
  };
});

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let mockQuery: jest.Mock;

  beforeEach(() => {
    userRepository = new UserRepository();
    const { getDatabaseConnection } = require('../../../../../../shared/libs/database');
    const db = getDatabaseConnection();
    mockQuery = db.query;
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';
      const user = {
        id: 'user-1',
        email,
        password_hash: 'hash',
        full_name: 'Test User',
        role: UserRole.GUARDIAN,
        status: 'active',
        email_verified: true,
      };

      mockQuery.mockResolvedValue({ rows: [user] });

      const result = await userRepository.findByEmail(email);

      expect(result).toBeDefined();
      expect(result?.email).toBe(email);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        expect.arrayContaining([email]),
      );
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userId = 'user-1';
      const user = {
        id: userId,
        email: 'test@example.com',
        password_hash: 'hash',
        full_name: 'Test User',
        role: UserRole.GUARDIAN,
        status: 'active',
      };

      mockQuery.mockResolvedValue({ rows: [user] });

      const result = await userRepository.findById(userId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
    });

    it('should return null if user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await userRepository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new user', async () => {
      const userData = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hash',
        fullName: 'Test User',
        role: UserRole.GUARDIAN,
        status: 'active',
      };

      const createdUser = {
        id: userData.id,
        email: userData.email,
        password_hash: userData.passwordHash,
        full_name: userData.fullName,
        role: userData.role,
        status: userData.status,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockQuery.mockResolvedValue({ rows: [createdUser] });

      const result = await userRepository.create(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const userId = 'user-1';

      mockQuery.mockResolvedValue({ rows: [] });

      await userRepository.updateLastLogin(userId);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.arrayContaining([userId]),
      );
    });
  });
});

