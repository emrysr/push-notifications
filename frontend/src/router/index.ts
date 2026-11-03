import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SendView from '../views/SendView.vue'
import PageView from '../views/PageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/send', name: 'send', component: SendView },
    { path: '/:pathMatch(.*)*', name: 'page', component: PageView },
  ],
})

export default router
