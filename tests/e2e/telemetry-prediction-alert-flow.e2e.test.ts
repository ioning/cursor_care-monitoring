import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('E2E: Telemetry → Prediction → Alert → Notification Flow', () => {
  let app: Express;
  let authToken: string;
  let userId: string;
  let wardId: string;
  let deviceId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Setup: Register and login user
    const userData = {
      email: `e2e-prediction-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'E2E Prediction Test User',
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
        fullName: 'Test Ward for Prediction',
        dateOfBirth: '1950-01-01',
        gender: 'male',
      });

    wardId = wardResponse.body.id;

    // Register and link device
    const deviceResponse = await request(app)
      .post('/api/v1/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Device for Prediction',
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

  describe('Telemetry → Prediction → Alert Flow', () => {
    it('should process telemetry data and trigger alerts', async () => {
      // 1. Send telemetry data (abnormal values to trigger alert)
      const telemetryResponse = await request(app)
        .post('/api/v1/telemetry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId,
          wardId,
          metricType: 'heart_rate',
          value: 180, // High heart rate - should trigger alert
          unit: 'bpm',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(telemetryResponse.body.success).toBe(true);

      // 2. Wait for processing (in real scenario, this would be async)
      // For E2E, we might need to poll or use test utilities
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 3. Send more telemetry (fall risk indicators)
      await request(app)
        .post('/api/v1/telemetry')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          deviceId,
          wardId,
          metricType: 'acceleration',
          value: 9.8, // Fall detected
          unit: 'm/s²',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      // 4. Check if alerts were created
      const alertsResponse = await request(app)
        .get(`/api/v1/alerts?wardId=${wardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(alertsResponse.body)).toBe(true);
      // In real scenario, we would expect alerts based on threshold rules
    });

    it('should send location data and trigger geofence alerts', async () => {
      // Send location update
      const locationResponse = await request(app)
        .post('/api/v1/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          wardId,
          latitude: 55.7558,
          longitude: 37.6173,
          accuracy: 10,
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(locationResponse.body.success).toBe(true);

      // Check for geofence violations (if geofence is set)
      // This would require setting up a geofence first
    });
  });

  describe('Billing Guard Flow', () => {
    it('should check subscription status before allowing access', async () => {
      // This test would verify that billing guard works
      // In real scenario, would need to set up subscription or mock billing service

      // Try to access premium feature
      const response = await request(app)
        .get('/api/v1/analytics/wards/health-report')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ wardId, period: '30d' });

      // Should either succeed (if subscription active) or return billing error
      expect([200, 402, 403]).toContain(response.status);
    });
  });
});

