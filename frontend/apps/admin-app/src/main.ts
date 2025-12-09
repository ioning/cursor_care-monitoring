import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import VueApexCharts from 'vue3-apexcharts';

import App from './App.vue';
import router from './router';
import './style.css';
import { realtimeClient } from '@/services/realtime.service';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(VueApexCharts);

app.mount('#app');

realtimeClient.connect();

