<template>
  <div class="ai">
    <header>
      <div>
        <h2>AI модели</h2>
        <p>Версии, метрики качества и канареечные эксперименты</p>
      </div>
      <button class="primary" @click="schedule">Запланировать обучение</button>
    </header>

    <section class="glass-panel board">
      <article v-for="model in store.models" :key="model.id">
        <div class="head">
          <h3>{{ model.name }}</h3>
          <TagPill :variant="model.status === 'degraded' ? 'critical' : 'outline'">
            {{ statusLabel[model.status] }}
          </TagPill>
        </div>
        <p>Версия {{ model.version }} • Деплой {{ format(model.lastDeployment) }}</p>
        <div class="metrics">
          <div v-for="(value, metric) in model.metrics" :key="metric">
            <p>{{ metric.toUpperCase() }}</p>
            <strong>{{ (value * 100).toFixed(1) }}%</strong>
          </div>
        </div>
        <div class="footer">
          <span>Drift {{ (model.driftScore * 100).toFixed(0) }}%</span>
          <div class="actions">
            <button class="ghost" @click="abTest(model.id)">A/B Test</button>
            <button class="ghost" @click="plan(model.id)">Обучение</button>
          </div>
        </div>
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import TagPill from '@/components/common/TagPill.vue';
import { useAiModelsStore } from '@/stores/aiModels';

const store = useAiModelsStore();

const statusLabel = {
  serving: 'В проде',
  training: 'Тренировка',
  degraded: 'Деградация',
};

const format = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: 'short', hour: 'numeric', minute: 'numeric' }).format(
    new Date(value),
  );

const plan = (modelId: string) => store.planTraining(modelId, '0 2 * * *');
const abTest = (modelId: string) => store.startABTest(modelId, store.models[0].id, 50);
const schedule = () => {
  if (store.models[0]) plan(store.models[0].id);
};

onMounted(() => {
  if (!store.models.length) {
    void store.load();
  }
});
</script>

<style scoped>
.ai {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

article {
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1rem;
  background: rgba(9, 14, 24, 0.8);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.ghost,
.primary {
  border: 0;
  border-radius: 10px;
  padding: 0.5rem 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  align-self: flex-start;
  background: linear-gradient(135deg, #34d399, #22d3ee);
  color: #050912;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
</style>

