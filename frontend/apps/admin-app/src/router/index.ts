import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import DashboardView from '@/views/DashboardView.vue';
import UsersView from '@/views/UsersView.vue';
import MonitoringView from '@/views/MonitoringView.vue';
import AnalyticsView from '@/views/AnalyticsView.vue';
import AiModelsView from '@/views/AiModelsView.vue';
import IncidentsView from '@/views/IncidentsView.vue';
import SettingsView from '@/views/SettingsView.vue';
import BillingView from '@/views/BillingView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: 'Системный дашборд', requiresAuth: true },
  },
  {
    path: '/users',
    name: 'users',
    component: UsersView,
    meta: { title: 'Управление пользователями', requiresAuth: true },
  },
  {
    path: '/monitoring',
    name: 'monitoring',
    component: MonitoringView,
    meta: { title: 'Системный мониторинг', requiresAuth: true },
  },
  {
    path: '/analytics',
    name: 'analytics',
    component: AnalyticsView,
    meta: { title: 'Аналитика и отчеты', requiresAuth: true },
  },
  {
    path: '/ai-models',
    name: 'ai-models',
    component: AiModelsView,
    meta: { title: 'AI модели', requiresAuth: true },
  },
  {
    path: '/incidents',
    name: 'incidents',
    component: IncidentsView,
    meta: { title: 'Инциденты', requiresAuth: true },
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView,
    meta: { title: 'Настройки системы', requiresAuth: true },
  },
  {
    path: '/billing',
    name: 'billing',
    component: BillingView,
    meta: { title: 'Биллинг и тарифы', requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = `Admin | ${to.meta.title ?? 'Care Monitoring'}`;
  // TODO: integrate with auth service, placeholder for now
  next();
});

export default router;

