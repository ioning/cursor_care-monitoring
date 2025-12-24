import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Локальный TenantGuard для api-gateway (см. комментарий в JwtAuthGuard).
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>('skipTenantCheck', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // tenant_id из JWT или из заголовка
    const tenantId = user.tenantId || user.organizationId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // проверяем принадлежность организации
    if (user.organizationId && user.organizationId !== tenantId) {
      throw new ForbiddenException('Access denied: user does not belong to this organization');
    }

    request.tenantId = tenantId;
    request.organizationId = tenantId;

    return true;
  }
}

export const SkipTenantCheck = () => SetMetadata('skipTenantCheck', true);


