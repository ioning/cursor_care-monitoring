<template>
  <section class="glass-panel flags">
    <header>
      <h3>Feature flags</h3>
      <p>Постепенный rollout функций</p>
    </header>

    <ul>
      <li v-for="flag in flags" :key="flag.key">
        <div class="info">
          <h4>{{ flag.name }}</h4>
          <p>{{ flag.description }}</p>
          <small>Среда: {{ flag.environments.join(', ') }}</small>
        </div>
        <div class="controls">
          <input type="range" min="0" max="100" v-model.number="flag.rollout" @change="update(flag)" />
          <label class="switch">
            <input type="checkbox" :checked="flag.enabled" @change="toggle(flag)" />
            <span />
          </label>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';

import { useSettingsStore } from '@/stores/settings';

const store = useSettingsStore();
const { flags } = storeToRefs(store);

const toggle = (flag: (typeof flags.value)[number]) => {
  void store.toggleFlag(flag.key, !flag.enabled);
};

const update = (flag: (typeof flags.value)[number]) => {
  void store.updateRollout(flag.key, flag.rollout);
};
</script>

<style scoped>
.flags {
  padding: 1.25rem;
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info {
  flex: 1;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

input[type='range'] {
  width: 160px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch span {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  transition: 0.2s;
}

.switch span::before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.2s;
}

.switch input:checked + span {
  background-color: #4ade80;
}

.switch input:checked + span::before {
  transform: translateX(22px);
}
</style>

