// NOTE: amqplib TypeScript typings frequently differ across versions (callback vs promise API).
// For runtime stability in services, we use a minimal `any`-typed wrapper around the promise API.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const amqp: any = require('amqplib');
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let connection: any | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let channel: any | null = null;

export interface RabbitMQConfig {
  url: string;
  exchange?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createRabbitMQConnection(config: RabbitMQConfig): Promise<{ connection: any; channel: any }> {
  if (connection && channel) {
    return { connection, channel };
  }

  const conn = await amqp.connect(config.url);
  const ch = await conn.createChannel();
  connection = conn;
  channel = ch;

  // Declare exchange if provided
  if (config.exchange) {
    await ch.assertExchange(config.exchange, 'topic', {
      durable: true,
    });
  }

  connection.on('error', (err: any) => {
    console.error('RabbitMQ Connection Error:', err);
  });

  connection.on('close', () => {
    console.log('RabbitMQ Connection Closed');
    connection = null;
    channel = null;
  });

  return { connection: conn, channel: ch };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getChannel(): any {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call createRabbitMQConnection first.');
  }
  return channel;
}

// Optional accessor used by health-check endpoints (returns null if not initialized)
export function getRabbitMQChannel() {
  return channel;
}

export async function closeRabbitMQConnection(): Promise<void> {
  if (channel) {
    await channel.close();
    channel = null;
  }
  if (connection) {
    await connection.close();
    connection = null;
  }
}

export async function publishEvent(
  exchange: string,
  routingKey: string,
  message: any,
  options?: { persistent?: boolean }
): Promise<boolean> {
  try {
    const ch = getChannel();
    return ch.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: options?.persistent ?? true,
        messageId: message.eventId || randomUUID(),
        timestamp: Date.now(),
        contentType: 'application/json',
      }
    );
  } catch (error) {
    console.error('Failed to publish event:', error);
    return false;
  }
}

export async function consumeEvent(
  queue: string,
  onMessage: (message: any) => Promise<void>,
  options?: { noAck?: boolean }
): Promise<void> {
  const ch = getChannel();
  
  await ch.assertQueue(queue, {
    durable: true,
  });

  await ch.consume(queue, async (msg: any) => {
    if (!msg) {
      return;
    }

    try {
      const content = JSON.parse(msg.content.toString());
      await onMessage(content);
      
      if (!options?.noAck) {
        ch.ack(msg);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      if (!options?.noAck) {
        ch.nack(msg, false, true); // Requeue on error
      }
    }
  }, {
    noAck: options?.noAck ?? false,
  });
}

export async function healthCheck(): Promise<boolean> {
  try {
    if (!connection || !channel) {
      return false;
    }
    // Simple check - try to assert a test queue
    await channel.assertQueue('health-check-queue', { durable: false, autoDelete: true });
    await channel.deleteQueue('health-check-queue');
    return true;
  } catch (error) {
    console.error('RabbitMQ health check failed:', error);
    return false;
  }
}

