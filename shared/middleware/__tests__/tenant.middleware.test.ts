import { TenantMiddleware } from '../tenant.middleware';
import { Request, Response, NextFunction } from 'express';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    middleware = new TenantMiddleware();
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it('should set tenantId from user.organizationId', () => {
    const organizationId = 'org-1';
    mockRequest.user = {
      organizationId,
    } as any;

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toBe(organizationId);
    expect((mockRequest as any).organizationId).toBe(organizationId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set tenantId from user.tenantId if organizationId is not present', () => {
    const tenantId = 'tenant-1';
    mockRequest.user = {
      tenantId,
    } as any;

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toBe(tenantId);
    expect((mockRequest as any).organizationId).toBe(tenantId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should prefer organizationId over tenantId', () => {
    const organizationId = 'org-1';
    const tenantId = 'tenant-1';
    mockRequest.user = {
      organizationId,
      tenantId,
    } as any;

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toBe(organizationId);
    expect((mockRequest as any).organizationId).toBe(organizationId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should set tenantId from X-Tenant-Id header if user is not present', () => {
    const tenantId = 'org-1';
    mockRequest.headers = {
      'x-tenant-id': tenantId,
    };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toBe(tenantId);
    expect((mockRequest as any).organizationId).toBe(tenantId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should prefer user.organizationId over header', () => {
    const organizationId = 'org-1';
    const headerTenantId = 'org-2';
    mockRequest.user = {
      organizationId,
    } as any;
    mockRequest.headers = {
      'x-tenant-id': headerTenantId,
    };

    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toBe(organizationId);
    expect((mockRequest as any).organizationId).toBe(organizationId);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should call next even if no tenantId is found', () => {
    middleware.use(mockRequest as Request, mockResponse as Response, nextFunction);

    expect((mockRequest as any).tenantId).toBeUndefined();
    expect((mockRequest as any).organizationId).toBeUndefined();
    expect(nextFunction).toHaveBeenCalled();
  });
});

