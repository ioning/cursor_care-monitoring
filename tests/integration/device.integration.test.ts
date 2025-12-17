import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('Device Integration Tests', () => {
  let app: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Register and login user
    const userData = {
      email: `device-test-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'Device Test User',
      role: 'guardian',
    };

    await request(app).post('/api/v1/auth/register').send(userData);

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    authToken = loginResponse.body.data?.tokens?.accessToken || loginResponse.body.accessToken;
    userId = loginResponse.body.data?.user?.id || loginResponse.body.user?.id;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/v1/devices/register', () => {
    it('should register a new device', async () => {
      const deviceData = {
        name: 'Test Watch',
        deviceType: 'watch',
        macAddress: '00:11:22:33:44:55',
      };

      const response = await request(app)
        .post('/api/v1/devices/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deviceData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(deviceData.name);
      expect(response.body.data.apiKey).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/devices/register')
        .send({ name: 'Test Device', deviceType: 'watch' })
        .expect(401);
    });
  });

  describe('GET /api/v1/devices', () => {
    it('should get user devices', async () => {
      const response = await request(app)
        .get('/api/v1/devices')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});

