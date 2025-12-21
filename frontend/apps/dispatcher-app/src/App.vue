<template>
  <div id="app">
    <RouterView v-if="authStore.isInitialized" />
    <div v-else class="loading-screen">
      <div class="spinner"></div>
      <p>Загрузка...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAuthStore } from './stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  await authStore.initialize();
});
</script>

<style scoped>
.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--bg-color);
  background-image: 
    radial-gradient(at 20% 30%, rgba(239, 68, 68, 0.3) 0px, transparent 50%),
    radial-gradient(at 80% 70%, rgba(245, 158, 11, 0.2) 0px, transparent 50%),
    radial-gradient(at 50% 50%, rgba(220, 38, 38, 0.2) 0px, transparent 50%);
  color: white;
  position: relative;
  overflow: hidden;
}

.loading-screen::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-screen p {
  margin-top: 2rem;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-transform: uppercase;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(239, 68, 68, 0.2);
  border-top-color: #ef4444;
  border-right-color: #f59e0b;
  border-bottom-color: #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  position: relative;
  z-index: 1;
  box-shadow: 0 0 30px rgba(239, 68, 68, 0.6);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

