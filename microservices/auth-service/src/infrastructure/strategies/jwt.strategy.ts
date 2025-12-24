import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    const jwtSecret = process.env.JWT_SECRET || 'please-change-me';
    if (!process.env.JWT_SECRET) {
      // eslint-disable-next-line no-console
      console.warn('[auth-service] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findById(payload.sub);
    if (!user || user.status !== 'active') {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.organizationId || payload.tenantId || payload.organizationId,
      organizationId: user.organizationId || payload.organizationId,
    };
  }
}


