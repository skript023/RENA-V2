// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/components/Login.vue'
import Home from '@/modules/home/Home.vue'
import Tiket from '@/modules/user/support/Tiket.vue'
import System from '@/modules/system/System.vue'
import Configs from '@/modules/configs/configs.vue'
import Logs from '@/modules/log/Logs.vue'
import NotFound from '@/components/NotFound.vue'
import Activity from '@/modules/activity/activity.vue'

const routes = [
  { 
    path: '/', 
    name: "home",
    meta: { guestOnly: true },
    component: Login 
  },
  { 
    path: '/dashboard', 
    name: 'Dashboard',
    meta: { requiresAuth: true },
    component: Home 
  },
  // { 
  //   path: '/user/activity', 
  //   name: 'Activity',
  //   meta: { requiresAuth: true },
  //   component: Activity 
  // },
  { 
    path: '/ticket', 
    name: 'Ticket',
    meta: { requiresAuth: true },
    component: Tiket 
  },
  { 
    path: '/system', 
    name: 'System',
    meta: { requiresAuth: true },
    component: System 
  },
  { 
    path: '/logs', 
    name: 'Logs',
    meta: { requiresAuth: true },
    component: Logs 
  },
  { 
    path: '/activity', 
    name: 'Activity',
    meta: { requiresAuth: true },
    component: Activity 
  },
  { 
    path: '/config', 
    name: 'Job Configuration',
    meta: { requiresAuth: true },
    component: Configs
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem("ACCESS_TOKEN"); // atau pinia store

  if (to.meta.requiresAuth && !token) {
    return next("/");
  }

  if (to.meta.guestOnly && token) {
    return next("/dashboard");
  }

  next();
});

export default router
