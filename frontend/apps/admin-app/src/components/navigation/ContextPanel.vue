<template>
  <aside class="context-panel glass-panel">
    <div class="section-header">
      <h3>Контекст</h3>
      <span class="mode" :class="{ active: incidentMode }">
        {{ incidentMode ? 'Режим инцидента' : 'Стандартный режим' }}
      </span>
    </div>

    <div class="section">
      <h4>Быстрые действия</h4>
      <div class="actions">
        <button
          v-for="action in quickActions"
          :key="action.title"
          class="quick-action"
        >
          <div>
            <p>{{ action.title }}</p>
            <small>{{ action.description }}</small>
          </div>
          <code>{{ action.shortcut }}</code>
        </button>
      </div>
    </div>

    <div class="section">
      <h4>Live статус</h4>
      <ul class="status-list">
        <li v-for="item in status" :key="item.label">
          <span>{{ item.label }}</span>
          <StatusBadge :status="item.status" />
        </li>
      </ul>
    </div>

    <div class="section">
      <h4>Коммуникация</h4>
      <div class="action-row">
        <button class="primary">Открыть канал Slack</button>
        <button class="ghost" @click="$emit('toggle-analytics-mode')">Ан. режим</button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/common/StatusBadge.vue';

defineProps<{
  incidentMode: boolean;
  quickActions: Array<{ title: string; description: string; shortcut: string }>;
}>();

defineEmits<{ (e: 'toggle-analytics-mode'): void }>();

const status = [
  { label: 'API Gateway', status: 'warning' },
  { label: 'Billing service', status: 'ok' },
  { label: 'AI pipeline', status: 'critical' },
  { label: 'Notification hub', status: 'ok' },
];
</script>

<style scoped>
.context-panel {
  margin: 1.5rem 1.5rem 1.5rem 0;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  height: calc(100vh - 3rem);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-header h3 {
  margin: 0;
}

.mode {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
}

.mode.active {
  color: #ff7a7a;
}

.section h4 {
  margin: 0 0 0.5rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.65);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quick-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 0.75rem;
  border-radius: 12px;
  color: inherit;
  cursor: pointer;
}

.quick-action p {
  margin: 0;
  font-weight: 600;
}

.quick-action small {
  color: rgba(255, 255, 255, 0.6);
}

code {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.2rem 0.45rem;
  border-radius: 6px;
  font-size: 0.75rem;
}

.status-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.status-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-row {
  display: flex;
  gap: 0.5rem;
}

.primary,
.ghost {
  flex: 1;
  border: 0;
  border-radius: 10px;
  padding: 0.65rem;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background: linear-gradient(135deg, #25c9ff, #8f7cff);
  color: #fff;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
</style>

