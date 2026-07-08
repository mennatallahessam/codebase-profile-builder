import { createRouter, createWebHistory } from 'vue-router';
import HomeView from './views/HomeView.vue';
import ReportView from './views/ReportView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/report/:id', name: 'report', component: ReportView, props: true },
  ],
});

export default router;
