import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';
import { generateTestUser, generateTestDevice } from '../../shared/test-utils/test-helpers';

describe('Telemetry Integration Tests', () => {
  let app: Express;
  let authToken: string;
  let deviceId: string;
  let wardId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Register and login
    const userData = generateTestUser();
    await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    authToken = loginResponse.body.accessToken;

    // Create device
    const deviceData = generateTestDevice();
    const deviceResponse = await request(app)
      .post('/api/v1/devices/register')
      .set('Authorization', `Bearer ${authToken}`)
      .send(deviceData);

    deviceId = deviceResponse.body.id;
    wardId = 'test-ward-id';
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/v1/telemetry', () => {
    it('should create telemetry data', async () => {
      const telemetryData = {
        deviceId,
        wardId,
        metricType: 'heart_rate',
        value: 75,
        unit: 'bpm',
      };

      const response = await request(app)
        .post('/api/v1/telemetry')
        .set('Authorization', `Bearer ${authToken}`)
        .send(telemetryData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.metricType).toBe(telemetryData.metricType);
    });

    it('should return 401 without authentication', async () => {
      await request(app)
        .post('/api/v1/telemetry')
        .send({
          deviceId,
          wardId,
          metricType: 'heart_rate',
          value: 75,
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/telemetry/wards/:wardId', () => {
    it('should get telemetry for ward', async () => {
      const response = await request(app)
        .get(`/api/v1/telemetry/wards/${wardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter by metric type', async () => {
      const response = await request(app)
        .get(`/api/v1/telemetry/wards/${wardId}`)
        .query({ metricType: 'heart_rate' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

