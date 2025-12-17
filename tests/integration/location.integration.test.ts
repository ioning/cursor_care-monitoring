import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('Location Integration Tests', () => {
  let app: any;
  let authToken: string;
  let wardId: string;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();

    // Register and login user
    const userData = {
      email: `location-test-${Date.now()}@example.com`,
      password: 'Test1234!',
      fullName: 'Location Test User',
      role: 'guardian',
    };

    await request(app).post('/api/v1/auth/register').send(userData);

    const loginResponse = await request(app).post('/api/v1/auth/login').send({
      email: userData.email,
      password: userData.password,
    });

    authToken = loginResponse.body.data?.tokens?.accessToken || loginResponse.body.accessToken;

    // Create ward
    const wardResponse = await request(app)
      .post('/api/v1/users/wards')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        fullName: 'Test Ward',
        dateOfBirth: '1990-01-01',
        gender: 'male',
      });

    wardId = wardResponse.body.id || wardResponse.body.data?.id;
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/v1/location', () => {
    it('should record location', async () => {
      const locationData = {
        wardId,
        latitude: 55.7558,
        longitude: 37.6173,
        source: 'gps',
        accuracy: 10,
      };

      const response = await request(app)
        .post('/api/v1/location')
        .set('Authorization', `Bearer ${authToken}`)
        .send(locationData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/location/wards/:wardId/history', () => {
    it('should get location history', async () => {
      const response = await request(app)
        .get(`/api/v1/location/wards/${wardId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ from: '2024-01-01', to: '2024-12-31' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/location/wards/:wardId/current', () => {
    it('should get current location', async () => {
      const response = await request(app)
        .get(`/api/v1/location/wards/${wardId}/current`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

