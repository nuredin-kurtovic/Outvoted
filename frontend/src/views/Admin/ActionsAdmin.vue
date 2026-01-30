<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Campaign Actions</h1>
      <div class="text-sm text-gray-500">{{ actions.length }} actions</div>
    </div>

    <!-- Actions by Type -->
    <div class="space-y-8">
      <!-- Campaign Actions -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          Campaign Actions
        </h2>
        <div class="bg-white rounded-xl shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scope</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost (KM)</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reach</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charisma</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="action in campaignActions" :key="action.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ action.name }}</div>
                  <div class="text-xs text-gray-500">{{ action.description }}</div>
                </td>
                <td class="px-4 py-3">
                  <span class="px-2 py-1 text-xs rounded-full" :class="action.rules?.scope === 'global' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'">
                    {{ action.rules?.scope || 'local' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-if="editingAction === action.id"
                    v-model.number="editForm.base_cost"
                    type="number"
                    class="w-24 px-2 py-1 border rounded text-sm"
                  />
                  <span v-else class="text-gray-900">{{ formatCurrency(action.base_cost) }}</span>
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-if="editingAction === action.id"
                    v-model.number="editForm.reach_coefficient"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="1.0"
                    class="w-20 px-2 py-1 border rounded text-sm"
                  />
                  <template v-else>
                    <div class="flex items-center gap-2">
                      <div class="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full bg-blue-500 rounded-full" :style="{ width: (action.reach_coefficient * 100) + '%' }"></div>
                      </div>
                      <span class="text-sm text-gray-600">{{ (action.reach_coefficient * 100).toFixed(0) }}%</span>
                    </div>
                  </template>
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-if="editingAction === action.id"
                    v-model.number="editForm.charisma_cost"
                    type="number"
                    class="w-16 px-2 py-1 border rounded text-sm"
                  />
                  <span v-else class="text-gray-900">{{ action.charisma_cost || 0 }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <button
                      @click="viewActionCoefficients(action)"
                      class="px-2 py-1 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100"
                    >
                      Coefficients
                    </button>
                    <template v-if="editingAction === action.id">
                      <button @click="saveAction(action.id)" class="text-green-600 hover:text-green-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>
                      <button @click="cancelEdit" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </template>
                    <button v-else @click="startEdit(action)" class="text-blue-600 hover:text-blue-800">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Action Coefficients Modal (ethno-ideological factors per campaign type) -->
      <div v-if="showCoefficientsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div class="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold">Demographic Factors: {{ selectedAction?.name }}</h2>
              <p class="text-sm text-slate-300">Campaign effectiveness per ethno-ideological group (0.01 - 1.0)</p>
            </div>
            <button @click="closeCoefficientsModal" class="text-white/70 hover:text-white">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="p-6 overflow-auto max-h-[60vh]">
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
                        :value="getActionCoefficient(ethnicity, ideology)"
                        @input="updateActionCoefficient(ethnicity, ideology, $event.target.value)"
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="1.0"
                        class="w-16 px-2 py-1 border rounded text-sm"
                        :class="getInputClass(getActionCoefficient(ethnicity, ideology))"
                      />
                      <div class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all"
                          :class="getBarColor(getActionCoefficient(ethnicity, ideology))"
                          :style="{ width: (getActionCoefficient(ethnicity, ideology) * 100) + '%' }"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
            <button @click="closeCoefficientsModal" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Cancel
            </button>
            <button
              @click="saveActionCoefficients"
              :disabled="!actionCoefficientsChanged"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <!-- Fundraising Actions -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-amber-500"></div>
          Fundraising Actions
        </h2>
        <div class="bg-white rounded-xl shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget Gain (KM)</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Restrictions</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="action in fundraisingActions" :key="action.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ action.name }}</div>
                  <div class="text-xs text-gray-500">{{ action.description }}</div>
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-if="editingAction === action.id"
                    v-model.number="editForm.base_budget_gain"
                    type="number"
                    class="w-24 px-2 py-1 border rounded text-sm"
                  />
                  <span v-else class="text-green-600 font-medium">+{{ formatCurrency(action.base_budget_gain) }}</span>
                </td>
                <td class="px-4 py-3">
                  <span v-if="action.rules?.once_per_game" class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                    Once per game
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <template v-if="editingAction === action.id">
                      <button @click="saveAction(action.id)" class="text-green-600 hover:text-green-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>
                      <button @click="cancelEdit" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </template>
                    <button v-else @click="startEdit(action)" class="text-blue-600 hover:text-blue-800">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Skills -->
      <div>
        <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-purple-500"></div>
          Skills
        </h2>
        <div class="bg-white rounded-xl shadow overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charisma Cost</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effect</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="action in skillActions" :key="action.id" class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ action.name }}</div>
                  <div class="text-xs text-gray-500">{{ action.description }}</div>
                </td>
                <td class="px-4 py-3">
                  <input 
                    v-if="editingAction === action.id"
                    v-model.number="editForm.charisma_cost"
                    type="number"
                    class="w-16 px-2 py-1 border rounded text-sm"
                  />
                  <span v-else class="text-purple-600 font-medium">{{ action.charisma_cost }}</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-gray-900">{{ action.rules?.duration || 3 }} turns</span>
                </td>
                <td class="px-4 py-3">
                  <span class="text-sm text-gray-600">{{ getEffectDescription(action.rules) }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <template v-if="editingAction === action.id">
                      <button @click="saveAction(action.id)" class="text-green-600 hover:text-green-800">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>
                      <button @click="cancelEdit" class="text-gray-400 hover:text-gray-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </template>
                    <button v-else @click="startEdit(action)" class="text-blue-600 hover:text-blue-800">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const actions = ref([]);
const editingAction = ref(null);
const editForm = ref({});
const showCoefficientsModal = ref(false);
const selectedAction = ref(null);
const actionCoefficients = ref([]);
const actionCoefficientChanges = ref({});
const actionCoefficientsChanged = ref(false);

const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];

const campaignActions = computed(() => actions.value.filter(a => a.type === 'campaign'));
const fundraisingActions = computed(() => actions.value.filter(a => a.type === 'fundraising'));
const skillActions = computed(() => actions.value.filter(a => a.type === 'skill'));

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(amount);
}

