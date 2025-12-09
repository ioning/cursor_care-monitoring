<template>
  <section class="glass-panel db">
    <header>
      <div>
        <h3>Базы данных</h3>
        <p>Топ медленных запросов и блокировок</p>
      </div>
      <button class="ghost">Экспорт SQL планов</button>
    </header>

    <table>
      <thead>
        <tr>
          <th>База</th>
          <th>Запрос</th>
          <th>Avg latency</th>
          <th>Locks</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.id">
          <td>{{ row.db }}</td>
          <td>{{ row.query }}</td>
          <td>{{ row.latency }} ms</td>
          <td><StatusBadge :status="row.locks > 5 ? 'warning' : 'ok'" /></td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import StatusBadge from '@/components/common/StatusBadge.vue';

const rows = [
  { id: 1, db: 'auth-db', query: 'SELECT * FROM sessions WHERE ...', latency: 342, locks: 2 },
  { id: 2, db: 'telemetry-db', query: 'INSERT INTO telemetry ...', latency: 520, locks: 8 },
  { id: 3, db: 'analytics-db', query: 'WITH monthly as (...)', latency: 890, locks: 12 },
];
</script>

<style scoped>
.db {
  padding: 1.25rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: #fff;
  border-radius: 10px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}
</style>

