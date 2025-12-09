<template>
  <div class="billing">
    <header>
      <div>
        <h2>Биллинг и тарифы</h2>
        <p>Планы, транзакции и отчетность</p>
      </div>
      <div class="actions">
        <button class="ghost" @click="store.load">Обновить</button>
        <button class="primary">Экспорт 1С</button>
      </div>
    </header>

    <section class="plans glass-panel">
      <article v-for="plan in store.plans" :key="plan.id">
        <div class="head">
          <h3>{{ plan.name }}</h3>
          <p>{{ plan.price }} {{ plan.currency }}/мес</p>
        </div>
        <ul>
          <li v-for="feature in plan.features" :key="feature">{{ feature }}</li>
        </ul>
        <footer>
          <span>{{ plan.activeSubscribers }} подписок</span>
          <button class="ghost" @click="store.savePlan(plan)">Сохранить</button>
        </footer>
      </article>
    </section>

    <section class="glass-panel transactions">
      <header>
        <h3>Последние транзакции</h3>
        <button class="ghost">Экспорт CSV</button>
      </header>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Сумма</th>
            <th>Статус</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="txn in store.transactions" :key="txn.id">
            <td>{{ txn.id }}</td>
            <td>{{ txn.user }}</td>
            <td>{{ txn.amount }} {{ txn.currency }}</td>
            <td><StatusBadge :status="statusMap[txn.status]" /></td>
            <td>{{ format(txn.processedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

import StatusBadge from '@/components/common/StatusBadge.vue';
import { useBillingStore } from '@/stores/billing';

const store = useBillingStore();

const statusMap = {
  success: 'ok',
  pending: 'warning',
  failed: 'critical',
} as const;

const format = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

onMounted(() => {
  if (!store.plans.length) {
    void store.load();
  }
});
</script>

<style scoped>
.billing {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plans {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

article {
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1rem;
}

.transactions {
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
  text-align: left;
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
  background: linear-gradient(135deg, #fb7185, #f472b6);
  color: #fff;
}
</style>

