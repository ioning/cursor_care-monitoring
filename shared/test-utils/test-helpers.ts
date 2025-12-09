import { randomUUID } from 'crypto';

export function generateTestUser(overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    email: `test-${randomUUID()}@example.com`,
    password: 'Test1234!',
    fullName: 'Test User',
    role: 'guardian',
    status: 'active',
    ...overrides,
  };
}

export function generateTestWard(overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    fullName: 'Test Ward',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    medicalInfo: 'Test medical info',
    emergencyContact: '1234567890',
    status: 'active',
    ...overrides,
  };
}

export function generateTestDevice(overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    name: 'Test Device',
    deviceType: 'watch',
    apiKey: randomUUID(),
    status: 'active',
    ...overrides,
  };
}

export function generateTestTelemetry(overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    deviceId: randomUUID(),
    wardId: randomUUID(),
    metricType: 'heart_rate',
    value: 75,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function generateTestAlert(overrides?: Partial<any>) {
  return {
    id: randomUUID(),
    wardId: randomUUID(),
    alertType: 'fall_detection',
    title: 'Test Alert',
    description: 'Test alert description',
    severity: 'high',
    status: 'active',
    ...overrides,
  };
}

export async function waitFor(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function expectToBeValidUUID(str: string) {
  expect(str).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  );
}

