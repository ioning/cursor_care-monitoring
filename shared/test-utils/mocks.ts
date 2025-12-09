import { Pool } from 'pg';

export const mockDatabase = {
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
} as unknown as Pool;

export const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  ping: jest.fn().mockResolvedValue('PONG'),
  quit: jest.fn(),
} as any;

export const mockRabbitMQChannel = {
  publish: jest.fn(),
  sendToQueue: jest.fn(),
  assertExchange: jest.fn(),
  assertQueue: jest.fn(),
  consume: jest.fn(),
  ack: jest.fn(),
  nack: jest.fn(),
} as any;

export const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
} as any;

export function resetMocks() {
  jest.clearAllMocks();
  mockDatabase.query.mockReset();
  mockRedis.get.mockReset();
  mockRedis.set.mockReset();
  mockRabbitMQChannel.publish.mockReset();
}

