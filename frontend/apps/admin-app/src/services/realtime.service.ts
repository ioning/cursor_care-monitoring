import { createRealtimeClient } from '@care-monitoring/realtime';

export const realtimeClient = createRealtimeClient({
  url: import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws',
  query: () => {
    const token = localStorage.getItem('accessToken');
    const tenant = localStorage.getItem('activeTenant');
    return {
      token,
      tenant,
      channel: 'admin',
    };
  },
});

