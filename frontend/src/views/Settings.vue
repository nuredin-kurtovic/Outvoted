<template>
  <div class="min-h-screen py-8 bg-gradient-to-b from-slate-50 to-white">
    <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header Card -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h1 class="text-2xl font-bold">Account Settings</h1>
              <p class="text-slate-300 mt-1">Manage your profile and security</p>
            </div>
          </div>
        </div>
        
        <!-- Current User Info -->
        <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {{ authStore.user?.username?.charAt(0)?.toUpperCase() || '?' }}
            </div>
            <div>
              <p class="text-sm text-gray-500">Logged in as</p>
              <p class="text-xl font-bold text-gray-800">{{ authStore.user?.username || 'Unknown' }}</p>
              <p class="text-sm text-gray-500">{{ authStore.user?.email || '' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Username Section -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-6">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">Change Username</h2>
              <p class="text-sm text-gray-500">Update your display name</p>
            </div>
          </div>
        </div>
        <form @submit.prevent="updateUsername" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">New Username</label>
            <input
              v-model="newUsername"
              type="text"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter new username"
            />
          </div>
          <button
            type="submit"
            :disabled="updatingUsername || !newUsername"
            class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <svg v-if="updatingUsername" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ updatingUsername ? 'Updating...' : 'Update Username' }}
          </button>
          <div v-if="usernameMessage" 
               class="rounded-xl p-4 flex items-center gap-3" 
               :class="usernameMessageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <svg v-if="usernameMessageType === 'success'" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p class="font-medium" :class="usernameMessageType === 'success' ? 'text-green-700' : 'text-red-700'">
              {{ usernameMessage }}
            </p>
          </div>
        </form>
      </div>

      <!-- Update Password Section -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-gray-800">Change Password</h2>
              <p class="text-sm text-gray-500">Update your account security</p>
            </div>
          </div>
        </div>
        <form @submit.prevent="updatePassword" class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <input
              v-model="currentPassword"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              v-model="newPassword"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              v-model="confirmPassword"
              type="password"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              :class="newPassword && newPassword !== confirmPassword ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''"
              placeholder="Confirm new password"
            />
          </div>
          <div v-if="newPassword && newPassword !== confirmPassword" 
               class="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p class="text-red-700 text-sm font-medium">Passwords do not match</p>
          </div>
          <button
            type="submit"
            :disabled="updatingPassword || newPassword !== confirmPassword || !currentPassword || !newPassword"
            class="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <svg v-if="updatingPassword" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            {{ updatingPassword ? 'Updating...' : 'Update Password' }}
          </button>
          <div v-if="passwordMessage" 
               class="rounded-xl p-4 flex items-center gap-3" 
               :class="passwordMessageType === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
            <svg v-if="passwordMessageType === 'success'" class="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
            <svg v-else class="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <p class="font-medium" :class="passwordMessageType === 'success' ? 'text-green-700' : 'text-red-700'">
              {{ passwordMessage }}
            </p>
          </div>
        </form>
      </div>

      <!-- Danger Zone -->
      <div class="mt-6 bg-white rounded-2xl shadow-lg border border-red-200 overflow-hidden">
        <div class="p-6 border-b border-red-100 bg-red-50">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <div>
              <h2 class="text-lg font-bold text-red-800">Danger Zone</h2>
              <p class="text-sm text-red-600">Irreversible account actions</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <button
            @click="logout"
            class="w-full px-4 py-3 bg-white border-2 border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 hover:border-red-400 transition-all flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Sign Out
          </button>
        </div>
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

const newUsername = ref('');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const updatingUsername = ref(false);
const updatingPassword = ref(false);
const usernameMessage = ref('');
const usernameMessageType = ref('');
const passwordMessage = ref('');
const passwordMessageType = ref('');

async function updateUsername() {
  updatingUsername.value = true;
  usernameMessage.value = '';
  
  const result = await authStore.updateProfile(newUsername.value, null, null);
  
  if (result.success) {
    usernameMessage.value = 'Username updated successfully!';
    usernameMessageType.value = 'success';
    newUsername.value = '';
  } else {
    usernameMessage.value = result.error;
    usernameMessageType.value = 'error';
  }
  
  updatingUsername.value = false;
}

async function updatePassword() {
  if (newPassword.value !== confirmPassword.value) {
    passwordMessage.value = 'Passwords do not match';
    passwordMessageType.value = 'error';
    return;
  }
  
  updatingPassword.value = true;
  passwordMessage.value = '';
  
  const result = await authStore.updateProfile(null, newPassword.value, currentPassword.value);
  
  if (result.success) {
    passwordMessage.value = 'Password updated successfully!';
    passwordMessageType.value = 'success';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } else {
    passwordMessage.value = result.error;
    passwordMessageType.value = 'error';
  }
  
  updatingPassword.value = false;
}

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>
