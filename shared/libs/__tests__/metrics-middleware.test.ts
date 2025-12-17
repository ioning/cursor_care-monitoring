import { Request, Response, NextFunction } from 'express';
import { metricsMiddleware } from '../metrics-middleware';
import { recordHttpRequest } from '../metrics';

jest.mock('../metrics', () => ({
  recordHttpRequest: jest.fn(),
}));

describe('metricsMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      method: 'GET',
      path: '/test',
      route: { path: '/test' },
    };
    mockResponse = {
      statusCode: 200,
      end: jest.fn(function (this: Response, chunk?: any, encoding?: any) {
        return this;
      }) as any,
    };
    nextFunction = jest.fn();
  });

  it('should record HTTP request metrics', () => {
    metricsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    // Call the overridden end method
    (mockResponse.end as any).call(mockResponse);

    expect(nextFunction).toHaveBeenCalled();
    expect(recordHttpRequest).toHaveBeenCalledWith(
      'GET',
      '/test',
      200,
      expect.any(Number),
    );
  });

  it('should use path if route is not available', () => {
    delete mockRequest.route;
    mockRequest.path = '/alternative-path';

    metricsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse.end as any).call(mockResponse);

    expect(recordHttpRequest).toHaveBeenCalledWith(
      'GET',
      '/alternative-path',
      200,
      expect.any(Number),
    );
  });

  it('should use "unknown" if neither route nor path is available', () => {
    delete mockRequest.route;
    delete mockRequest.path;

    metricsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse.end as any).call(mockResponse);

    expect(recordHttpRequest).toHaveBeenCalledWith(
      'GET',
      'unknown',
      200,
      expect.any(Number),
    );
  });

  it('should record different status codes', () => {
    mockResponse.statusCode = 404;

    metricsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse.end as any).call(mockResponse);

    expect(recordHttpRequest).toHaveBeenCalledWith(
      'GET',
      '/test',
      404,
      expect.any(Number),
    );
  });

  it('should record different HTTP methods', () => {
    mockRequest.method = 'POST';

    metricsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse.end as any).call(mockResponse);

    expect(recordHttpRequest).toHaveBeenCalledWith(
      'POST',
      '/test',
      200,
      expect.any(Number),
    );
  });

  it('should call original end method', () => {
    const originalEnd = mockResponse.end;
    const chunk = 'test';
    const encoding = 'utf8';

    metricsMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);
    (mockResponse.end as any).call(mockResponse, chunk, encoding);

    expect(originalEnd).toHaveBeenCalled();
  });
});

