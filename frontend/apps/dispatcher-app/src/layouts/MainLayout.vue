<template>
  <div class="layout">
    <nav class="navbar">
      <div class="navbar-brand">
        <h1>🚨 Dispatcher</h1>
      </div>
      <div class="navbar-nav">
        <router-link to="/dashboard" class="nav-link">Панель</router-link>
        <router-link to="/calls" class="nav-link">Вызовы</router-link>
        <router-link to="/map" class="nav-link">Карта</router-link>
      </div>
      <div class="navbar-user">
        <span>{{ authStore.user?.fullName || 'Dispatcher' }}</span>
        <button @click="handleLogout" class="btn btn-secondary">Выход</button>
      </div>
    </nav>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  background: var(--gradient-primary);
  color: white;
  padding: 1.25rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-glow-primary);
  position: relative;
  z-index: 10;
}

.navbar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.95) 100%);
  z-index: -1;
}

.navbar-brand h1 {
  font-size: 1.75rem;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.5px;
}

.navbar-nav {
  display: flex;
  gap: 0.5rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 600;
  padding: 0.625rem 1.25rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  font-size: 0.8125rem;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  transition: left 0.3s;
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-weight: 600;
  font-size: 0.9375rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: var(--bg-color);
}
</style>

