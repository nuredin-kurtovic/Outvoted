<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
    <GameNavbar v-if="showNavbar" />
    <div class="transition-all duration-500 ease-in-out">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import GameNavbar from './components/GameNavbar.vue';

const route = useRoute();

// Show navbar on all pages except home and game board
const showNavbar = computed(() => {
  return route.path !== '/' && !route.path.startsWith('/game/');
});
</script>
