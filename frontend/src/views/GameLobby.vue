<template>
  <div class="min-h-screen bg-slate-100 flex flex-col">
    <!-- Header -->
    <header class="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4 shadow-lg">
      <div class="max-w-3xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/games" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </router-link>
          <div>
            <h1 class="text-xl font-bold">Game Lobby</h1>
            <p class="text-slate-300 text-sm">Add AI opponents or share the code to invite players</p>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-3xl mx-auto w-full p-6">
      <div v-if="loading" class="flex justify-center py-16">
        <div class="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>

      <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p class="text-red-700">{{ error }}</p>
        <router-link to="/games" class="mt-4 inline-block text-blue-600 hover:underline">Back to games</router-link>
      </div>

      <div v-else class="space-y-6">
        <!-- Join Code -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 class="font-bold text-slate-800 mb-2">Invite Code</h2>
          <p class="text-slate-500 text-sm mb-4">Share this code so others can join your game</p>
          <div class="flex items-center gap-3">
            <div class="flex-1 px-4 py-3 bg-slate-100 rounded-xl font-mono text-2xl font-bold text-slate-800 tracking-widest text-center">
              {{ game?.join_code || '------' }}
            </div>
            <button
              @click="copyCode"
              class="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Players -->
        <div class="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 class="font-bold text-slate-800 mb-4">Players ({{ players.length }}/{{ game?.max_players || 2 }})</h2>
          <div class="space-y-3">
            <div
              v-for="p in players"
              :key="p.id"
              class="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100"
            >
              <div class="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-slate-400 to-slate-500 flex-shrink-0">
                <img
                  v-if="p.image_url"
                  :src="p.image_url"
                  :alt="p.candidate_name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                  {{ p.candidate_name?.charAt(0) || '?' }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-slate-800">{{ p.candidate_name }}</div>
                <div class="flex gap-2 mt-1">
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="getEthnicityBadge(p.ethnicity)">
                    {{ p.ethnicity }}
                  </span>
                  <span v-if="p.is_ai" class="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    AI
                  </span>
                  <span v-else-if="p.is_me" class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">
                    You
                  </span>
                </div>
              </div>
            </div>

            <!-- Add AI slot -->
            <div
              v-if="players.length < (game?.max_players || 2) && showAddAI"
              class="border-2 border-dashed border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="c in availableAICandidates"
                  :key="c.id"
                  @click="addAI(c)"
                  :disabled="addingAI"
                  class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all"
                  :class="addingAI ? 'opacity-50 cursor-not-allowed border-slate-200' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'"
                >
                  <div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-slate-200">
                    <img v-if="c.image_url" :src="c.image_url" class="w-full h-full object-cover" />
                    <div v-else class="w-full h-full flex items-center justify-center text-slate-600 text-xs font-bold">
                      {{ c.name?.charAt(0) }}
                    </div>
                  </div>
                  <span>{{ c.name }}</span>
                  <span class="text-xs px-1.5 py-0.5 rounded" :class="getEthnicityBadge(c.ethnicity)">{{ c.ethnicity }}</span>
                </button>
              </div>
              <p class="text-xs text-slate-500 mt-2">Click a candidate to add as AI opponent</p>
            </div>

            <!-- Plus button to show add AI -->
            <button
              v-if="players.length < (game?.max_players || 2) && !showAddAI"
              @click="showAddAI = true"
              class="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
              </svg>
              <span class="font-medium">Add AI opponent</span>
            </button>
          </div>
        </div>

        <!-- Start Button -->
        <div class="flex gap-4">
          <button
            @click="startGame"
            :disabled="players.length < 2 || starting"
            class="flex-1 py-4 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span v-if="starting">Starting...</span>
            <span v-else>Start Game</span>
          </button>
        </div>
        <p v-if="players.length < 2" class="text-center text-slate-500 text-sm">
          Add at least one AI opponent or wait for another player to join with the code
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSocket } from '../composables/useSocket';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const route = useRoute();
const router = useRouter();
const { on, off, joinGame, leaveGame } = useSocket();
const gameId = computed(() => route.params.id);

const loading = ref(true);
const error = ref('');
const game = ref(null);
const players = ref([]);
const candidates = ref([]);
const showAddAI = ref(false);
const addingAI = ref(false);
const starting = ref(false);
const copied = ref(false);

const takenCandidateIds = computed(() => players.value.map(p => p.candidate_id).filter(Boolean));

const availableAICandidates = computed(() =>
  candidates.value.filter(c => !takenCandidateIds.value.includes(c.id))
);

function getEthnicityBadge(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'bg-green-100 text-green-700';
    case 'Serb': return 'bg-blue-100 text-blue-700';
    case 'Croat': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

async function loadLobby() {
  loading.value = true;
  error.value = '';
  try {
    const [lobbyRes, candRes] = await Promise.all([
      axios.get(`${API_URL}/games/${gameId.value}/lobby`),
      axios.get(`${API_URL}/games/candidates`)
    ]);
    const data = lobbyRes.data;
    if (data.status !== 'waiting') {
      router.replace(`/game/${gameId.value}`);
      return;
    }
    game.value = { join_code: data.join_code, max_players: data.max_players };
    players.value = data.players || [];
    candidates.value = candRes.data.candidates || [];
  } catch (e) {
    error.value = e.response?.data?.error || 'Failed to load lobby';
  } finally {
    loading.value = false;
  }
}

async function addAI(candidate) {
  addingAI.value = true;
  try {
    const res = await axios.post(`${API_URL}/games/${gameId.value}/add-ai`, {
      candidate_id: candidate.id
    });
    players.value = res.data.players || [];
    showAddAI.value = false;
  } catch (e) {
    alert(e.response?.data?.error || 'Failed to add AI');
  } finally {
    addingAI.value = false;
  }
}

async function startGame() {
  starting.value = true;
  try {
    await axios.post(`${API_URL}/games/${gameId.value}/start`);
    router.replace(`/game/${gameId.value}`);
  } catch (e) {
    alert(e.response?.data?.error || 'Failed to start game');
  } finally {
    starting.value = false;
  }
}

function copyCode() {
  if (!game.value?.join_code) return;
  navigator.clipboard.writeText(game.value.join_code);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2000);
}

onMounted(() => {
  joinGame(gameId.value);
  loadLobby();
  on('player_joined', () => loadLobby());
  on('game_started', () => router.replace(`/game/${gameId.value}`));
});
onUnmounted(() => {
  leaveGame(gameId.value);
  off('player_joined');
  off('game_started');
});
</script>
