import { UserService } from '../../user.service';
import { WardService } from '../../ward.service';
import { UserRepository } from '../../../infrastructure/repositories/user.repository';
import { WardRepository } from '../../../infrastructure/repositories/ward.repository';
import { GuardianWardRepository } from '../../../infrastructure/repositories/guardian-ward.repository';
import { generateTestUser, generateTestWard } from '../../../../../../shared/test-utils/test-helpers';
import { mockDatabase } from '../../../../../../shared/test-utils/mocks';

jest.mock('../../../../../../shared/libs/database');

describe('UserService', () => {
  let userService: UserService;
  let wardService: WardService;
  let userRepository: UserRepository;
  let wardRepository: WardRepository;
  let guardianWardRepository: GuardianWardRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    
    userRepository = new UserRepository();
    wardRepository = new WardRepository();
    guardianWardRepository = new GuardianWardRepository();
    wardService = new WardService(wardRepository, guardianWardRepository);
    userService = new UserService(userRepository, wardService);
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const userData = generateTestUser();

      (mockDatabase.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: userData.id,
          email: userData.email,
          full_name: userData.fullName,
          role: userData.role,
          status: userData.status,
        }],
      });

      const result = await userService.getUserById(userData.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(userData.id);
      expect(result.email).toBe(userData.email);
    });

    it('should throw error if user not found', async () => {
      (mockDatabase.query as jest.Mock).mockResolvedValueOnce({
        rows: [],
      });

      await expect(
        userService.getUserById('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData = generateTestUser();
      const updates = { fullName: 'Updated Name' };

      (mockDatabase.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{ id: userData.id }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: userData.id,
            email: userData.email,
            full_name: updates.fullName,
            role: userData.role,
          }],
        });

      const result = await userService.updateUser(userData.id, updates);

      expect(result.fullName).toBe(updates.fullName);
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

  describe('createWard', () => {
    it('should create ward successfully', async () => {
      const wardData = generateTestWard();

      (mockDatabase.query as jest.Mock).mockResolvedValueOnce({
        rows: [{
          id: wardData.id,
          full_name: wardData.fullName,
          date_of_birth: wardData.dateOfBirth,
          status: wardData.status,
        }],
      });

      const result = await wardService.createWard(wardData);

      expect(result).toBeDefined();
      expect(result.id).toBe(wardData.id);
      expect(result.fullName).toBe(wardData.fullName);
    });
  });

  describe('linkWardToGuardian', () => {
    it('should link ward to guardian successfully', async () => {
      const guardianId = 'guardian-id';
      const wardId = 'ward-id';

      (mockDatabase.query as jest.Mock).mockResolvedValueOnce({
        rows: [{ id: 'link-id' }],
      });

      await expect(
        wardService.linkWardToGuardian(guardianId, wardId)
      ).resolves.not.toThrow();
    });
  });
});

