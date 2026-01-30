<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Regions & Demographics</h1>
      <div class="text-sm text-gray-500">{{ regions.length }} regions · 20 demographic groups each</div>
    </div>

    <!-- Column Legend -->
    <div class="mb-4 bg-white rounded-xl shadow p-4">
      <div class="text-xs text-gray-500 mb-2">Column codes: <span class="font-mono">[Ethnicity]-[Ideology]</span></div>
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="px-2 py-1 bg-green-100 text-green-800 rounded">B = Bosniak</span>
        <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">S = Serb</span>
        <span class="px-2 py-1 bg-red-100 text-red-800 rounded">C = Croat</span>
        <span class="px-2 py-1 bg-gray-100 text-gray-800 rounded">O = Other</span>
        <span class="text-gray-400">|</span>
        <span class="px-2 py-1 bg-purple-50 rounded">SN = Socialist Nationalist</span>
        <span class="px-2 py-1 bg-blue-50 rounded">LR = Liberal Reformist</span>
        <span class="px-2 py-1 bg-orange-50 rounded">NC = Nationalist Conservative</span>
        <span class="px-2 py-1 bg-teal-50 rounded">CU = Civic Unitary</span>
        <span class="px-2 py-1 bg-pink-50 rounded">PA = Populist Anti-System</span>
      </div>
    </div>

    <!-- Regions Table with all 20 demographic groups -->
    <div class="bg-white rounded-xl shadow overflow-auto max-h-[75vh]">
      <table class="min-w-full text-xs">
        <thead class="bg-gray-50 sticky top-0 z-20">
          <!-- Header Row 1: Region info + Ethnicity groups -->
          <tr>
            <th rowspan="2" class="px-2 py-2 text-left font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-30 border-r min-w-[120px]">Region</th>
            <th rowspan="2" class="px-2 py-2 text-right font-medium text-gray-500 uppercase border-r">Total</th>
            <th colspan="5" class="px-1 py-1 text-center font-bold text-green-700 bg-green-50 border-b border-l">Bosniak</th>
            <th colspan="5" class="px-1 py-1 text-center font-bold text-blue-700 bg-blue-50 border-b border-l">Serb</th>
            <th colspan="5" class="px-1 py-1 text-center font-bold text-red-700 bg-red-50 border-b border-l">Croat</th>
            <th colspan="5" class="px-1 py-1 text-center font-bold text-gray-700 bg-gray-100 border-b border-l">Other</th>
          </tr>
          <!-- Header Row 2: Ideology subgroups -->
          <tr>
            <th v-for="(ideo, idx) in ideologyShorts" :key="'b-'+ideo" class="px-1 py-1 text-center font-medium text-gray-600" :class="idx === 0 ? 'border-l' : ''">{{ ideo }}</th>
            <th v-for="(ideo, idx) in ideologyShorts" :key="'s-'+ideo" class="px-1 py-1 text-center font-medium text-gray-600" :class="idx === 0 ? 'border-l' : ''">{{ ideo }}</th>
            <th v-for="(ideo, idx) in ideologyShorts" :key="'c-'+ideo" class="px-1 py-1 text-center font-medium text-gray-600" :class="idx === 0 ? 'border-l' : ''">{{ ideo }}</th>
            <th v-for="(ideo, idx) in ideologyShorts" :key="'o-'+ideo" class="px-1 py-1 text-center font-medium text-gray-600" :class="idx === 0 ? 'border-l' : ''">{{ ideo }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="region in regionsWithDemographics" :key="region.id" class="hover:bg-gray-50">
            <td class="px-2 py-2 sticky left-0 bg-white z-10 border-r">
              <div class="font-medium text-gray-900">{{ region.name }}</div>
              <div class="text-gray-400">{{ region.code }}</div>
            </td>
            <td class="px-2 py-2 text-right font-semibold text-gray-900 border-r">{{ formatNumber(region.population) }}</td>
            <!-- Bosniak groups -->
            <td v-for="(ideo, idx) in ideologies" :key="region.id + '-B-' + ideo" class="px-1 py-1 text-center" :class="idx === 0 ? 'border-l bg-green-50/30' : 'bg-green-50/30'">
              <input 
                :value="getDemoValue(region, 'Bosniak', ideo)"
                @input="updateDemoValue(region.id, 'Bosniak', ideo, $event.target.value)"
                type="number"
                min="0"
                class="w-14 px-1 py-0.5 text-center border rounded text-xs"
              />
            </td>
            <!-- Serb groups -->
            <td v-for="(ideo, idx) in ideologies" :key="region.id + '-S-' + ideo" class="px-1 py-1 text-center" :class="idx === 0 ? 'border-l bg-blue-50/30' : 'bg-blue-50/30'">
              <input 
                :value="getDemoValue(region, 'Serb', ideo)"
                @input="updateDemoValue(region.id, 'Serb', ideo, $event.target.value)"
                type="number"
                min="0"
                class="w-14 px-1 py-0.5 text-center border rounded text-xs"
              />
            </td>
            <!-- Croat groups -->
            <td v-for="(ideo, idx) in ideologies" :key="region.id + '-C-' + ideo" class="px-1 py-1 text-center" :class="idx === 0 ? 'border-l bg-red-50/30' : 'bg-red-50/30'">
              <input 
                :value="getDemoValue(region, 'Croat', ideo)"
                @input="updateDemoValue(region.id, 'Croat', ideo, $event.target.value)"
                type="number"
                min="0"
                class="w-14 px-1 py-0.5 text-center border rounded text-xs"
              />
            </td>
            <!-- Other groups -->
            <td v-for="(ideo, idx) in ideologies" :key="region.id + '-O-' + ideo" class="px-1 py-1 text-center" :class="idx === 0 ? 'border-l bg-gray-50/50' : 'bg-gray-50/50'">
              <input 
                :value="getDemoValue(region, 'Other', ideo)"
                @input="updateDemoValue(region.id, 'Other', ideo, $event.target.value)"
                type="number"
                min="0"
                class="w-14 px-1 py-0.5 text-center border rounded text-xs"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Save Button -->
    <div class="mt-4 flex justify-end">
      <button 
        @click="saveAllChanges"
        :disabled="!hasChanges"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Save All Changes
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const regions = ref([]);
const allDemographics = ref({}); // regionId -> { "ethnicity|ideology" -> population }
const changes = ref({}); // "regionId|ethnicity|ideology" -> new value

const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
const ideologyShorts = ['SN', 'LR', 'NC', 'CU', 'PA'];

const hasChanges = computed(() => Object.keys(changes.value).length > 0);

const regionsWithDemographics = computed(() => {
  return regions.value.map(r => ({
    ...r,
    demographics: allDemographics.value[r.id] || {}
  }));
});

function formatNumber(num) {
  return (num || 0).toLocaleString();
}

function getDemoValue(region, ethnicity, ideology) {
  const changeKey = `${region.id}|${ethnicity}|${ideology}`;
  if (changes.value[changeKey] !== undefined) {
    return changes.value[changeKey];
  }
  const demoKey = `${ethnicity}|${ideology}`;
  return region.demographics[demoKey] || 0;
}

function updateDemoValue(regionId, ethnicity, ideology, value) {
  const key = `${regionId}|${ethnicity}|${ideology}`;
  changes.value[key] = parseInt(value) || 0;
}

async function loadRegions() {
  try {
    const response = await axios.get(`${API_URL}/admin/regions`);
    regions.value = response.data.regions;
    
    // Load demographics for all regions
    for (const region of regions.value) {
      await loadRegionDemographics(region.id);
    }
  } catch (error) {
    console.error('Failed to load regions:', error);
  }
}

async function loadRegionDemographics(regionId) {
  try {
    const response = await axios.get(`${API_URL}/admin/demographics/${regionId}`);
    const demoMap = {};
    for (const d of response.data.demographics) {
      const key = `${d.ethnicity}|${d.ideology}`;
      demoMap[key] = d.population;
    }
    allDemographics.value[regionId] = demoMap;
  } catch (error) {
    console.error(`Failed to load demographics for region ${regionId}:`, error);
  }
}

async function saveAllChanges() {
  try {
    // Group changes by region
    const byRegion = {};
    for (const [key, value] of Object.entries(changes.value)) {
      const [regionId, ethnicity, ideology] = key.split('|');
      if (!byRegion[regionId]) byRegion[regionId] = [];
      byRegion[regionId].push({ ethnicity, ideology, population: value });
    }
    
    // Save each region's changes
    for (const [regionId, demographics] of Object.entries(byRegion)) {
      await axios.put(`${API_URL}/admin/demographics/region/${regionId}`, { demographics });
    }
    
    // Clear changes and reload
    changes.value = {};
    await loadRegions();
    alert('All changes saved successfully');
  } catch (error) {
    console.error('Failed to save changes:', error);
    alert('Failed to save changes');
  }
}

onMounted(loadRegions);
</script>
