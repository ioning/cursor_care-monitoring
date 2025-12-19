import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import PrivacyView from '@/views/PrivacyView.vue';
import TermsView from '@/views/TermsView.vue';
import ArticlesView from '@/views/ArticlesView.vue';
import ArticleView from '@/views/ArticleView.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Care Monitoring - Система мониторинга здоровья' },
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Вход в систему' },
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { title: 'Регистрация' },
  },
  {
    path: '/privacy',
    name: 'privacy',
    component: PrivacyView,
    meta: { title: 'Политика конфиденциальности — Care Monitoring' },
  },
  {
    path: '/terms',
    name: 'terms',
    component: TermsView,
    meta: { title: 'Пользовательское соглашение — Care Monitoring' },
  },
  {
    path: '/articles',
    name: 'articles',
    component: ArticlesView,
    meta: { title: 'База знаний — Care Monitoring' },
  },
  {
    path: '/articles/:slug',
    name: 'article',
    component: ArticleView,
    meta: { title: 'Статья — Care Monitoring' },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title as string || 'Care Monitoring';
  next();
});

export default router;
