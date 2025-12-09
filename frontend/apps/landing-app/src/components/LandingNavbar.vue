<template>
  <nav class="navbar">
    <div class="container">
      <div class="nav-content">
        <RouterLink to="/" class="logo" @click="closeMobileMenu">
          <span class="logo-icon">🏥</span>
          <span class="logo-text">Care Monitoring</span>
        </RouterLink>

        <button
          class="mobile-menu-button"
          type="button"
          @click="toggleMobileMenu"
          aria-label="Переключить меню"
        >
          <span v-if="!isMobileMenuOpen">Меню</span>
          <span v-else>Закрыть</span>
        </button>

        <div :class="['nav-links', { open: isMobileMenuOpen }]">
          <a href="#features" class="nav-link" @click="handleAnchorClick">Возможности</a>
          <a href="#health-articles" class="nav-link" @click="handleAnchorClick">О здоровье</a>
          <a href="#business" class="nav-link" @click="handleAnchorClick">Для бизнеса</a>
          <a href="#pricing" class="nav-link" @click="handleAnchorClick">Тарифы</a>
          <a href="#contact" class="nav-link" @click="handleAnchorClick">Контакты</a>
          <RouterLink to="/login" class="btn btn-outline" @click="closeMobileMenu">
            Войти
          </RouterLink>
          <RouterLink to="/register" class="btn btn-primary" @click="closeMobileMenu">
            Начать
          </RouterLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const isMobileMenuOpen = ref(false);
const route = useRoute();

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const handleAnchorClick = () => {
  closeMobileMenu();
};

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  }
);
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  z-index: 1000;
  padding: 1rem 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  transition: transform 0.2s;
}

.logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  font-size: 2rem;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-link {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-link:hover {
  color: var(--primary);
}

.mobile-menu-button {
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: white;
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-menu-button:hover {
  border-color: var(--primary);
  color: var(--primary);
}

@media (max-width: 768px) {
  .nav-content {
    flex-wrap: wrap;
  }

  .mobile-menu-button {
    display: inline-flex;
  }

  .nav-links {
    width: 100%;
    display: none;
    flex-direction: column;
    align-items: stretch;
    padding: 1rem;
    margin-top: 0.5rem;
    gap: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 10px 25px rgba(15, 23, 42, 0.05);
  }

  .nav-links.open {
    display: flex;
  }

  .nav-link,
  .nav-links .btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
}
</style>


