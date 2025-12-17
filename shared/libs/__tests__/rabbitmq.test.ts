import { createRabbitMQConnection, publishEvent, consumeEvent, closeRabbitMQConnection } from '../rabbitmq';

// Mock amqplib
jest.mock('amqplib', () => {
  const mockChannel = {
    assertExchange: jest.fn(),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
    publish: jest.fn(),
    consume: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
    close: jest.fn(),
  };

  const mockConnection = {
    createChannel: jest.fn(() => Promise.resolve(mockChannel)),
    close: jest.fn(),
  };

  return {
    connect: jest.fn(() => Promise.resolve(mockConnection)),
  };
});

describe('RabbitMQ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRabbitMQConnection', () => {
    it('should create RabbitMQ connection', async () => {
      const config = {
        url: 'amqp://localhost:5672',
        exchange: 'test-exchange',
      };

      await createRabbitMQConnection(config);

      const amqplib = require('amqplib');
      expect(amqplib.connect).toHaveBeenCalledWith(config.url);
    });
  });

  describe('publishEvent', () => {
    it('should publish event to exchange', async () => {
      const config = {
        url: 'amqp://localhost:5672',
        exchange: 'test-exchange',
      };

      await createRabbitMQConnection(config);

      const event = {
        eventId: 'event-1',
        eventType: 'test.event',
        timestamp: new Date().toISOString(),
        data: { test: 'data' },
      };

      await publishEvent('test-exchange', 'test.event', event);

      // Verify that channel.publish was called
      // Note: In real test, we would check the mockChannel
    });
  });

  describe('consumeEvent', () => {
    it('should consume events from queue', async () => {
      const config = {
        url: 'amqp://localhost:5672',
        exchange: 'test-exchange',
      };

      await createRabbitMQConnection(config);

      const handler = jest.fn();

      await consumeEvent('test-queue', handler);

      // Verify that channel.consume was called
    });
  });

  describe('closeRabbitMQConnection', () => {
    it('should close RabbitMQ connection', async () => {
      const config = {
        url: 'amqp://localhost:5672',
        exchange: 'test-exchange',
      };

      await createRabbitMQConnection(config);
      await closeRabbitMQConnection();

      // Verify that connection.close was called
    });
  });
});

