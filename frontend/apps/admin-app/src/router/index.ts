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
import OrganizationsView from '@/views/OrganizationsView.vue';
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
      {
        path: 'organizations',
        name: 'organizations',
        component: OrganizationsView,
        meta: { title: 'Организации', requiresAuth: true },
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

  console.log('Router guard:', { to: to.path, requiresAuth, user: authStore.user });

  // Если маршрут не требует авторизации (например, /login)
  if (!requiresAuth) {
    next();
    return;
  }

  // Если пользователь уже загружен в store, пропускаем checkAuth
  if (authStore.user && authStore.user.role === 'admin') {
    console.log('Router guard: user already in store, allowing navigation');
    next();
    return;
  }

  // Проверяем наличие токена
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.log('Router guard: no token, redirecting to login');
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  // Проверяем валидность токена и роль пользователя
  console.log('Router guard: calling checkAuth');
  const isAuthenticated = await authStore.checkAuth();
  console.log('Router guard: checkAuth result:', isAuthenticated, 'user:', authStore.user);
  if (!isAuthenticated) {
    console.log('Router guard: not authenticated, redirecting to login');
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }

  console.log('Router guard: allowing navigation');
  next();
});

export default router;

