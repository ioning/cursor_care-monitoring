<template>
  <section class="glass-panel map">
    <header>
      <div>
        <h3>Карта сервисов</h3>
        <p>Состояние микросервисов и интеграций</p>
      </div>
      <button class="ghost" @click="$emit('refresh')">Обновить</button>
    </header>

    <div class="services">
      <article v-for="service in services" :key="service.name" class="service-card">
        <div class="service-head">
          <h4>{{ service.name }}</h4>
          <StatusBadge :status="service.status" />
        </div>
        <dl>
          <div>
            <dt>Latency</dt>
            <dd>{{ service.latencyMs }} ms</dd>
          </div>
          <div>
            <dt>Error rate</dt>
            <dd>{{ service.errorRate }}%</dd>
          </div>
        </dl>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import StatusBadge from '@/components/common/StatusBadge.vue';
import { useSystemStore } from '@/stores/system';

defineEmits<{ (e: 'refresh'): void }>();

const systemStore = useSystemStore();
const { health } = storeToRefs(systemStore);

const services = computed(() => health.value?.services ?? []);
</script>

<style scoped>
.map {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h3 {
  margin: 0;
}

p {
  margin: 0.25rem 0 0;
  color: rgba(255, 255, 255, 0.6);
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  border-radius: 10px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.services {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.service-card {
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 14px;
  background: rgba(9, 14, 24, 0.8);
}

.service-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

dl {
  margin: 1rem 0 0;
  display: flex;
  justify-content: space-between;
}

dt {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.8rem;
}

dd {
  margin: 0.25rem 0 0;
  font-weight: 600;
}
</style>

