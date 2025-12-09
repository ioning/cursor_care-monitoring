import { createUseRealtimeChannel } from '@care-monitoring/realtime';

import { realtimeClient } from '@/services/realtime';

const useChannel = createUseRealtimeChannel(realtimeClient);

export const useRealtimeChannel = <T>(channel: string, handler: (payload: T) => void) => {
  useChannel(channel, handler);
};

