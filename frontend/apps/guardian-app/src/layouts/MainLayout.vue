<template>
  <div class="main-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>Care Monitoring</h2>
      </div>
      <nav class="sidebar-nav">
        <RouterLink to="/dashboard" class="nav-item">
          <span class="nav-icon">📊</span>
          <span>Дашборд</span>
        </RouterLink>
        <RouterLink to="/wards" class="nav-item">
          <span class="nav-icon">👥</span>
          <span>Подопечные</span>
        </RouterLink>
        <RouterLink to="/devices" class="nav-item">
          <span class="nav-icon">⌚</span>
          <span>Устройства</span>
        </RouterLink>
        <RouterLink to="/alerts" class="nav-item">
          <span class="nav-icon">🔔</span>
          <span>Алерты</span>
          <span v-if="alertsStore.criticalAlerts.length > 0" class="badge badge-danger">
            {{ alertsStore.criticalAlerts.length }}
          </span>
        </RouterLink>
        <RouterLink to="/settings" class="nav-item">
          <span class="nav-icon">⚙️</span>
          <span>Настройки</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">{{ authStore.user?.fullName.charAt(0) }}</div>
          <div class="user-details">
            <div class="user-name">{{ authStore.user?.fullName }}</div>
            <div class="user-email">{{ authStore.user?.email }}</div>
          </div>
        </div>
        <button @click="handleLogout" class="btn btn-secondary">Выйти</button>
      </div>
    </aside>
    <main class="main-content">
      <header class="top-bar">
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="top-bar-actions">
          <div v-if="alertsStore.criticalAlerts.length > 0" class="critical-alert-banner">
            ⚠️ {{ alertsStore.criticalAlerts.length }} критических алерта
          </div>
        </div>
      </header>
      <div class="content-wrapper">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useAlertsStore } from '../stores/alerts';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const alertsStore = useAlertsStore();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    Dashboard: 'Дашборд',
    Wards: 'Подопечные',
    WardDetail: 'Детали подопечного',
    Devices: 'Устройства',
    Alerts: 'Алерты',
    Settings: 'Настройки',
  };
  return titles[route.name as string] || 'Care Monitoring';
});

const handleLogout = async () => {
  await authStore.logout();
};

// Fetch alerts on mount
import { onMounted } from 'vue';
onMounted(() => {
  alertsStore.fetchAlerts();
});
</script>

<style scoped>
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
}

.sidebar-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius);
  color: var(--gray-700);
  text-decoration: none;
  transition: all 0.2s;
  margin-bottom: 0.5rem;
  position: relative;
}

.nav-item:hover {
  background-color: var(--gray-100);
  color: var(--primary);
}

.nav-item.router-link-active {
  background-color: rgba(102, 126, 234, 0.1);
  color: var(--primary);
  font-weight: 500;
}

.nav-icon {
  font-size: 1.25rem;
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--gray-200);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.75rem;
  color: var(--gray-500);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--gray-50);
}

.top-bar {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--gray-900);
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.critical-alert-banner {
  background-color: var(--danger);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 500;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
}
</style>

