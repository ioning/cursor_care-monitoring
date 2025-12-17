import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('E2E API Tests', () => {
  let app: any;
  let authToken: string;
  let wardId: string;
  let deviceId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Register user
    const userData = {
      email: `e2e-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'E2E Test User',
      role: 'guardian',
    };

    await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    // Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Complete User Flow', () => {
    it('should complete full user workflow', async () => {
      // 1. Create ward
      const wardResponse = await request(app)
        .post('/api/v1/users/wards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Test Ward',
          dateOfBirth: '1990-01-01',
          gender: 'male',
        })
        .expect(201);

      wardId = wardResponse.body.id;

      // 2. Register device
      const deviceResponse = await request(app)
        .post('/api/v1/devices/register')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Device',
          deviceType: 'watch',
        })
        .expect(201);

      deviceId = deviceResponse.body.id;

      // 3. Link device to ward
      await request(app)
        .post(`/api/v1/devices/${deviceId}/link`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ wardId })
        .expect(200);

      // 4. Send telemetry
      await request(app)
        .post('/api/v1/telemetry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId,
          wardId,
          metricType: 'heart_rate',
          value: 75,
          unit: 'bpm',
        })
        .expect(201);

      // 5. Get alerts
      const alertsResponse = await request(app)
        .get('/api/v1/alerts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(alertsResponse.body)).toBe(true);
    });
  });
});

