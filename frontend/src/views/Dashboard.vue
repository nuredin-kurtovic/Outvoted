<template>
  <div class="min-h-screen py-4 sm:py-6">
    <div v-if="loading" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col items-center justify-center py-20">
        <div class="relative">
          <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p class="text-gray-600 mt-6 text-lg font-semibold">Loading dashboard...</p>
      </div>
    </div>

    <div v-else-if="dashboard" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Campaign Dashboard</h1>
        <p class="text-gray-500">Track your campaign progress and history</p>
      </div>
      
      <!-- Stats Section -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- National Support -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            Support
          </div>
          <div class="text-3xl font-black text-blue-600">{{ (myPlayer?.national_support * 100).toFixed(1) }}%</div>
          <div class="text-xs text-gray-500 mt-1">{{ getRankText() }}</div>
        </div>

        <!-- Budget -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Budget
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ formatCurrencyShort(myPlayer?.budget || 0) }}</div>
          <div class="text-xs text-gray-500 mt-1">KM Available</div>
        </div>

        <!-- Charisma points -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Charisma points
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ myPlayer?.charisma_points || 0 }}</div>
          <div class="text-xs text-gray-500 mt-1">Points earned</div>
        </div>

        <!-- Progress -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Progress
          </div>
          <div class="text-2xl font-bold text-gray-800">{{ dashboard.game.current_turn }}/{{ dashboard.game.max_turns }}</div>
          <div class="text-xs text-gray-500 mt-1">Days completed</div>
        </div>
      </div>
      
      <!-- Candidate Standings -->
      <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
        <h3 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          Candidate Standings
        </h3>
        <div class="space-y-2">
          <div
            v-for="(player, index) in sortedPlayers"
            :key="player.id"
            class="flex items-center gap-3 p-3 rounded-xl transition-all"
            :class="!player.is_ai ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 border border-gray-200'"
          >
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                 :class="index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-gray-300 text-gray-700' : 'bg-gray-200 text-gray-600'">
              {{ index + 1 }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-semibold text-gray-800 truncate">{{ player.candidate_name }}</span>
                <span v-if="player.is_ai" class="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">🤖</span>
                <span v-if="!player.is_ai" class="text-xs bg-blue-200 text-blue-700 px-1.5 py-0.5 rounded">You</span>
              </div>
              <div class="text-xs text-gray-500">{{ player.ethnicity }} • {{ player.ideology }}</div>
            </div>
            <div class="w-24 hidden sm:block">
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full transition-all duration-500"
                     :class="!player.is_ai ? 'bg-blue-500' : 'bg-gray-400'"
                     :style="{ width: `${player.national_support * 100}%` }">
                </div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-bold text-lg" :class="!player.is_ai ? 'text-blue-600' : 'text-gray-700'">
                {{ (player.national_support * 100).toFixed(1) }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Finances Summary -->
      <div v-if="myPlayer" class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            Total Spent
          </div>
          <div class="text-xl font-bold text-red-600">{{ formatCurrency(myPlayer.spending?.total_spent || 0) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Total Raised
          </div>
          <div class="text-xl font-bold text-green-600">{{ formatCurrency(myPlayer.spending?.total_earned || 0) }}</div>
        </div>
        <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div class="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
            Net Flow
          </div>
          <div class="text-xl font-bold" :class="netFlow >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ netFlow >= 0 ? '+' : '' }}{{ formatCurrency(netFlow) }}
          </div>
        </div>
      </div>

      <!-- Campaign Timeline Calendar -->
      <div v-if="dashboard && dashboard.game" class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <div>
            <h3 class="font-bold text-gray-800 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Campaign Timeline
            </h3>
            <p class="text-sm text-gray-500">September 2026 • Click a day to see details</p>
          </div>
          <div class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold">
            Day {{ dashboard.game.current_turn || 0 }} of {{ dashboard.game.max_turns || 30 }}
          </div>
        </div>
        
        <!-- Calendar Grid -->
        <div class="grid grid-cols-7 sm:grid-cols-10 gap-2">
          <div
            v-for="turn in Array.from({ length: Math.min(dashboard.game.max_turns || 30, 30) }, (_, i) => i + 1)"
            :key="turn"
            class="relative cursor-pointer group"
            @click="canClickTurn(turn) ? viewTurnSummary(turn) : null"
          >
            <div
              class="rounded-lg p-2 border transition-all min-h-[70px] sm:min-h-[80px] flex flex-col"
              :class="getTurnClass(turn)"
            >
              <!-- Day number -->
              <div class="text-center">
                <div class="text-[10px] text-gray-400 uppercase">{{ getDayName(getDateForTurn(turn)) }}</div>
                <div class="text-lg font-bold" :class="turn === dashboard.game.current_turn && dashboard.game.status === 'active' ? 'text-white' : ''">
                  {{ turn }}
                </div>
              </div>
              
              <!-- Status indicator -->
              <div class="flex-1 flex items-end justify-center">
                <!-- Current turn -->
                <span v-if="turn === dashboard.game.current_turn && dashboard.game.status === 'active'" 
                      class="text-[10px] font-bold text-white/90">NOW</span>
                
                <!-- Completed turn with change -->
                <div v-else-if="isPastTurn(turn) && turnNationalChanges[turn] !== undefined" class="text-center">
                  <div class="text-xs font-bold" :class="turnNationalChanges[turn] >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ turnNationalChanges[turn] >= 0 ? '+' : '' }}{{ (turnNationalChanges[turn] * 100).toFixed(1) }}%
                  </div>
                </div>
                
                <!-- Completed turn without data -->
                <span v-else-if="isPastTurn(turn)" class="text-green-500 text-sm">✓</span>
                
                <!-- Future turn -->
                <span v-else class="text-gray-300 text-sm">•</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Legend -->
        <div class="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded bg-blue-600"></div>
            <span>Current</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Completed</span>
          </div>
          <div class="flex items-center gap-1">
            <div class="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
            <span>Upcoming</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Turn Summary Modal -->
    <div v-if="selectedTurn && turnSummary" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="selectedTurn = null">
      <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              </div>
              <div>
                <h3 class="font-bold">Day {{ selectedTurn }} Summary</h3>
                <p class="text-sm text-slate-300">September {{ selectedTurn }}, 2026</p>
              </div>
            </div>
            <button @click="selectedTurn = null" class="text-white/70 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          
          <!-- Actions Section -->
          <div v-if="turnSummary.actions && turnSummary.actions.length > 0">
            <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              Actions Taken
            </h4>
            <div class="space-y-2">
              <div
                v-for="(action, idx) in turnSummary.actions"
                :key="idx"
                class="bg-blue-50 border border-blue-200 rounded-xl p-3"
              >
                <div class="font-semibold text-gray-800">{{ action.action_name }}</div>
                <div class="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">{{ action.action_type }}</span>
                  <span>{{ action.region_name || 'All Regions' }}</span>
                </div>
                <div v-if="action.spending_amount > 0" class="text-sm text-red-600 mt-2 font-semibold">
                  💰 Cost: {{ formatCurrency(action.spending_amount) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Support Changes Section -->
          <div v-if="turnSummary.support_changes && turnSummary.support_changes.length > 0">
            <h4 class="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Regional Support Changes
            </h4>
            <div class="space-y-1 max-h-60 overflow-y-auto">
              <div
                v-for="change in turnSummary.support_changes"
                :key="change.region_name"
                class="flex items-center justify-between p-2 rounded-lg"
                :class="change.change >= 0 ? 'bg-green-50' : 'bg-red-50'"
              >
                <div>
                  <div class="font-semibold text-gray-800 text-sm">{{ change.region_name }}</div>
                  <div class="text-xs text-gray-500">
                    {{ (change.previous_support * 100).toFixed(1) }}% → {{ (change.current_support * 100).toFixed(1) }}%
                  </div>
                </div>
                <div class="text-sm font-bold" :class="change.change >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ change.change >= 0 ? '+' : '' }}{{ (change.change * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-if="(!turnSummary.actions || turnSummary.actions.length === 0) && (!turnSummary.support_changes || turnSummary.support_changes.length === 0)" class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
            <p class="text-gray-500">No activity recorded for this turn.</p>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <button
            @click="selectedTurn = null"
            class="w-full py-2 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-900 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useGameStore } from '../stores/game';

const route = useRoute();
const gameStore = useGameStore();

const gameId = route.params.id;
const dashboard = ref(null);
const spendingHistory = ref([]);
const turnSummary = ref(null);
const selectedTurn = ref(null);
const loading = ref(true);
const turnNationalChanges = ref({});

const myPlayer = computed(() => {
  if (!dashboard.value) return null;
  return dashboard.value.players.find(p => !p.is_ai);
});

const sortedPlayers = computed(() => {
  if (!dashboard.value?.players) return [];
  return [...dashboard.value.players].sort((a, b) => b.national_support - a.national_support);
});

const netFlow = computed(() => {
  if (!myPlayer.value?.spending) return 0;
  return (myPlayer.value.spending.total_earned || 0) - (myPlayer.value.spending.total_spent || 0);
});

onMounted(async () => {
  await loadDashboard();
  await loadSpendingHistory();
});

async function loadDashboard() {
  loading.value = true;
  const result = await gameStore.fetchDashboard(gameId);
  if (result.success) {
    dashboard.value = result.dashboard;
    await loadAllTurnSummaries();
  }
  loading.value = false;
}

async function loadSpendingHistory() {
  const result = await gameStore.fetchSpendingHistory(gameId);
  if (result.success) {
    spendingHistory.value = result.spending;
  }
}

async function viewTurnSummary(turn) {
  selectedTurn.value = turn;
  const result = await gameStore.fetchTurnSummary(gameId, turn);
  if (result.success) {
    turnSummary.value = result.summary;
  }
}

async function loadAllTurnSummaries() {
  if (!dashboard.value) return;
  const maxTurn = dashboard.value.game.current_turn;
  
  const promises = [];
  for (let turn = 1; turn < maxTurn; turn++) {
    promises.push(
      gameStore.fetchTurnSummary(gameId, turn).then(result => {
        if (result.success && result.summary) {
          const summary = result.summary;
          // Calculate national support change for this turn
          // This is the sum of changes weighted by population, but we'll use a simpler approach:
          // Just take the average change as an approximation of national impact
          if (summary.support_changes && summary.support_changes.length > 0) {
            const totalChange = summary.support_changes.reduce((sum, change) => sum + (change.change || 0), 0);
            // Average change per region as proxy for national change
            turnNationalChanges.value[turn] = totalChange / summary.support_changes.length;
          } else {
            turnNationalChanges.value[turn] = 0;
          }
        }
      }).catch(() => {})
    );
  }
  
  await Promise.all(promises);
}

function getDateForTurn(turn) {
  return turn;
}

function getDayName(day) {
  const date = new Date(2026, 8, day);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

function isPastTurn(turn) {
  if (!dashboard.value) return false;
  if (dashboard.value.game.status === 'completed') {
    return turn <= dashboard.value.game.max_turns;
  }
  return turn < dashboard.value.game.current_turn;
}

function canClickTurn(turn) {
  return isPastTurn(turn);
}

function getTurnClass(turn) {
  if (!dashboard.value) return 'border-gray-200 bg-gray-50';
  
  const isCurrentTurn = turn === dashboard.value.game.current_turn && dashboard.value.game.status === 'active';
  const isPast = isPastTurn(turn);
  
  if (isCurrentTurn) {
    return 'border-blue-500 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg scale-105 z-10';
  } else if (isPast) {
    return 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 hover:shadow-md';
  } else {
    return 'border-gray-200 bg-gray-50 opacity-60';
  }
}

function getRankText() {
  if (!dashboard.value?.players) return '';
  const sorted = [...dashboard.value.players].sort((a, b) => b.national_support - a.national_support);
  const myRank = sorted.findIndex(p => !p.is_ai) + 1;
  if (myRank === 1) return '🥇 Leading';
  if (myRank === 2) return '🥈 2nd Place';
  if (myRank === 3) return '🥉 3rd Place';
  return `#${myRank} of ${sorted.length}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' KM';
}

function formatCurrencyShort(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    return Math.round(amount / 1000) + 'K';
  }
  return amount.toString();
}
</script>
