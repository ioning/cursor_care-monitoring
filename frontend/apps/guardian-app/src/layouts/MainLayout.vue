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
  width: 280px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  position: relative;
  z-index: 10;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
  pointer-events: none;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.sidebar-header h2 {
  font-size: 1.75rem;
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 1;
}

.sidebar-nav {
  flex: 1;
  padding: 1.5rem 1rem;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1.25rem;
  border-radius: var(--radius);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 0.5rem;
  position: relative;
  font-weight: 500;
  font-size: 0.9375rem;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 0;
  background: var(--gradient-primary);
  border-radius: 0 3px 3px 0;
  transition: height 0.3s;
}

.nav-item:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  transform: translateX(4px);
}

.nav-item:hover::before {
  height: 60%;
}

.nav-item.router-link-active {
  background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%);
  color: var(--primary-light);
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.nav-item.router-link-active::before {
  height: 100%;
}

.nav-icon {
  font-size: 1.375rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.sidebar-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-tertiary);
  position: relative;
  z-index: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  border-radius: var(--radius);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 0.9375rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 0.25rem;
}

.user-email {
  font-size: 0.8125rem;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}

.top-bar {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow);
  position: relative;
  z-index: 5;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.top-bar-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.critical-alert-banner {
  background: linear-gradient(135deg, var(--danger) 0%, var(--danger-dark) 100%);
  color: white;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  animation: pulse-glow 2s infinite;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 4px 25px rgba(239, 68, 68, 0.7);
  }
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  position: relative;
}
</style>

