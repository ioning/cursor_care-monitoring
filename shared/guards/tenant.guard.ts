import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * Guard для проверки изоляции tenant'ов
 * Обеспечивает, что пользователь может работать только с данными своей организации
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Получаем tenant_id из JWT токена или заголовка
    const tenantId = user.tenantId || user.organizationId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // Проверяем, что пользователь принадлежит этой организации
    if (user.organizationId && user.organizationId !== tenantId) {
      throw new ForbiddenException('Access denied: user does not belong to this organization');
    }

    // Сохраняем tenant_id в request для использования в репозиториях
    request.tenantId = tenantId;
    request.organizationId = tenantId;

    return true;
  }
}

/**
 * Декоратор для отключения проверки tenant (для системных операций)
 */
export const SkipTenantCheck = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    // Реализация через SetMetadata
  };
};


import { Reflector } from '@nestjs/core';

/**
 * Guard для проверки изоляции tenant'ов
 * Обеспечивает, что пользователь может работать только с данными своей организации
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Получаем tenant_id из JWT токена или заголовка
    const tenantId = user.tenantId || user.organizationId || request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant ID is required');
    }

    // Проверяем, что пользователь принадлежит этой организации
    if (user.organizationId && user.organizationId !== tenantId) {
      throw new ForbiddenException('Access denied: user does not belong to this organization');
    }

    // Сохраняем tenant_id в request для использования в репозиториях
    request.tenantId = tenantId;
    request.organizationId = tenantId;

    return true;
  }
}

/**
 * Декоратор для отключения проверки tenant (для системных операций)
 */
export const SkipTenantCheck = () => {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    // Реализация через SetMetadata
  };
};







