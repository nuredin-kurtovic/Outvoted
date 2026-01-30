import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null);
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'));
  const isAdmin = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  // Set axios default header
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
  }

  // Check admin status
  async function checkAdminStatus() {
    if (!token.value) {
      isAdmin.value = false;
      return;
    }
    try {
      const response = await axios.get(`${API_URL}/admin/check`);
      isAdmin.value = response.data.isAdmin === true;
    } catch (error) {
      isAdmin.value = false;
    }
  }

  // Check admin on init if authenticated
  if (token.value) {
    checkAdminStatus();
  }

  async function login(username, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });

      token.value = response.data.token;
      user.value = response.data.user;
      
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      
      // Check admin status after login
      await checkAdminStatus();
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  }

  async function register(username, email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password
      });

      token.value = response.data.token;
      user.value = response.data.user;
      
      localStorage.setItem('token', token.value);
      localStorage.setItem('user', JSON.stringify(user.value));
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`;
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  }

  async function updateProfile(username, password, currentPassword) {
    try {
      const response = await axios.put(`${API_URL}/auth/update`, {
        username,
        password,
        currentPassword
      });

      // Update local user data
      if (response.data.user) {
        user.value = response.data.user;
        localStorage.setItem('user', JSON.stringify(user.value));
      }

      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      };
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    isAdmin.value = false;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  }

  return {
    token,
    user,
    isAuthenticated,
    isAdmin,
    login,
    register,
    updateProfile,
    logout,
    checkAdminStatus
  };
});
