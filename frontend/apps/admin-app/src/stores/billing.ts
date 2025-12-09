import { defineStore } from 'pinia';

import { fetchPlans, fetchTransactions, updatePlan, type PlanItem, type Transaction } from '@/api/billing.api';

type State = {
  plans: PlanItem[];
  transactions: Transaction[];
  loading: boolean;
};

export const useBillingStore = defineStore('billing', {
  state: (): State => ({
    plans: [],
    transactions: [],
    loading: false,
  }),
  actions: {
    async load() {
      this.loading = true;
      try {
        const [plans, transactions] = await Promise.all([fetchPlans(), fetchTransactions()]);
        this.plans = plans;
        this.transactions = transactions;
      } finally {
        this.loading = false;
      }
    },
    async savePlan(plan: PlanItem) {
      await updatePlan(plan);
      this.plans = this.plans.map((item) => (item.id === plan.id ? plan : item));
    },
  },
});

