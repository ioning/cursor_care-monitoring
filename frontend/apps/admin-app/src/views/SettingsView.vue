<template>
  <div class="settings">
    <header>
      <div>
        <h2>Настройки системы</h2>
        <p>Глобальные параметры, политика безопасности и feature flags</p>
      </div>
      <button class="ghost" @click="refresh">Синхронизировать</button>
    </header>

    <FeatureFlagList />
    <GlobalSettingsForm />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import FeatureFlagList from '@/components/settings/FeatureFlagList.vue';
import GlobalSettingsForm from '@/components/settings/GlobalSettingsForm.vue';
import { useSettingsStore } from '@/stores/settings';

const store = useSettingsStore();

const refresh = () => store.load();

onMounted(() => {
  if (!store.flags.length) {
    void store.load();
  }
});
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: #fff;
  background: transparent;
  padding: 0.6rem 1rem;
}
</style>

