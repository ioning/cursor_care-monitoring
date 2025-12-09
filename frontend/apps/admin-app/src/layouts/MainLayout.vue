<template>
  <div class="layout">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="sidebarCollapsed = !sidebarCollapsed" />

    <div class="content">
      <header class="top-bar glass-panel">
        <div class="breadcrumbs">
          <span class="crumb">Care Monitoring</span>
          <span class="separator">/</span>
          <span class="crumb active">{{ activeTitle }}</span>
        </div>

        <div class="actions">
          <button class="action ghost" @click="toggleIncidentMode">
            {{ incidentMode ? 'Выйти из режима инцидента' : 'Режим инцидента' }}
          </button>
          <button class="action primary">Создать пост-мортем</button>
        </div>
      </header>

      <main class="main-scroll">
        <RouterView />
      </main>
    </div>

    <ContextPanel
      :incident-mode="incidentMode"
      :quick-actions="quickActions"
      @toggle-analytics-mode="analyticsMode = !analyticsMode"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, RouterView } from 'vue-router';

import AppSidebar from '@/components/navigation/AppSidebar.vue';
import ContextPanel from '@/components/navigation/ContextPanel.vue';

const route = useRoute();

const sidebarCollapsed = ref(false);
const incidentMode = ref(false);
const analyticsMode = ref(false);

const activeTitle = computed(() => (route.meta.title as string) ?? 'Дашборд');

const quickActions = computed(() => [
  {
    title: 'Выполнить health-check',
    description: 'Запросить свежий статус у всех сервисов',
    shortcut: 'Shift + H',
  },
  {
    title: analyticsMode.value ? 'Выключить аналитический режим' : 'Включить аналитический режим',
    description: 'Расширенные панели сравнения метрик',
    shortcut: 'Shift + A',
  },
  {
    title: 'Экспортировать отчет',
    description: 'PDF / XLSX выгрузка текущего представления',
    shortcut: 'Shift + E',
  },
]);

const toggleIncidentMode = () => {
  incidentMode.value = !incidentMode.value;
};
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: auto 1fr 320px;
  min-height: 100vh;
  background: radial-gradient(circle at top, #0b1630, #050912 70%);
  color: #fff;
}

.content {
  padding: 1.5rem 1.5rem 1.5rem 1rem;
  display: flex;
  flex-direction: column;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  margin-bottom: 1.25rem;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.64);
  font-size: 0.9rem;
}

.crumb {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.crumb.active {
  color: #fff;
  font-weight: 600;
}

.separator {
  margin: 0 0.5rem;
  opacity: 0.5;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

.action {
  border: 0;
  border-radius: 999px;
  font-weight: 600;
  padding: 0.65rem 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action.ghost {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.action.primary {
  background: linear-gradient(135deg, #8c5eff, #3d7fff);
  color: #fff;
  box-shadow: 0 10px 25px rgba(68, 118, 255, 0.35);
}

.main-scroll {
  flex: 1;
  overflow-y: auto;
  padding-right: 0.5rem;
  padding-bottom: 1.5rem;
}

@media (max-width: 1600px) {
  .layout {
    grid-template-columns: auto 1fr;
  }

  .content {
    padding-right: 1rem;
  }

  ContextPanel {
    display: none;
  }
}
</style>

