import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvValidator } from '@care-monitoring/shared';

/**
 * API Gateway JWT strategy.
 *
 * The gateway only needs to validate the token and attach minimal user context
 * so controllers can forward Authorization header downstream.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const jwtSecret = EnvValidator.getRequired('JWT_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      tenantId: payload.tenantId || payload.organizationId,
      organizationId: payload.organizationId,
    };
  }
}


