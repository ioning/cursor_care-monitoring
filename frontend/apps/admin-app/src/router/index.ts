import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DashboardView from '@/views/DashboardView.vue';
import UsersView from '@/views/UsersView.vue';
import MonitoringView from '@/views/MonitoringView.vue';
import AnalyticsView from '@/views/AnalyticsView.vue';
import AiModelsView from '@/views/AiModelsView.vue';
import IncidentsView from '@/views/IncidentsView.vue';
import SettingsView from '@/views/SettingsView.vue';
import BillingView from '@/views/BillingView.vue';
import LoginView from '@/views/LoginView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Вход', requiresAuth: false },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: 'Системный дашборд', requiresAuth: true },
      },
      {
        path: 'users',
        name: 'users',
        component: UsersView,
        meta: { title: 'Управление пользователями', requiresAuth: true },
      },
      {
        path: 'monitoring',
        name: 'monitoring',
        component: MonitoringView,
        meta: { title: 'Системный мониторинг', requiresAuth: true },
      },
      {
        path: 'analytics',
        name: 'analytics',
        component: AnalyticsView,
        meta: { title: 'Аналитика и отчеты', requiresAuth: true },
      },
      {
        path: 'ai-models',
        name: 'ai-models',
        component: AiModelsView,
        meta: { title: 'AI модели', requiresAuth: true },
      },
      {
        path: 'incidents',
        name: 'incidents',
        component: IncidentsView,
        meta: { title: 'Инциденты', requiresAuth: true },
      },
      {
        path: 'settings',
        name: 'settings',
        component: SettingsView,
        meta: { title: 'Настройки системы', requiresAuth: true },
      },
      {
        path: 'billing',
        name: 'billing',
        component: BillingView,
        meta: { title: 'Биллинг и тарифы', requiresAuth: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  document.title = `Admin | ${to.meta.title ?? 'Care Monitoring'}`;

  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth !== false;

  // Если маршрут не требует авторизации (например, /login)
  if (!requiresAuth) {
    next();
    return;
  }

  // Проверяем наличие токена
  const token = localStorage.getItem('accessToken');
  if (!token) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // Проверяем валидность токена и роль пользователя
  const isAuthenticated = await authStore.checkAuth();
  if (!isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  next();
});

export default router;

