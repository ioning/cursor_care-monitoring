<template>
  <div class="analytics">
    <header>
      <div>
        <h2>Аналитика и отчеты</h2>
        <p>Глубокий анализ метрик за выбранный период</p>
      </div>
      <div class="actions">
        <button class="ghost" @click="openComparison">Сравнить периоды</button>
        <button class="primary" @click="exportReport">Экспорт PDF</button>
      </div>
    </header>

    <AnalyticsKPIs />

    <div class="grid">
      <RevenueBreakdown />
      <UsageInsights @export="exportReport" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import AnalyticsKPIs from '@/components/analytics/AnalyticsKPIs.vue';
import RevenueBreakdown from '@/components/analytics/RevenueBreakdown.vue';
import UsageInsights from '@/components/analytics/UsageInsights.vue';
import { useAnalyticsStore } from '@/stores/analytics';

const store = useAnalyticsStore();

const exportReport = () => {
  // placeholder for API call
  console.log('export analytics report');
};

const openComparison = () => {
  alert('Функция скоро будет доступна');
};

onMounted(() => {
  if (!store.kpis.length) {
    void store.load();
  }
});
</script>

<style scoped>
.analytics {
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

.actions {
  display: flex;
  gap: 0.5rem;
}

.ghost,
.primary {
  border: 0;
  border-radius: 10px;
  padding: 0.6rem 1rem;
  font-weight: 600;
  cursor: pointer;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.primary {
  background: linear-gradient(135deg, #8c5eff, #3d7fff);
  color: #fff;
}
</style>

