import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * API Gateway JWT strategy.
 *
 * The gateway only needs to validate the token and attach minimal user context
 * so controllers can forward Authorization header downstream.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    // NOTE: .env files are intentionally not committed in this repo. In local dev,
    // we still want the gateway to boot out-of-the-box, so we fall back to a dev secret.
    const jwtSecret = process.env.JWT_SECRET || 'please-change-me';
    if (!process.env.JWT_SECRET) {
      // eslint-disable-next-line no-console
      console.warn('[api-gateway] JWT_SECRET is not set; using default from env.example. Set JWT_SECRET for real auth.');
    }
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


