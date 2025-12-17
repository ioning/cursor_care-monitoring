import { TokenService } from '../token.service';
import { UserRole } from '../../../../../../shared/types/common.types';

describe('TokenService', () => {
  let jwtService: any;
  let tokenService: TokenService;
  let dateNowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    jwtService = {
      sign: jest.fn(),
      decode: jest.fn(),
      verify: jest.fn(),
    };

    tokenService = new TokenService(jwtService);
    dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1_700_000_000_000);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  it('generates access and refresh tokens with tenant metadata', async () => {
    const nowSeconds = Math.floor(1_700_000_000_000 / 1000);

    jwtService.sign
      .mockReturnValueOnce('access-token')
      .mockReturnValueOnce('refresh-token');
    jwtService.decode.mockReturnValue({ exp: nowSeconds + 3600 });

    const result = await tokenService.generateTokens(
      'user-1',
      'user@example.com',
      UserRole.GUARDIAN,
      'org-1',
    );

    expect(jwtService.sign).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        sub: 'user-1',
        email: 'user@example.com',
        role: UserRole.GUARDIAN,
        tenantId: 'org-1',
        organizationId: 'org-1',
      }),
    );
    expect(jwtService.sign).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        sub: 'user-1',
        email: 'user@example.com',
        role: UserRole.GUARDIAN,
        tenantId: 'org-1',
        organizationId: 'org-1',
      }),
      expect.objectContaining({
        secret: expect.any(String),
        expiresIn: expect.any(String),
      }),
    );

    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: expect.any(Number),
    });
    expect(result.expiresIn).toBe(3600);
    expect(jwtService.decode).toHaveBeenCalledWith('access-token');
  });

  it('verifies token using JwtService', async () => {
    jwtService.verify.mockResolvedValue({ sub: 'user-1' });

    await expect(tokenService.verifyToken('token')).resolves.toEqual({ sub: 'user-1' });
    expect(jwtService.verify).toHaveBeenCalledWith('token');
  });
});

