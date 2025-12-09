<template>
  <section class="glass-panel integrations">
    <header>
      <h3>Интеграции</h3>
      <p>Внешние сервисы и SLA</p>
    </header>
    <ul>
      <li v-for="item in integrations" :key="item.name">
        <div>
          <h4>{{ item.name }}</h4>
          <small>{{ item.sla }} SLA</small>
        </div>
        <StatusBadge :status="item.status" />
        <button class="ghost">Details</button>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/common/StatusBadge.vue';

const integrations = [
  { name: 'СМП API', status: 'ok', sla: '99.9%' },
  { name: 'Платежный шлюз', status: 'warning', sla: '99.5%' },
  { name: 'Push уведомления', status: 'critical', sla: '99.0%' },
];
</script>

<style scoped>
.integrations {
  padding: 1.25rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  border-radius: 8px;
  padding: 0.35rem 0.8rem;
  margin-left: auto;
}
</style>

