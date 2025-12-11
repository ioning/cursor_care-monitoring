module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/**/__tests__/**/*.test.ts', '<rootDir>/**/?(*.)+(spec|test).ts'],
      testPathIgnorePatterns: ['/node_modules/', '/dist/', '/e2e/', '/integration/'],
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testTimeout: 30000,
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.ts'],
      testTimeout: 60000,
    },
  ],
  collectCoverageFrom: [
    'microservices/**/*.ts',
    'api-gateway/**/*.ts',
    'shared/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/__tests__/**',
    '!**/*.test.ts',
    '!**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 10000,
  verbose: true,
};

