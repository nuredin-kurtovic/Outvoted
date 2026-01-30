<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Candidates</h1>
      <div class="flex items-center gap-4">
        <div class="text-sm text-gray-500">{{ candidates.length }} candidates</div>
        <button 
          @click="addCandidate"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Candidate
        </button>
      </div>
    </div>

    <!-- Candidates Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="candidate in candidates" 
        :key="candidate.id" 
        class="bg-white rounded-xl shadow overflow-hidden"
      >
        <div class="p-4 flex items-center gap-4" :class="getHeaderClass(candidate.ethnicity)">
          <img 
            v-if="candidate.image_url" 
            :src="getImageUrl(candidate.image_url)" 
            :alt="candidate.name"
            class="w-16 h-16 rounded-lg object-cover"
          />
          <div v-else class="w-16 h-16 rounded-lg bg-white/20 flex items-center justify-center">
            <svg class="w-8 h-8 text-white/70" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <div>
            <h3 class="font-bold text-white">{{ candidate.name }}</h3>
            <div class="flex gap-2 mt-1">
              <span class="px-2 py-0.5 text-xs rounded bg-white/20 text-white">{{ candidate.ethnicity }}</span>
              <span class="px-2 py-0.5 text-xs rounded bg-white/20 text-white">{{ getIdeologyShort(candidate.ideology) }}</span>
            </div>
          </div>
        </div>
        
        <div class="p-4">
          <div class="text-sm text-gray-600 mb-3">
            <span class="font-medium">Home Region:</span> {{ candidate.home_region_name }}
          </div>
          <p class="text-sm text-gray-500 line-clamp-2">{{ candidate.description }}</p>
          
          <div class="mt-4 flex gap-2">
            <button 
              @click="editCandidate(candidate)"
              class="flex-1 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Edit
            </button>
            <button 
              @click="viewCoefficients(candidate)"
              class="flex-1 px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
            >
              Coefficients
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit/Add Modal -->
    <div v-if="showEditModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div class="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <h2 class="text-lg font-bold">{{ isNewCandidate ? 'Add Candidate' : 'Edit Candidate' }}</h2>
          <button @click="closeEditModal" class="text-white/70 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <!-- Image Preview & Upload -->
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
              <img 
                v-if="imagePreview || editForm.image_url" 
                :src="imagePreview || getImageUrl(editForm.image_url)" 
                alt="Preview"
                class="w-full h-full object-cover"
                @error="$event.target.style.display='none'"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <svg class="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Candidate Image</label>
              <input 
                type="file" 
                ref="imageInput"
                accept="image/*"
                @change="handleImageSelect"
                class="w-full px-3 py-2 border rounded-lg text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p class="text-xs text-gray-500 mt-1">Max 5MB. JPG, PNG, GIF, WebP</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input v-model="editForm.name" type="text" class="w-full px-3 py-2 border rounded-lg" />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
              <select v-model="editForm.ethnicity" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Select...</option>
                <option value="Bosniak">Bosniak</option>
                <option value="Serb">Serb</option>
                <option value="Croat">Croat</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Ideology</label>
              <select v-model="editForm.ideology" class="w-full px-3 py-2 border rounded-lg">
                <option value="">Select...</option>
                <option value="Socialist Nationalist">Socialist Nationalist</option>
                <option value="Liberal Reformist">Liberal Reformist</option>
                <option value="Nationalist Conservative">Nationalist Conservative</option>
                <option value="Civic Unitary">Civic Unitary</option>
                <option value="Populist Anti-System">Populist Anti-System</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Home Region</label>
            <select v-model="editForm.home_region_id" class="w-full px-3 py-2 border rounded-lg">
              <option value="">Select...</option>
              <option v-for="region in regions" :key="region.id" :value="region.id">
                {{ region.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea v-model="editForm.description" rows="3" class="w-full px-3 py-2 border rounded-lg"></textarea>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 flex justify-between">
          <button 
            v-if="!isNewCandidate"
            @click="deleteCandidate" 
            class="px-4 py-2 text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
          <div v-else></div>
          <div class="flex gap-3">
            <button @click="closeEditModal" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button @click="saveCandidate" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
              {{ isNewCandidate ? 'Create' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Demographic Coefficients Modal -->
    <div v-if="showCoefficientsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div class="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 class="text-lg font-bold">Demographic Coefficients: {{ selectedCandidate?.name }}</h2>
            <p class="text-sm text-slate-300">Appeal to each of 20 ethno-ideological groups (0.01 - 1.0)</p>
          </div>
          <button @click="closeCoefficientsModal" class="text-white/70 hover:text-white">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-auto max-h-[60vh]">
          <!-- Grouped by Ethnicity -->
          <div class="space-y-6">
            <div v-for="ethnicity in ethnicities" :key="ethnicity">
              <h3 class="font-semibold text-sm uppercase tracking-wider mb-3" :class="getEthnicityTextColor(ethnicity)">
                {{ ethnicity }} Voters
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div 
                  v-for="ideology in ideologies" 
                  :key="ethnicity + '-' + ideology"
                  class="bg-gray-50 rounded-lg p-3"
                >
                  <div class="text-xs text-gray-500 mb-1">{{ getIdeologyShort(ideology) }}</div>
                  <div class="flex items-center gap-2">
                    <input 
                      :value="getCoefficient(ethnicity, ideology)"
                      @input="updateCoefficient(ethnicity, ideology, $event.target.value)"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="1.0"
                      class="w-16 px-2 py-1 border rounded text-sm"
                      :class="getInputClass(getCoefficient(ethnicity, ideology))"
                    />
                    <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        class="h-full rounded-full transition-all"
                        :class="getBarColor(getCoefficient(ethnicity, ideology))"
                        :style="{ width: (getCoefficient(ethnicity, ideology) * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="px-6 py-4 bg-gray-50 flex items-center justify-between">
          <button 
            @click="regenerateCoefficients"
            class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Regenerate from ethnic/ideology alignment
          </button>
          <div class="flex gap-3">
            <button @click="closeCoefficientsModal" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button 
              @click="saveCoefficients"
              :disabled="!coefficientsChanged"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
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

const candidates = ref([]);
const regions = ref([]);
const showEditModal = ref(false);
const showCoefficientsModal = ref(false);
const selectedCandidate = ref(null);
const editForm = ref({});
const isNewCandidate = ref(false);
const coefficients = ref([]); // Array of { id, ideology, ethnicity, coefficient }
const coefficientChanges = ref({}); // Track changes: "ethnicity|ideology" -> value
const coefficientsChanged = ref(false);
const imageInput = ref(null);
const selectedImage = ref(null);
const imagePreview = ref(null);

const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];

function getIdeologyShort(ideology) {
  const map = {
    'Socialist Nationalist': 'SN',
    'Liberal Reformist': 'LR',
    'Nationalist Conservative': 'NC',
    'Civic Unitary': 'CU',
    'Populist Anti-System': 'PA'
  };
  return map[ideology] || ideology;
}

function getHeaderClass(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'bg-gradient-to-r from-green-600 to-green-500';
    case 'Serb': return 'bg-gradient-to-r from-blue-600 to-blue-500';
    case 'Croat': return 'bg-gradient-to-r from-red-600 to-red-500';
    default: return 'bg-gradient-to-r from-gray-600 to-gray-500';
  }
}

function getEthnicityTextColor(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'text-green-600';
    case 'Serb': return 'text-blue-600';
    case 'Croat': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

function getBarColor(coef) {
  if (coef >= 0.7) return 'bg-green-500';
  if (coef >= 0.3) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getInputClass(coef) {
  const c = parseFloat(coef) || 0.01;
  if (c >= 0.7) return 'bg-green-50 border-green-300';
  if (c >= 0.3) return 'bg-yellow-50 border-yellow-300';
  return 'bg-red-50 border-red-300';
}

function getCoefficient(ethnicity, ideology) {
  const key = `${ethnicity}|${ideology}`;
  if (coefficientChanges.value[key] !== undefined) {
    return coefficientChanges.value[key];
  }
  const coef = coefficients.value.find(c => c.ethnicity === ethnicity && c.ideology === ideology);
  return coef ? parseFloat(coef.coefficient) : 0.01;
}

function updateCoefficient(ethnicity, ideology, value) {
  const key = `${ethnicity}|${ideology}`;
  coefficientChanges.value[key] = Math.min(1.0, Math.max(0.01, parseFloat(value) || 0.01));
  coefficientsChanged.value = true;
}

async function loadCandidates() {
  try {
    const response = await axios.get(`${API_URL}/admin/candidates`);
    candidates.value = response.data.candidates;
  } catch (error) {
    console.error('Failed to load candidates:', error);
  }
}

async function loadRegions() {
  try {
    const response = await axios.get(`${API_URL}/admin/regions`);
    regions.value = response.data.regions;
  } catch (error) {
    console.error('Failed to load regions:', error);
  }
}

function getImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return `${API_URL.replace('/api', '')}${url}`;
  }
  return url;
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    selectedImage.value = file;
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function addCandidate() {
  isNewCandidate.value = true;
  selectedCandidate.value = null;
  selectedImage.value = null;
  imagePreview.value = null;
  editForm.value = {
    name: '',
    ethnicity: '',
    ideology: '',
    home_region_id: '',
    description: '',
    image_url: ''
  };
  showEditModal.value = true;
}

function editCandidate(candidate) {
  isNewCandidate.value = false;
  selectedCandidate.value = candidate;
  selectedImage.value = null;
  imagePreview.value = null;
  editForm.value = { ...candidate };
  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
  selectedCandidate.value = null;
  editForm.value = {};
  isNewCandidate.value = false;
  selectedImage.value = null;
  imagePreview.value = null;
}

async function saveCandidate() {
  try {
    let candidateId;
    
    if (isNewCandidate.value) {
      // Create new candidate
      const response = await axios.post(`${API_URL}/admin/candidates`, editForm.value);
      candidateId = response.data.id;
    } else {
      // Update existing candidate
      await axios.put(`${API_URL}/admin/candidates/${selectedCandidate.value.id}`, editForm.value);
      candidateId = selectedCandidate.value.id;
    }
    
    // Upload image if selected
    if (selectedImage.value && candidateId) {
      const formData = new FormData();
      formData.append('image', selectedImage.value);
      await axios.post(`${API_URL}/admin/candidates/${candidateId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    }
    
    await loadCandidates();
    closeEditModal();
  } catch (error) {
    console.error('Failed to save candidate:', error);
    alert('Failed to save candidate');
  }
}

async function deleteCandidate() {
  if (!confirm(`Delete candidate "${selectedCandidate.value.name}"? This cannot be undone.`)) return;
  
  try {
    await axios.delete(`${API_URL}/admin/candidates/${selectedCandidate.value.id}`);
    await loadCandidates();
    closeEditModal();
  } catch (error) {
    console.error('Failed to delete candidate:', error);
    alert('Failed to delete candidate');
  }
}

async function viewCoefficients(candidate) {
  selectedCandidate.value = candidate;
  coefficientsChanged.value = false;
  coefficientChanges.value = {};
  
  try {
    const response = await axios.get(`${API_URL}/admin/candidates/${candidate.id}`);
    coefficients.value = response.data.coefficients;
    showCoefficientsModal.value = true;
  } catch (error) {
    console.error('Failed to load coefficients:', error);
  }
}

function closeCoefficientsModal() {
  showCoefficientsModal.value = false;
  selectedCandidate.value = null;
  coefficients.value = [];
  coefficientChanges.value = {};
}

async function saveCoefficients() {
  try {
    // Build array of all coefficients (changed or original)
    const allCoefficients = [];
    for (const ethnicity of ethnicities) {
      for (const ideology of ideologies) {
        const key = `${ethnicity}|${ideology}`;
        const value = coefficientChanges.value[key] !== undefined 
          ? coefficientChanges.value[key]
          : getCoefficient(ethnicity, ideology);
        allCoefficients.push({ ethnicity, ideology, coefficient: value });
      }
    }
    
    await axios.put(`${API_URL}/admin/coefficients/candidate/${selectedCandidate.value.id}`, {
      coefficients: allCoefficients
    });
    
    // Reload to get fresh data
    const response = await axios.get(`${API_URL}/admin/candidates/${selectedCandidate.value.id}`);
    coefficients.value = response.data.coefficients;
    coefficientChanges.value = {};
    coefficientsChanged.value = false;
    alert('Coefficients saved successfully');
  } catch (error) {
    console.error('Failed to save coefficients:', error);
    alert('Failed to save coefficients');
  }
}

async function regenerateCoefficients() {
  if (!confirm('This will regenerate coefficients based on ethnic/ideology alignment. Continue?')) return;
  
  try {
    await axios.post(`${API_URL}/admin/coefficients/regenerate/${selectedCandidate.value.id}`);
    const response = await axios.get(`${API_URL}/admin/candidates/${selectedCandidate.value.id}`);
    coefficients.value = response.data.coefficients;
    coefficientChanges.value = {};
    coefficientsChanged.value = false;
  } catch (error) {
    console.error('Failed to regenerate coefficients:', error);
    alert('Failed to regenerate coefficients');
  }
}

onMounted(() => {
  loadCandidates();
  loadRegions();
});
</script>
