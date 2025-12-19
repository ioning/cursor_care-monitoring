import { Request, Response, NextFunction } from 'express';
import { recordHttpRequest } from './metrics';
import { performance } from 'perf_hooks';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = performance.now();

  // Override res.end to capture response status and duration
  const originalEnd = res.end.bind(res);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res.end = ((chunk?: any, encoding?: any) => {
    const duration = (performance.now() - startTime) / 1000; // Convert to seconds
    const method = req.method;
    const route = req.route?.path || req.path || 'unknown';
    const status = res.statusCode;

    recordHttpRequest(method, route, status, duration);

    // Call original end
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (originalEnd as any)(chunk, encoding);
  }) as any;

  next();
}

