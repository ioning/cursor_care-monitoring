import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TenantGuard } from '../tenant.guard';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
    jest.clearAllMocks();
  });

  const createMockContext = (user: any, headers: any = {}) => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          headers,
        }),
      }),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when user has valid tenantId', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        tenantId: 'tenant-1',
        organizationId: 'tenant-1',
      };

      mockContext = createMockContext(user);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when tenantId is in headers', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
      };

      mockContext = createMockContext(user, { 'x-tenant-id': 'tenant-1' });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user is not authenticated', () => {
      mockContext = createMockContext(null);

      expect(() => guard.canActivate(mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when tenantId is missing', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
      };

      mockContext = createMockContext(user);

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user organizationId does not match tenantId', () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        organizationId: 'org-1',
      };

      mockContext = createMockContext(user, { 'x-tenant-id': 'org-2' });

      expect(() => guard.canActivate(mockContext)).toThrow(ForbiddenException);
    });

    it('should set tenantId in request', () => {
      const user = {
        id: 'user-1',
        tenantId: 'tenant-1',
        organizationId: 'tenant-1',
      };

      const request = {
        user,
        headers: {},
      };

      mockContext = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      guard.canActivate(mockContext);

      expect(request.tenantId).toBe('tenant-1');
      expect(request.organizationId).toBe('tenant-1');
    });
  });
});

