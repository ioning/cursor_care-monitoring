import { Request, Response } from 'express';
import { getMetrics } from '../libs/metrics';

export async function getMetricsEndpoint(req: Request, res: Response) {
  try {
    const metrics = await getMetrics();
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
}

