<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Users & Admins</h1>
      <div class="text-sm text-gray-500">{{ users.length }} users</div>
    </div>

    <div class="bg-white rounded-xl shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Games Played</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm font-mono text-gray-900">{{ user.id }}</td>
            <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ user.username }}</td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ user.email }}</td>
            <td class="px-4 py-3">
              <span v-if="user.is_admin" class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 font-medium">
                Admin
              </span>
              <span v-else class="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                User
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">{{ user.games_played || 0 }}</td>
            <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(user.created_at) }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <button 
                  v-if="!user.is_admin"
                  @click="makeAdmin(user)" 
                  class="text-purple-600 hover:text-purple-800 text-sm"
                  title="Make Admin"
                >
                  Make Admin
                </button>
                <button 
                  v-else
                  @click="removeAdmin(user)" 
                  class="text-orange-600 hover:text-orange-800 text-sm"
                  title="Remove Admin"
                >
                  Remove Admin
                </button>
                <span class="text-gray-300">|</span>
                <button 
                  @click="deleteUser(user)" 
                  class="text-red-600 hover:text-red-800 text-sm"
                  :disabled="user.is_admin"
                  :class="user.is_admin ? 'opacity-30 cursor-not-allowed' : ''"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const users = ref([]);

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString();
}

async function loadUsers() {
  try {
    const response = await axios.get(`${API_URL}/admin/users`);
    users.value = response.data.users || [];
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

async function makeAdmin(user) {
  if (!confirm(`Make "${user.username}" an admin?`)) return;
  
  try {
    await axios.post(`${API_URL}/admin/admins`, { user_id: user.id });
    await loadUsers();
  } catch (error) {
    console.error('Failed to make admin:', error);
    alert('Failed to make admin');
  }
}

async function removeAdmin(user) {
  if (!confirm(`Remove admin status from "${user.username}"?`)) return;
  
  try {
    await axios.delete(`${API_URL}/admin/admins/${user.id}`);
    await loadUsers();
  } catch (error) {
    console.error('Failed to remove admin:', error);
    alert(error.response?.data?.error || 'Failed to remove admin');
  }
}

async function deleteUser(user) {
  if (user.is_admin) return;
  if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
  
  try {
    await axios.delete(`${API_URL}/admin/users/${user.id}`);
    await loadUsers();
  } catch (error) {
    console.error('Failed to delete user:', error);
    alert('Failed to delete user');
  }
}

onMounted(loadUsers);
</script>
