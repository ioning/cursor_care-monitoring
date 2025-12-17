import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserRole } from '../../../../../../shared/types/common.types';

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

jest.mock('../../../../../../shared/libs/logger', () => ({
  createLogger: jest.fn(() => mockLogger),
}));

describe('AuthService', () => {
  const tokens = { accessToken: 'access', refreshToken: 'refresh', expiresIn: 3600 };
  const user = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hash',
    fullName: 'Test User',
    role: UserRole.GUARDIAN,
    organizationId: null,
  };

  let authService: AuthService;
  let userRepository: any;
  let sessionRepository: any;
  let emailVerificationRepository: any;
  let passwordService: any;
  let tokenService: any;
  let emailService: any;
  let jwtService: any;

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
    };
    sessionRepository = {
      create: jest.fn(),
      findByRefreshToken: jest.fn(),
      updateTokens: jest.fn(),
      deleteByUserId: jest.fn(),
    };
    emailVerificationRepository = {
      create: jest.fn(),
      findByEmailAndCode: jest.fn(),
      deleteByEmail: jest.fn(),
    };
    passwordService = {
      hash: jest.fn(),
      compare: jest.fn(),
    };
    tokenService = {
      generateTokens: jest.fn(),
    };
    emailService = {
      sendVerificationEmail: jest.fn(),
    };
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    authService = new AuthService(
      userRepository,
      sessionRepository,
      emailVerificationRepository,
      passwordService,
      tokenService,
      emailService,
      jwtService,
    );
  });

  describe('register', () => {
    it('creates a new user and session when email is unique', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed');
      userRepository.create.mockResolvedValue(user);
      tokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.register({
        email: user.email,
        password: 'Secret123!',
        fullName: user.fullName,
        role: user.role,
        phone: '+79990000000',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(user.email);
      expect(sessionRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: {},
      });
    });

    it('throws ConflictException if email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue(user);

      await expect(
        authService.register({
          email: user.email,
          password: 'Secret123!',
          fullName: user.fullName,
          role: user.role,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns tokens and user info for valid credentials', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      passwordService.compare.mockResolvedValue(true);
      tokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.login({
        email: user.email,
        password: 'Secret123!',
        deviceInfo: { platform: 'web' },
      });

      expect(result.success).toBe(true);
      expect(result.data.tokens).toEqual(tokens);
      expect(sessionRepository.create).toHaveBeenCalledWith({
        userId: user.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        deviceInfo: { platform: 'web' },
      });
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith(user.id);
    });

    it('throws UnauthorizedException if user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: user.email, password: 'Secret123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password invalid', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      passwordService.compare.mockResolvedValue(false);

      await expect(
        authService.login({ email: user.email, password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('reissues tokens for valid refresh token', async () => {
      const session = { id: 'session-1', userId: user.id };
      sessionRepository.findByRefreshToken.mockResolvedValue(session);
      userRepository.findById.mockResolvedValue(user);
      tokenService.generateTokens.mockResolvedValue(tokens);

      const result = await authService.refreshToken('refresh');

      expect(result.success).toBe(true);
      expect(sessionRepository.updateTokens).toHaveBeenCalledWith(
        session.id,
        tokens.accessToken,
        tokens.refreshToken,
      );
    });

    it('throws UnauthorizedException if session not found', async () => {
      sessionRepository.findByRefreshToken.mockResolvedValue(null);

      await expect(authService.refreshToken('invalid')).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if user not found', async () => {
      sessionRepository.findByRefreshToken.mockResolvedValue({ id: 'session-1', userId: user.id });
      userRepository.findById.mockResolvedValue(null);

      await expect(authService.refreshToken('refresh')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('removes all sessions for user', async () => {
      await authService.logout(user.id);

      expect(sessionRepository.deleteByUserId).toHaveBeenCalledWith(user.id);
      expect(mockLogger.info).toHaveBeenCalledWith(
        `User logged out: ${user.id}`,
        expect.objectContaining({ userId: user.id }),
      );
    });
  });

  describe('getCurrentUser', () => {
    it('returns sanitized user data', async () => {
      userRepository.findById.mockResolvedValue({ ...user, emailVerified: true, createdAt: new Date(), updatedAt: new Date() });

      const result = await authService.getCurrentUser(user.id);

      expect(result.success).toBe(true);
      expect(result.data.email).toBe(user.email);
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(authService.getCurrentUser(user.id)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validateUser', () => {
    it('returns user payload when credentials are valid', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      passwordService.compare.mockResolvedValue(true);

      const result = await authService.validateUser(user.email, 'Secret123!');

      expect(result).toEqual({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    });

    it('returns null when user not found', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser(user.email, 'Secret123!');
      expect(result).toBeNull();
    });

    it('returns null when password mismatch', async () => {
      userRepository.findByEmail.mockResolvedValue(user);
      passwordService.compare.mockResolvedValue(false);

      const result = await authService.validateUser(user.email, 'wrong');
      expect(result).toBeNull();
    });
  });
});

