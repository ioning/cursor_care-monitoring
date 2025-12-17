import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('Auth Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test1234!',
        fullName: 'Test User',
        role: 'guardian',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should return 400 for invalid data', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test1234!',
        fullName: 'Test User',
        role: 'guardian',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testUser: any;

    beforeAll(async () => {
      testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test1234!',
        fullName: 'Test User',
        role: 'guardian',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);
    });

    it('should login successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'Test1234!',
        fullName: 'Test User',
        role: 'guardian',
      };

      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});

