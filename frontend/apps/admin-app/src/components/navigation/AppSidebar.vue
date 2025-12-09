<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="logo">
      <span v-if="!collapsed">Care Admin</span>
      <span v-else>CA</span>
    </div>

    <nav class="menu">
      <RouterLink
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        class="menu-item"
        active-class="active"
      >
        <span class="icon">{{ item.icon }}</span>
        <span v-if="!collapsed">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="footer" :class="{ collapsed }">
      <button class="collapse" @click="$emit('toggle')">
        {{ collapsed ? '→' : '←' }}
      </button>
      <div v-if="!collapsed">
        <p class="hint">Shift + /</p>
        <small>Горячие клавиши</small>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  collapsed: boolean;
}>();

defineEmits<{ (e: 'toggle'): void }>();

const menuItems = [
  { label: 'Дашборд', path: '/', icon: '📊' },
  { label: 'Пользователи', path: '/users', icon: '👥' },
  { label: 'Мониторинг', path: '/monitoring', icon: '🛰️' },
  { label: 'Аналитика', path: '/analytics', icon: '📈' },
  { label: 'AI модели', path: '/ai-models', icon: '🤖' },
  { label: 'Инциденты', path: '/incidents', icon: '⚠️' },
  { label: 'Настройки', path: '/settings', icon: '⚙️' },
  { label: 'Биллинг', path: '/billing', icon: '💳' },
];
</script>

<style scoped>
.sidebar {
  width: 240px;
  background: rgba(6, 10, 19, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.sidebar.collapsed {
  width: 96px;
  align-items: center;
}

.logo {
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 2rem;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1rem;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.menu-item .icon {
  font-size: 1.1rem;
}

.menu-item.active {
  background: linear-gradient(135deg, rgba(62, 137, 255, 0.25), rgba(140, 94, 255, 0.2));
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(140, 94, 255, 0.6);
}

.footer {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.footer.collapsed {
  flex-direction: column;
  gap: 0.5rem;
}

.collapse {
  border: 0;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.hint {
  margin: 0;
  font-weight: 700;
}
</style>

