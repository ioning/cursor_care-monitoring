import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('E2E: Guardian Dashboard Data Flow', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let wardId: string;
  let deviceId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Setup: Register and login guardian
    const userData = {
      email: `e2e-guardian-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'E2E Guardian Test User',
      role: 'guardian',
    };

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    userId = registerResponse.body.data.user.id;

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = loginResponse.body.data.tokens.accessToken;

    // Create ward
    const wardResponse = await request(app)
      .post('/api/v1/users/wards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Test Ward for Dashboard',
        dateOfBirth: '1950-01-01',
        gender: 'male',
      });

    wardId = wardResponse.body.id;

    // Register and link device
    const deviceResponse = await request(app)
      .post('/api/v1/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Device for Dashboard',
        deviceType: 'watch',
      });

    deviceId = deviceResponse.body.id;

    await request(app)
      .post(`/api/v1/devices/${deviceId}/link`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ wardId })
      .expect(200);
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Guardian Dashboard Data Retrieval', () => {
    it('should retrieve all dashboard data', async () => {
      // 1. Send some telemetry data
      await request(app)
        .post('/api/v1/telemetry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId,
          wardId,
          metricType: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      // 2. Get ward status
      const wardStatusResponse = await request(app)
        .get(`/api/v1/users/wards/${wardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(wardStatusResponse.body).toBeDefined();
      expect(wardStatusResponse.body.id).toBe(wardId);

      // 3. Get recent telemetry
      const telemetryResponse = await request(app)
        .get(`/api/v1/telemetry?wardId=${wardId}&limit=10`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(telemetryResponse.body)).toBe(true);

      // 4. Get alerts
      const alertsResponse = await request(app)
        .get(`/api/v1/alerts?wardId=${wardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(alertsResponse.body)).toBe(true);

      // 5. Get location
      const locationResponse = await request(app)
        .get(`/api/v1/locations?wardId=${wardId}&limit=1`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(locationResponse.body)).toBe(true);

      // 6. Get device info
      const deviceResponse = await request(app)
        .get(`/api/v1/devices/${deviceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deviceResponse.body.id).toBe(deviceId);
    });

    it('should handle multiple wards for guardian', async () => {
      // Create second ward
      const ward2Response = await request(app)
        .post('/api/v1/users/wards')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullName: 'Second Test Ward',
          dateOfBirth: '1945-01-01',
          gender: 'female',
        })
        .expect(201);

      const ward2Id = ward2Response.body.id;

      // Get all wards for guardian
      const wardsResponse = await request(app)
        .get('/api/v1/users/wards')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(wardsResponse.body)).toBe(true);
      expect(wardsResponse.body.length).toBeGreaterThanOrEqual(2);
    });
  });
});

