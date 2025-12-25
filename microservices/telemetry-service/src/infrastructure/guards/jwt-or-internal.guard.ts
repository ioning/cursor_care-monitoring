import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtOrInternalGuard extends AuthGuard('jwt') implements CanActivate {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const internalServiceHeader = request.headers['x-internal-service'];

    const allowedInternalServices = ['device-service', 'integration-service'];

    if (internalServiceHeader && allowedInternalServices.includes(internalServiceHeader.toLowerCase())) {
      // If it's an internal service call, bypass JWT authentication
      return true;
    }

    // For external calls, proceed with JWT authentication
    return (await super.canActivate(context)) as boolean;
  }
}

