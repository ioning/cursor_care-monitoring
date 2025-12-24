<template>
  <div class="monitoring">
    <header>
      <div>
        <h2>Системный мониторинг</h2>
        <p>Live показатели инфраструктуры, баз данных и интеграций</p>
      </div>
      <button class="ghost" @click="refresh">Принудительный health-check</button>
    </header>

    <ServicesHealthBoard />

    <RealtimeMetrics />

    <div class="grid">
      <DatabaseInsights />
      <IntegrationStatus />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import DatabaseInsights from '@/components/monitoring/DatabaseInsights.vue';
import IntegrationStatus from '@/components/monitoring/IntegrationStatus.vue';
import RealtimeMetrics from '@/components/monitoring/RealtimeMetrics.vue';
import ServicesHealthBoard from '@/components/monitoring/ServicesHealthBoard.vue';
import { useSystemStore } from '@/stores/system';

const store = useSystemStore();

const refresh = () => store.bootstrap();

onMounted(() => {
  if (!store.health) {
    void store.bootstrap();
  }
});
</script>

<style scoped>
.monitoring {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  background: transparent;
  padding: 0.6rem 1rem;
}
</style>

