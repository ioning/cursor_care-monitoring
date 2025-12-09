import { onMounted, onUnmounted } from 'vue';

import type { RealtimeChannelHandler, RealtimeClient } from './client';

export type UseRealtimeChannelOptions = {
  /**
   * Подключаться ли к сокету при монтировании (по умолчанию true)
   */
  connectOnMount?: boolean;
};

export const useRealtimeChannel = <T>(
  client: RealtimeClient,
  channel: string,
  handler: RealtimeChannelHandler<T>,
  options?: UseRealtimeChannelOptions,
) => {
  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    if (options?.connectOnMount !== false) {
      client.connect();
    }
    unsubscribe = client.subscribe(channel, handler);
  });

  onUnmounted(() => {
    unsubscribe?.();
    unsubscribe = null;
  });
};

export const createUseRealtimeChannel = (client: RealtimeClient) => {
  return <T>(channel: string, handler: RealtimeChannelHandler<T>, options?: UseRealtimeChannelOptions) =>
    useRealtimeChannel(client, channel, handler, options);
};