function getEffectDescription(rules) {
  if (!rules) return '-';
  if (rules.effect === 'tv_bonus') return `+${(rules.bonus * 100).toFixed(0)}% TV effectiveness`;
  if (rules.effect === 'door_discount') return `-${(rules.discount * 100).toFixed(0)}% door-to-door cost`;
  if (rules.effect === 'foreign_aid') return `+${(rules.bonus * 100).toFixed(0)}% fundraising`;
  return JSON.stringify(rules);
}

async function loadActions() {
  try {
    const response = await axios.get(`${API_URL}/admin/actions`);
    actions.value = response.data.actions;
  } catch (error) {
    console.error('Failed to load actions:', error);
  }
}

function startEdit(action) {
  editingAction.value = action.id;
  editForm.value = { ...action };
}

function cancelEdit() {
  editingAction.value = null;
  editForm.value = {};
}

async function saveAction(id) {
  try {
    await axios.put(`${API_URL}/admin/actions/${id}`, editForm.value);
    await loadActions();
    cancelEdit();
  } catch (error) {
    console.error('Failed to save action:', error);
    alert('Failed to save action');
  }
}

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

function getActionCoefficient(ethnicity, ideology) {
  const key = `${ethnicity}|${ideology}`;
  if (actionCoefficientChanges.value[key] !== undefined) {
    return actionCoefficientChanges.value[key];
  }
  const c = actionCoefficients.value.find(x => x.ethnicity === ethnicity && x.ideology === ideology);
  return c ? parseFloat(c.coefficient) : 1.0;
}

function updateActionCoefficient(ethnicity, ideology, value) {
  const key = `${ethnicity}|${ideology}`;
  actionCoefficientChanges.value[key] = Math.min(1.0, Math.max(0.01, parseFloat(value) || 1.0));
  actionCoefficientsChanged.value = true;
}

async function viewActionCoefficients(action) {
  selectedAction.value = action;
  actionCoefficients.value = [];
  actionCoefficientChanges.value = {};
  actionCoefficientsChanged.value = false;
  showCoefficientsModal.value = true;
  try {
    const response = await axios.get(`${API_URL}/admin/actions/${action.id}/coefficients`);
    actionCoefficients.value = response.data.coefficients || [];
  } catch (error) {
    console.error('Failed to load action coefficients:', error);
    actionCoefficients.value = [];
  }
}

function closeCoefficientsModal() {
  showCoefficientsModal.value = false;
  selectedAction.value = null;
  actionCoefficients.value = [];
  actionCoefficientChanges.value = {};
  actionCoefficientsChanged.value = false;
}

async function saveActionCoefficients() {
  if (!selectedAction.value) return;
  const coefficients = [];
  for (const ethnicity of ethnicities) {
    for (const ideology of ideologies) {
      const value = actionCoefficientChanges.value[`${ethnicity}|${ideology}`] !== undefined
        ? actionCoefficientChanges.value[`${ethnicity}|${ideology}`]
        : getActionCoefficient(ethnicity, ideology);
      coefficients.push({ ethnicity, ideology, coefficient: value });
    }
  }
  try {
    await axios.put(`${API_URL}/admin/coefficients/action/${selectedAction.value.id}`, { coefficients });
    actionCoefficients.value = (await axios.get(`${API_URL}/admin/actions/${selectedAction.value.id}/coefficients`)).data.coefficients;
    actionCoefficientChanges.value = {};
    actionCoefficientsChanged.value = false;
  } catch (error) {
    console.error('Failed to save action coefficients:', error);
    alert('Failed to save coefficients');
  }
}

onMounted(loadActions);
</script>
