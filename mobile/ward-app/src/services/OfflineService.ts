import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = '@care_monitoring:request_queue';
const CACHE_PREFIX = '@care_monitoring:cache:';
const MAX_RETRIES = 3;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export class OfflineService {
  private static isOnline: boolean = true;
  private static queueListeners: Set<() => void> = new Set();

  /**
   * Инициализация сервиса
   */
  static async initialize() {
    // Проверяем состояние сети
    const netInfo = await NetInfo.fetch();
    this.isOnline = netInfo.isConnected ?? false;

    // Слушаем изменения состояния сети
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        // Перешли в онлайн - пытаемся синхронизировать очередь
        this.syncQueue();
      }

      // Уведомляем слушателей
      this.queueListeners.forEach((listener) => listener());
    });

    // Пытаемся синхронизировать очередь при старте
    if (this.isOnline) {
      await this.syncQueue();
    }
  }

  /**
   * Проверка онлайн статуса
   */
  static isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  /**
   * Подписка на изменения состояния сети
   */
  static subscribeToNetworkChanges(callback: () => void): () => void {
    this.queueListeners.add(callback);
    return () => {
      this.queueListeners.delete(callback);
    };
  }

  /**
   * Добавить запрос в очередь для выполнения в офлайн режиме
   */
  static async queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };

    const queue = await this.getQueue();
    queue.push(queuedRequest);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    // Если онлайн, пытаемся сразу выполнить
    if (this.isOnline) {
      this.processQueue();
    }

    return queuedRequest.id;
  }

  /**
   * Получить очередь запросов
   */
  static async getQueue(): Promise<QueuedRequest[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get queue:', error);
      return [];
    }
  }

  /**
   * Очистить очередь запросов
   */
  static async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Удалить запрос из очереди
   */
  static async removeRequest(requestId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((req) => req.id !== requestId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  /**
   * Кэширование данных
   */
  static async cacheData(key: string, data: any, expiryMs: number = CACHE_EXPIRY_MS): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + expiryMs,
      };
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Получить данные из кэша
   */
  static async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) return null;

      const cacheItem = JSON.parse(cached);
      
      // Проверяем срок действия
      if (Date.now() > cacheItem.expiry) {
        await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return null;
      }

      return cacheItem.data as T;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Очистить кэш
   */
  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Очистить просроченный кэш
   */
  static async clearExpiredCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      for (const key of cacheKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const cacheItem = JSON.parse(cached);
          if (Date.now() > cacheItem.expiry) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to clear expired cache:', error);
    }
  }

  /**
   * Синхронизация очереди запросов
   */
  private static async syncQueue() {
    if (!this.isOnline) return;

    const queue = await this.getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} queued requests...`);

    // Импортируем ApiClient динамически, чтобы избежать циклических зависимостей
    const { apiClient } = await import('./ApiClient');
    const processedIds: string[] = [];

    for (const request of queue) {
      try {
        if (request.retries >= MAX_RETRIES) {
          console.warn(`Max retries reached for request ${request.id}`);
          processedIds.push(request.id);
          continue;
        }

        let response;
        switch (request.method) {
          case 'GET':
            response = await apiClient.instance.get(request.url, { headers: request.headers });
            break;
          case 'POST':
            response = await apiClient.instance.post(request.url, request.data, { headers: request.headers });
            break;
          case 'PUT':
            response = await apiClient.instance.put(request.url, request.data, { headers: request.headers });
            break;
          case 'PATCH':
            response = await apiClient.instance.patch(request.url, request.data, { headers: request.headers });
            break;
          case 'DELETE':
            response = await apiClient.instance.delete(request.url, { headers: request.headers });
            break;
        }

        // Запрос успешен - удаляем из очереди
        processedIds.push(request.id);
        console.log(`Successfully synced request ${request.id}`);
      } catch (error: any) {
        // Ошибка сети - увеличиваем счетчик попыток
        if (error.code === 'NETWORK_ERROR' || !this.isOnline) {
          request.retries++;
          console.warn(`Failed to sync request ${request.id}, retries: ${request.retries}`);
        } else {
          // Другая ошибка (например, 401, 403) - удаляем из очереди
          processedIds.push(request.id);
          console.warn(`Removing failed request ${request.id}:`, error.message);
        }
      }
    }

    // Удаляем обработанные запросы
    if (processedIds.length > 0) {
      const updatedQueue = queue.filter((req) => !processedIds.includes(req.id));
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    }
  }

  /**
   * Обработка очереди (вызывается автоматически при переходе в онлайн)
   */
  private static async processQueue() {
    await this.syncQueue();
  }
}

