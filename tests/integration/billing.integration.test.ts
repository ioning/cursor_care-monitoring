import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('Billing Integration Tests', () => {
  let app: any;
  let authToken: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Register and login user
    const userData = {
      email: `billing-test-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'Billing Test User',
      role: 'guardian',
    };

    await request(app).post('/api/v1/auth/register').send(userData);

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    authToken = loginResponse.body.data?.tokens?.accessToken || loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('GET /api/v1/billing/subscription', () => {
    it('should get user subscription', async () => {
      const response = await request(app)
        .get('/api/v1/billing/subscription')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/billing/payments', () => {
    it('should get user payments', async () => {
      const response = await request(app)
        .get('/api/v1/billing/payments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/billing/invoices', () => {
    it('should get user invoices', async () => {
      const response = await request(app)
        .get('/api/v1/billing/invoices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

