import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware для автоматической установки tenant_id в request
 * Извлекает tenant_id из JWT токена или заголовка X-Tenant-Id
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Получаем tenant_id из user объекта (установлен JWT стратегией)
    const tenantId = (req as any).user?.organizationId || (req as any).user?.tenantId;

    // Или из заголовка (для системных запросов)
    const headerTenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      (req as any).tenantId = tenantId;
      (req as any).organizationId = tenantId;
    } else if (headerTenantId) {
      (req as any).tenantId = headerTenantId;
      (req as any).organizationId = headerTenantId;
    }

    next();
  }
}







