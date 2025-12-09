import { defineStore } from 'pinia';

import { bulkUpdateRoles, exportUsers, fetchUsers, type UserItem, type UserRole } from '@/api/users.api';

type Filters = {
  role: UserRole | 'all';
  status: UserItem['status'] | 'all';
  query: string;
};

type State = {
  items: UserItem[];
  selectedIds: Set<string>;
  loading: boolean;
  filters: Filters;
};

export const useUsersStore = defineStore('users', {
  state: (): State => ({
    items: [],
    selectedIds: new Set(),
    loading: false,
    filters: {
      role: 'all',
      status: 'all',
      query: '',
    },
  }),
  persist: {
    paths: ['filters'],
  },
  getters: {
    filtered(state) {
      return state.items.filter((user) => {
        const roleMatch = state.filters.role === 'all' || user.role === state.filters.role;
        const statusMatch = state.filters.status === 'all' || user.status === state.filters.status;
        const queryMatch =
          !state.filters.query ||
          user.name.toLowerCase().includes(state.filters.query.toLowerCase()) ||
          user.email.toLowerCase().includes(state.filters.query.toLowerCase());
        return roleMatch && statusMatch && queryMatch;
      });
    },
    allSelected(state) {
      return state.selectedIds.size > 0 && state.selectedIds.size === state.items.length;
    },
  },
  actions: {
    async load() {
      this.loading = true;
      try {
        this.items = await fetchUsers({
          role: this.filters.role === 'all' ? undefined : this.filters.role,
          status: this.filters.status === 'all' ? undefined : this.filters.status,
          query: this.filters.query || undefined,
        });
      } finally {
        this.loading = false;
      }
    },
    toggleSelect(id: string) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
    },
    clearSelection() {
      this.selectedIds.clear();
    },
    selectAll() {
      this.selectedIds = new Set(this.items.map((user) => user.id));
    },
    async bulkRoleChange(role: UserRole) {
      const ids = Array.from(this.selectedIds);
      if (!ids.length) return;
      await bulkUpdateRoles({ userIds: ids, role });
      this.items = this.items.map((user) => (this.selectedIds.has(user.id) ? { ...user, role } : user));
    },
    async export(format: 'csv' | 'xlsx') {
      const blob = await exportUsers(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `users-${Date.now()}.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    },
  },
});

