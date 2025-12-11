import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('E2E: Health Checks', () => {
  let app: Express;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('API Gateway Health Checks', () => {
    it('should respond to /health endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.status).toBeDefined();
      expect(response.body.service).toBe('api-gateway');
    });

    it('should respond to /health/ready endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/health/ready')
        .expect(200);

      expect(response.body.status).toBeDefined();
    });

    it('should respond to /health/live endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/health/live')
        .expect(200);

      expect(response.body.status).toBe('alive');
      expect(response.body.uptime).toBeDefined();
    });

    it('should respond to /metrics endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/metrics')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/plain');
      // Prometheus metrics format
      expect(response.text).toContain('# HELP');
    });
  });
});

