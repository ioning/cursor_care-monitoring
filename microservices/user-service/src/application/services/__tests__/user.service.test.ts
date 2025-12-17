import { UserService } from '../user.service';
import { WardService } from '../ward.service';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { WardRepository } from '../../../infrastructure/repositories/ward.repository';
import { GuardianWardRepository } from '../../../infrastructure/repositories/guardian-ward.repository';
import { generateTestUser, generateTestWard } from '../../../../../../shared/test-utils/test-helpers';
import { mockDatabase } from '../../../../../../shared/test-utils/mocks';

jest.mock('../../../../../../shared/libs/database');

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    userRepository = new UserRepository();
    userService = new UserService(userRepository);
  });

  describe('getProfile', () => {
    it('should return user profile by id', async () => {
      const userData = generateTestUser();

      (mockDatabase.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: userData.id,
          email: userData.email,
          full_name: userData.fullName,
          phone: null,
          role: userData.role,
          status: userData.status,
          email_verified: true,
          created_at: new Date(),
          updated_at: new Date(),
        }],
      });

      const result = await userService.getProfile(userData.id);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(userData.id);
      expect(result.data.email).toBe(userData.email);
      expect(result.data.fullName).toBe(userData.fullName);
    });

    it('should throw error if user not found', async () => {
      (mockDatabase.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        userService.getProfile('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userData = generateTestUser();
      const updates = { fullName: 'Updated Name' };

      (mockDatabase.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: userData.id,
            email: userData.email,
            full_name: userData.fullName,
            phone: null,
            role: userData.role,
            status: userData.status,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
          }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: userData.id,
            email: userData.email,
            full_name: updates.fullName,
            phone: null,
            role: userData.role,
            status: userData.status,
            email_verified: true,
            created_at: new Date(),
            updated_at: new Date(),
          }],
        });

      const result = await userService.updateProfile(userData.id, updates);

      expect(result.success).toBe(true);
      expect(result.data.fullName).toBe(updates.fullName);
    });
  });
});

describe('WardService', () => {
  let wardService: WardService;
  let wardRepository: WardRepository;
  let guardianWardRepository: GuardianWardRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    wardRepository = new WardRepository();
    guardianWardRepository = new GuardianWardRepository();
    wardService = new WardService(wardRepository, guardianWardRepository);
  });

  describe('create', () => {
    it('should create ward successfully', async () => {
      const guardianId = 'guardian-id';
      const wardData = generateTestWard();
      const createWardDto = {
        fullName: wardData.fullName,
        dateOfBirth: wardData.dateOfBirth,
        gender: wardData.gender,
        relationship: 'ward',
      };

      (mockDatabase.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: wardData.id,
            full_name: wardData.fullName,
            date_of_birth: wardData.dateOfBirth,
            gender: wardData.gender,
            status: wardData.status,
            created_at: new Date(),
            updated_at: new Date(),
          }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 'link-id' }],
        });

      const result = await wardService.create(guardianId, createWardDto);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(wardData.id);
      expect(result.data.fullName).toBe(wardData.fullName);
    });
  });
});

