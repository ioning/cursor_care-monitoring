import { createLogger } from '../logger';

// Mock winston
jest.mock('winston', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  };

  return {
    createLogger: jest.fn(() => mockLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      json: jest.fn(),
      simple: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
});

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLogger', () => {
    it('should create logger with default config', () => {
      const logger = createLogger();

      expect(logger).toBeDefined();
    });

    it('should create logger with custom service name', () => {
      const logger = createLogger({ serviceName: 'test-service' });

      expect(logger).toBeDefined();
    });

    it('should create logger with custom level', () => {
      const logger = createLogger({ level: 'debug' });

      expect(logger).toBeDefined();
    });

    it('should create logger with json format', () => {
      const logger = createLogger({ format: 'json' });

      expect(logger).toBeDefined();
    });

    it('should create logger with simple format', () => {
      const logger = createLogger({ format: 'simple' });

      expect(logger).toBeDefined();
    });
  });
});

