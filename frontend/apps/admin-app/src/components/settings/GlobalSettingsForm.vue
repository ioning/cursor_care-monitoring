<template>
  <section class="glass-panel settings">
    <header>
      <h3>Глобальные настройки</h3>
      <p>Региональные параметры, безопасность и бэкапы</p>
    </header>
    <div class="grid">
      <label v-for="setting in globals" :key="setting.key">
        <span>{{ setting.label }}</span>
        <input v-model="localValues[setting.key]" @blur="save(setting)" />
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useSettingsStore } from '@/stores/settings';

const store = useSettingsStore();
const { globals } = storeToRefs(store);

const localValues = reactive<Record<string, string>>({});

watch(
  () => globals.value,
  (next) => {
    next.forEach((item) => {
      localValues[item.key] = item.value;
    });
  },
  { immediate: true },
);

const save = (setting: (typeof globals.value)[number]) => {
  if (localValues[setting.key] !== setting.value) {
    void store.updateSetting(setting.key, localValues[setting.key]);
  }
};
</script>

<style scoped>
.settings {
  padding: 1.5rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

span {
  color: rgba(255, 255, 255, 0.7);
}

input {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  border-radius: 10px;
  padding: 0.45rem 0.6rem;
}
</style>

