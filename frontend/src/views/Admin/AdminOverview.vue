<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Admin Overview</h1>
    
    <!-- Stats Grid: 4 columns -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
      <!-- Active Games -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500">Active Games</div>
            <div class="text-3xl font-bold text-gray-900">{{ stats.activeGames }}</div>
          </div>
        </div>
      </div>

      <!-- Registered Users -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500">Registered Users</div>
            <div class="text-3xl font-bold text-gray-900">{{ stats.users }}</div>
          </div>
        </div>
      </div>

      <!-- Total Population -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500">Total Population</div>
            <div class="text-3xl font-bold text-gray-900">{{ formatNumber(stats.population) }}</div>
          </div>
        </div>
      </div>

      <!-- Candidates -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <div class="text-sm font-medium text-gray-500">Candidates</div>
            <div class="text-3xl font-bold text-gray-900">{{ stats.candidates }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const stats = ref({
  activeGames: 0,
  users: 0,
  population: 0,
  candidates: 0
});

function formatNumber(num) {
  return (num || 0).toLocaleString();
}

async function loadStats() {
  try {
    const response = await axios.get(`${API_URL}/admin/stats`);
    const data = response.data.stats;
    stats.value = {
      activeGames: data.active_games || 0,
      users: data.users || 0,
      population: data.total_population || 0,
      candidates: data.candidates || 0
    };
  } catch (error) {
    console.error('Failed to load stats:', error);
  }
}

onMounted(loadStats);
</script>
