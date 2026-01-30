<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
    <!-- Background decoration -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 right-20 w-72 h-72 bg-yellow-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 left-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    
    <div class="max-w-md w-full relative z-10">
      <div class="bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 shadow-2xl border-2 border-gray-100">
        <!-- Header -->
        <div class="text-center mb-8">
          <div class="inline-block bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl p-4 mb-6 shadow-lg transform hover:rotate-6 transition-transform duration-300">
            <span class="text-5xl">🎯</span>
          </div>
          <h2 class="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-3">
            Start Your Campaign
          </h2>
          <p class="text-gray-600 text-base sm:text-lg">Create your account to begin</p>
        </div>
        
        <!-- Form -->
        <form @submit.prevent="handleRegister" class="space-y-6">
          <div class="space-y-5">
            <div>
              <label for="username" class="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                id="username"
                v-model="username"
                name="username"
                type="text"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                placeholder="Choose a username"
              />
            </div>
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                id="password"
                v-model="password"
                name="password"
                type="password"
                required
                class="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition-all duration-200"
                placeholder="Create a password"
              />
            </div>
          </div>

          <div v-if="error" class="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p class="text-red-700 text-sm font-semibold text-center">{{ error }}</p>
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-navy-900 px-6 py-4 rounded-xl font-bold text-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed disabled:transform-none"
            >
              {{ loading ? '⏳ Creating account...' : '🚀 Start Campaign' }}
            </button>
          </div>

          <div class="text-center pt-2">
            <router-link to="/login" class="text-gray-600 hover:text-blue-600 font-semibold transition-colors duration-200 text-sm sm:text-base">
              Already have an account? <span class="text-yellow-600 underline">Sign In</span>
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function handleRegister() {
  loading.value = true;
  error.value = '';
  
  const result = await authStore.register(username.value, email.value, password.value);
  
  if (result.success) {
    router.push('/games');
  } else {
    error.value = result.error;
  }
  
  loading.value = false;
}
</script>
