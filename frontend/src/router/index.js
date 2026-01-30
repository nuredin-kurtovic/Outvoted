import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/games',
    name: 'Games',
    component: () => import('../views/GamesList.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:id',
    name: 'Game',
    component: () => import('../views/GameBoard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:id/lobby',
    name: 'GameLobby',
    component: () => import('../views/GameLobby.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:id/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/game/:id/turn/:turnNumber',
    name: 'TurnSummary',
    component: () => import('../views/TurnSummaryPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { requiresAuth: true }
  },
  // Admin routes
  {
    path: '/admin',
    component: () => import('../views/Admin/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
    children: [
      {
        path: '',
        name: 'AdminOverview',
        component: () => import('../views/Admin/AdminOverview.vue')
      },
      {
        path: 'regions',
        name: 'AdminRegions',
        component: () => import('../views/Admin/RegionsAdmin.vue')
      },
      {
        path: 'candidates',
        name: 'AdminCandidates',
        component: () => import('../views/Admin/CandidatesAdmin.vue')
      },
      {
        path: 'actions',
        name: 'AdminActions',
        component: () => import('../views/Admin/ActionsAdmin.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/Admin/UsersAdmin.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  // If user is logged in and tries to access home/login/register, redirect to games
  if (authStore.isAuthenticated && (to.name === 'Home' || to.name === 'Login' || to.name === 'Register')) {
    next({ name: 'Games' });
    return;
  }
  
  // If route requires auth and user is not authenticated, redirect to login
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
    return;
  }
  
  next();
});

export default router;
