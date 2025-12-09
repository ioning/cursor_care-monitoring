import mitt from 'mitt';

export type ChannelPayload = unknown;

type InternalEvents = {
  connected: void;
  disconnected: void;
  error: Error;
};

type RealtimeMessage = {
  channel: string;
  payload: ChannelPayload;
};

export type RealtimeChannelHandler<T = ChannelPayload> = (payload: T) => void;

export type RealtimeClientOptions = {
  /**
   * Базовый URL WebSocket-сервера, например ws://localhost:3000/ws/admin
   */
  url: string;
  /**
   * Дополнительные query-параметры. Удобно использовать для токена/tenant-id.
   */
  query?: () => Record<string, string | number | boolean | null | undefined>;
  /**
   * Автовосстановление соединения
   */
  reconnect?: boolean;
  /**
   * Интервал перед повторным подключением (мс)
   */
  reconnectDelayMs?: number;
};

const DEFAULT_RECONNECT_DELAY = 5_000;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private readonly options: Required<RealtimeClientOptions>;
  private readonly emitter = mitt<InternalEvents>();
  private readonly channelHandlers = new Map<string, Set<RealtimeChannelHandler>>();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  constructor(options: RealtimeClientOptions) {
    this.options = {
      reconnect: true,
      reconnectDelayMs: DEFAULT_RECONNECT_DELAY,
      query: undefined,
      ...options,
    };
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.intentionalClose = false;
    const url = this.buildUrl();

    this.ws = new WebSocket(url);
    this.ws.addEventListener('open', this.handleOpen);
    this.ws.addEventListener('message', this.handleMessage);
    this.ws.addEventListener('error', this.handleError);
    this.ws.addEventListener('close', this.handleClose);
  }

  disconnect() {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.removeEventListener('open', this.handleOpen);
      this.ws.removeEventListener('message', this.handleMessage);
      this.ws.removeEventListener('error', this.handleError);
      this.ws.removeEventListener('close', this.handleClose);
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe<T = ChannelPayload>(channel: string, handler: RealtimeChannelHandler<T>) {
    if (!this.channelHandlers.has(channel)) {
      this.channelHandlers.set(channel, new Set());
    }
    this.channelHandlers.get(channel)!.add(handler as RealtimeChannelHandler);

    // Гарантируем, что соединение установлено
    this.connect();

    return () => {
      const handlers = this.channelHandlers.get(channel);
      handlers?.delete(handler as RealtimeChannelHandler);
      if (handlers && handlers.size === 0) {
        this.channelHandlers.delete(channel);
      }
    };
  }

  on<E extends keyof InternalEvents>(event: E, handler: (payload: InternalEvents[E]) => void) {
    this.emitter.on(event, handler);
    return () => this.emitter.off(event, handler);
  }

  private buildUrl() {
    try {
      const base = new URL(this.options.url, window.location.origin);
      const params = this.options.query?.();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          base.searchParams.set(key, String(value));
        });
      }
      return base.toString();
    } catch {
      return this.options.url;
    }
  }

  private handleOpen = () => {
    this.emitter.emit('connected', undefined);
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const parsed = JSON.parse(event.data as string) as RealtimeMessage;
      if (!parsed?.channel) {
        return;
      }

      const handlers = this.channelHandlers.get(parsed.channel);
      handlers?.forEach((handler) => handler(parsed.payload));
    } catch (error) {
      this.emitter.emit('error', error instanceof Error ? error : new Error('Failed to parse realtime payload'));
    }
  };

  private handleError = (event: Event) => {
    const error = event instanceof ErrorEvent ? event.error : new Error('Realtime connection error');
    this.emitter.emit('error', error);
  };

  private handleClose = () => {
    this.emitter.emit('disconnected', undefined);
    if (this.intentionalClose) {
      return;
    }
    if (this.options.reconnect) {
      this.scheduleReconnect();
    }
  };

  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.options.reconnectDelayMs);
  }
}

export const createRealtimeClient = (options: RealtimeClientOptions) => new RealtimeClient(options);

