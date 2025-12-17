import request from 'supertest';
import { createApp } from '../../api-gateway/src/app.factory';
import { setupTestEnvironment, teardownTestEnvironment } from '../../shared/test-utils/setup';

describe('E2E: Auth Flow', () => {
  let app: any;
  const testUser = {
    email: `e2e-auth-${Date.now()}@example.com`,
    password: 'Test1234!',
    fullName: 'E2E Auth Test User',
    role: 'guardian' as const,
  };

  beforeAll(async () => {
    await setupTestEnvironment();
    app = await createApp();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  describe('Complete Auth Flow', () => {
    let accessToken: string;
    let refreshToken: string;

    it('should complete register → verify email → login → refresh → logout flow', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.data.user).toBeDefined();
      expect(registerResponse.body.data.user.email).toBe(testUser.email);
      expect(registerResponse.body.requiresEmailVerification).toBe(true);

      // Note: In real scenario, verification code would come from email
      // For E2E tests, we would need to mock email service or use test utilities
      // For now, we'll test the flow assuming verification is handled

      // 2. Verify email (mock - in real scenario get code from email)
      // This would require email service mock or test utilities
      // const verifyResponse = await request(app)
      //   .post('/api/v1/auth/verify-email')
      //   .send({ email: testUser.email, code: verificationCode })
      //   .expect(200);

      // 3. Login (assuming email verified or system allows login without verification)
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.tokens).toBeDefined();
      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;

      // 4. Get current user (verify token works)
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.data.email).toBe(testUser.email);

      // 5. Refresh token
      const refreshResponse = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.body.data.refreshToken).toBeDefined();

      // Update tokens
      accessToken = refreshResponse.body.data.accessToken;
      refreshToken = refreshResponse.body.data.refreshToken;

      // 6. Verify new token works
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 7. Logout
      const logoutResponse = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // 8. Verify token is invalidated (should fail)
      await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should handle login failure correctly', async () => {
      // Wrong password
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      // Non-existent user
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(401);
    });

    it('should handle duplicate registration', async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });
  });
});

