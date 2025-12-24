import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import { Logger } from '@nestjs/common';
import { createLogger } from '@care-monitoring/shared/libs/logger';

type ChannelPayload = unknown;

type RealtimeMessage = {
  channel: string;
  payload: ChannelPayload;
};

@WebSocketGateway({
  path: '/ws',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = createLogger({ serviceName: 'realtime-gateway' });
  private readonly clients = new Map<WebSocket, { userId?: string; tenantId?: string; channel?: string }>();
  private readonly channelSubscriptions = new Map<string, Set<WebSocket>>();

  handleConnection(client: WebSocket, ...args: any[]) {
    try {
      // Для ws адаптера request может быть в args[0] или доступен через client.upgradeReq
      const request = (args[0] as any) || (client as any).upgradeReq || (client as any)._req;
      
      let channel = 'default';
      let token: string | null = null;
      let tenant: string | null = null;

      if (request && request.url) {
        // Создаем URL из request
        const host = request.headers?.host || 'localhost:3000';
        const protocol = request.headers?.['x-forwarded-proto'] || 'http';
        let urlPath = request.url;
        
        // Убираем query string для парсинга пути
        const urlWithoutQuery = urlPath.split('?')[0];
        const url = new URL(urlPath, `${protocol}://${host}`);
        
        // Извлекаем канал из пути (например, /ws/guardian или /ws/admin)
        const pathParts = url.pathname.split('/').filter(Boolean);
        this.logger.debug('WebSocket connection path parts', { pathParts, url: url.pathname });
        
        if (pathParts.length >= 2 && pathParts[0] === 'ws') {
          channel = pathParts[1];
        } else if (pathParts.length === 1 && pathParts[0] === 'ws') {
          // Если путь просто /ws, пытаемся получить канал из query параметров
          const channelParam = url.searchParams.get('channel');
          if (channelParam) {
            channel = channelParam;
          } else {
            channel = 'default';
          }
        }
        
        // Извлекаем токен и tenant из query параметров
        token = url.searchParams.get('token');
        tenant = url.searchParams.get('tenant');
      } else {
        // Пытаемся извлечь из параметров декоратора (если доступно)
        const params = args[1] as any;
        if (params && params.channel) {
          channel = params.channel;
        }
      }

      this.logger.info(`WebSocket client connecting to channel: ${channel}`, {
        hasToken: !!token,
        hasTenant: !!tenant,
      });

      // Сохраняем информацию о клиенте
      this.clients.set(client, {
        channel,
        userId: token ? this.extractUserIdFromToken(token) : undefined,
        tenantId: tenant || undefined,
      });

      // Подписываем клиента на канал
      if (!this.channelSubscriptions.has(channel)) {
        this.channelSubscriptions.set(channel, new Set());
      }
      this.channelSubscriptions.get(channel)!.add(client);

      this.logger.info(`Client connected to channel: ${channel}. Total clients: ${this.clients.size}`);
    } catch (error) {
      this.logger.error('Error handling WebSocket connection', { error });
      try {
        client.close(1011, 'Internal server error');
      } catch {
        // Игнорируем ошибки при закрытии
      }
    }
  }

  handleDisconnect(client: WebSocket) {
    const clientInfo = this.clients.get(client);
    if (clientInfo) {
      const { channel } = clientInfo;
      
      // Удаляем клиента из подписок канала
      if (channel) {
        const channelSubs = this.channelSubscriptions.get(channel);
        channelSubs?.delete(client);
        if (channelSubs && channelSubs.size === 0) {
          this.channelSubscriptions.delete(channel);
        }
      }
      
      this.clients.delete(client);
      this.logger.info(`Client disconnected from channel: ${channel}. Total clients: ${this.clients.size}`);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: WebSocket) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!message || !message.channel) {
        this.logger.warn('Invalid message format received', { data });
        return;
      }

      // Отправляем сообщение всем подписчикам канала
      this.broadcastToChannel(message.channel, message);
    } catch (error) {
      this.logger.error('Error handling message', { error, data });
    }
  }

  /**
   * Отправляет сообщение всем клиентам, подписанным на канал
   */
  broadcastToChannel(channel: string, message: RealtimeMessage) {
    const subscribers = this.channelSubscriptions.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return;
    }

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    subscribers.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          this.logger.error('Error sending message to client', { error });
          // Удаляем клиента при ошибке отправки
          subscribers.delete(client);
          this.clients.delete(client);
        }
      } else {
        // Удаляем неактивных клиентов
        subscribers.delete(client);
        this.clients.delete(client);
      }
    });

    this.logger.debug(`Broadcasted to channel ${channel}: ${sentCount} clients`);
  }

  /**
   * Отправляет сообщение конкретному клиенту
   */
  sendToClient(client: WebSocket, message: RealtimeMessage) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error('Error sending message to client', { error });
      }
    }
  }

  /**
   * Извлекает userId из JWT токена (упрощенная версия)
   * В продакшене нужно использовать реальную валидацию JWT
   */
  private extractUserIdFromToken(token: string): string | undefined {
    try {
      // Простая декодировка base64 payload (без валидации)
      const parts = token.split('.');
      if (parts.length !== 3) {
        return undefined;
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return payload.sub || payload.userId;
    } catch {
      return undefined;
    }
  }

  /**
   * Получает количество подключенных клиентов
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Получает количество подписчиков канала
   */
  getChannelSubscribersCount(channel: string): number {
    return this.channelSubscriptions.get(channel)?.size || 0;
  }
}

