import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Standard JWT auth guard based on Passport's "jwt" strategy.
 *
 * Each service (or gateway) must register a JwtStrategy named "jwt"
 * (via passport-jwt) and provide JWT_SECRET in env.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

