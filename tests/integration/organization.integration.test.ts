import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('Organization Integration Tests', () => {
  let app: any;
  let authToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Register admin user
    const adminData = {
      email: `org-admin-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'Org Admin',
      role: 'admin',
    };

    await request(app).post('/api/v1/auth/register').send(adminData);

    const adminLoginResponse = await request(app).post('/api/v1/auth/login').send({
      email: adminData.email,
      password: adminData.password,
    });

    adminToken =
      adminLoginResponse.body.data?.tokens?.accessToken ||
      adminLoginResponse.body.accessToken;

    // Register regular user
    const userData = {
      email: `org-user-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'Org User',
      role: 'guardian',
    };

    await request(app).post('/api/v1/auth/register').send(userData);

    const userLoginResponse = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    authToken =
      userLoginResponse.body.data?.tokens?.accessToken || userLoginResponse.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/v1/organizations', () => {
    it('should create organization (admin only)', async () => {
      const orgData = {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
        description: 'Test Description',
      };

      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(orgData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(orgData.name);
    });

    it('should return 403 for non-admin users', async () => {
      const orgData = {
        name: 'Test Organization',
        slug: `test-org-${Date.now()}`,
      };

      await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orgData)
        .expect(403);
    });
  });

  describe('GET /api/v1/organizations', () => {
    it('should get all organizations (admin only)', async () => {
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

