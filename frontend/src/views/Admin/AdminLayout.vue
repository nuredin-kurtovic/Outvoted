<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Admin Navigation -->
    <nav class="bg-slate-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <div class="flex items-center">
            <router-link to="/games" class="flex items-center gap-2 text-gray-300 hover:text-white mr-8">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to Game
            </router-link>
            <span class="text-xl font-bold">Admin Panel</span>
          </div>
        </div>
        <!-- Navigation Tabs -->
        <div class="flex items-center space-x-1 pb-2 overflow-x-auto">
          <router-link 
            v-for="link in navLinks" 
            :key="link.path" 
            :to="link.path"
            class="px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap"
            :class="isActive(link.path) ? 'bg-slate-900 text-white' : 'text-gray-300 hover:bg-slate-700 hover:text-white'"
          >
            {{ link.name }}
          </router-link>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();

const navLinks = [
  { name: 'Overview', path: '/admin' },
  { name: 'Regions', path: '/admin/regions' },
  { name: 'Candidates', path: '/admin/candidates' },
  { name: 'Actions', path: '/admin/actions' },
  { name: 'Users', path: '/admin/users' }
];

function isActive(path) {
  if (path === '/admin') {
    return route.path === '/admin';
  }
  return route.path === path;
}
</script>
