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
  background-color: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: var(--shadow-lg);
}

.navbar-brand h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.navbar-nav {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  transition: background-color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: rgba(255, 255, 255, 0.2);
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.main-content {
  flex: 1;
  padding: 2rem;
}
</style>

