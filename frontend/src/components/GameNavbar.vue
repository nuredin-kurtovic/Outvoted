<template>
  <nav class="bg-white border-b border-gray-200 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-14">
        <!-- Logo -->
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
          </div>
          <span class="font-bold text-gray-900 hidden sm:block">OUTVOTED</span>
        </router-link>

        <!-- Center Nav -->
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-1">
          <router-link
            to="/games"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            :class="$route.path.startsWith('/games') && !$route.path.includes('/game/') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'"
          >
            Games
          </router-link>
          
          <template v-if="$route.params.id">
            <span class="text-gray-300 mx-1">/</span>
            <router-link
              :to="`/game/${$route.params.id}`"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              :class="$route.path === `/game/${$route.params.id}` ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              Play
            </router-link>
            <router-link
              :to="`/game/${$route.params.id}/dashboard`"
              class="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              :class="$route.path === `/game/${$route.params.id}/dashboard` ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'"
            >
              Stats
            </router-link>
          </template>
        </div>

        <!-- Right Side -->
        <div class="flex items-center gap-2">
          <template v-if="authStore.isAuthenticated">
            <!-- User Menu (clickable to settings) -->
            <router-link
              to="/settings"
              class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div class="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {{ authStore.user?.username?.charAt(0).toUpperCase() }}
              </div>
              <span class="text-sm font-medium text-gray-700 hidden sm:block">{{ authStore.user?.username }}</span>
              <svg class="w-4 h-4 text-gray-400 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </router-link>
            
            <!-- Logout -->
            <button
              @click="handleLogout"
              class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </template>
          
          <template v-else>
            <router-link to="/login" class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium">
              Login
            </router-link>
            <router-link to="/register" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium">
              Sign Up
            </router-link>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push('/');
}
</script>
