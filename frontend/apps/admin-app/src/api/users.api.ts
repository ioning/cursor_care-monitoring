import { apiClient } from './client';

const useMocks = import.meta.env.VITE_USE_MOCKS === 'true';

export type UserRole = 'guardian' | 'dispatcher' | 'admin' | 'operator';

export type UserItem = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'blocked' | 'pending';
  lastActiveAt: string;
  region: string;
};

const mockUsers: UserItem[] = Array.from({ length: 32 }).map((_, idx) => ({
  id: `user-${idx}`,
  name: `Пользователь ${idx + 1}`,
  email: `user${idx}@care.dev`,
  role: ['guardian', 'dispatcher', 'admin', 'operator'][idx % 4] as UserRole,
  status: ['active', 'blocked', 'pending'][idx % 3] as UserItem['status'],
  lastActiveAt: new Date(Date.now() - idx * 36 * 60 * 1000).toISOString(),
  region: ['RU-MOW', 'RU-SPE', 'RU-KDA'][idx % 3],
}));

export const fetchUsers = async (params?: Record<string, string>): Promise<UserItem[]> => {
  if (useMocks) {
    return Promise.resolve(structuredClone(mockUsers));
  }

  const { data } = await apiClient.get<{ data: UserItem[] }>('/users', { params });
  return data.data;
};

export const bulkUpdateRoles = async (payload: { userIds: string[]; role: UserRole }) => {
  if (useMocks) {
    return Promise.resolve({ success: true });
  }

  await apiClient.post('/users/bulk/role', payload);
};

export const exportUsers = async (format: 'csv' | 'xlsx') => {
  if (useMocks) {
    return Promise.resolve(new Blob());
  }

  const response = await apiClient.get(`/users/export`, {
    params: { format },
    responseType: 'blob',
  });
  return response.data;
};

