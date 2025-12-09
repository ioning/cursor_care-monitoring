<template>
  <section class="glass-panel usage">
    <header>
      <div>
        <h3>Использование функций</h3>
        <p>Популярность ключевых сценариев</p>
      </div>
      <button class="ghost" @click="$emit('export')">Экспорт</button>
    </header>

    <div class="list">
      <article v-for="item in usage" :key="item.feature">
        <div>
          <h4>{{ item.feature }}</h4>
          <p>{{ item.usage }}% активных пользователей</p>
        </div>
        <Sparkline :data="item.trend" color="#f472b6" />
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import Sparkline from '@/components/common/Sparkline.vue';
import { useAnalyticsStore } from '@/stores/analytics';

defineEmits<{ (e: 'export'): void }>();

const store = useAnalyticsStore();
const { usage } = storeToRefs(store);
</script>

<style scoped>
.usage {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

article {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  background: transparent;
  color: #fff;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}
</style>

