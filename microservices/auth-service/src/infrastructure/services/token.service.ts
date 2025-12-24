import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@care-monitoring/shared/types/common.types';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    organizationId?: string,
  ): Promise<Tokens> {
    const payload = {
      sub: userId,
      email,
      role,
      tenantId: organizationId, // Для обратной совместимости
      organizationId: organizationId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'please-change-refresh',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    const decoded = this.jwtService.decode(accessToken) as any;
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async verifyToken(token: string): Promise<any> {
    return this.jwtService.verify(token);
  }
}


