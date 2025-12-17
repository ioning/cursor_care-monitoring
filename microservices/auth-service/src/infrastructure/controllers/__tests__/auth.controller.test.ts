import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../../services/auth.service';
import { RegisterDto } from '../../dto/register.dto';
import { LoginDto } from '../../dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationCode: jest.fn(),
      getCurrentUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Test1234!',
        fullName: 'Test User',
        role: 'guardian',
      };

      const expectedResult = {
        success: true,
        data: {
          user: { id: 'user-1', email: registerDto.email },
          requiresEmailVerification: true,
        },
      };

      authService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Test1234!',
      };

      const expectedResult = {
        success: true,
        data: {
          user: { id: 'user-1', email: loginDto.email },
          tokens: {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
          },
        },
      };

      authService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });
  });

  describe('refresh', () => {
    it('should refresh access token', async () => {
      const refreshTokenDto = { refreshToken: 'refresh-token' };
      const expectedResult = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        },
      };

      authService.refreshToken.mockResolvedValue(expectedResult);

      const result = await controller.refresh(refreshTokenDto, '127.0.0.1', 'test-agent');

      expect(result).toEqual(expectedResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshTokenDto.refreshToken, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        message: 'Logged out successfully',
      };

      authService.logout.mockResolvedValue(expectedResult);

      const result = await controller.logout({ user: { id: userId } } as any, '127.0.0.1', 'test-agent');

      expect(result).toEqual(expectedResult);
      expect(authService.logout).toHaveBeenCalledWith(userId, {
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      const userId = 'user-1';
      const expectedResult = {
        success: true,
        data: {
          id: userId,
          email: 'test@example.com',
          fullName: 'Test User',
        },
      };

      authService.getCurrentUser.mockResolvedValue(expectedResult);

      const result = await controller.getMe({ user: { id: userId } } as any);

      expect(result).toEqual(expectedResult);
      expect(authService.getCurrentUser).toHaveBeenCalledWith(userId);
    });
  });
});

