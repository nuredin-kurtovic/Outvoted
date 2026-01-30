<template>
  <div class="min-h-screen bg-slate-100 flex flex-col">
    <!-- Header - light theme, matches modal -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div class="flex items-center gap-3">
        <h1 class="font-bold text-lg">Day {{ turnNumber }} Results</h1>
        <span class="text-sm text-slate-300">{{ isAnimating ? `${currentRegionIndex + 1}/${summaryData.regions.length}` : 'Complete' }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button v-if="isAnimating" @click="skipAnimation" class="text-xs px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
          Skip
        </button>
        <button
          :disabled="acknowledging"
          @click="handleContinue"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-semibold transition-colors flex items-center gap-2 disabled:opacity-70"
        >
          {{ acknowledging ? '...' : 'Continue' }}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>

    <!-- Results (bars + map) -->
    <div
      class="flex-1 flex flex-col overflow-hidden transition-opacity duration-500"
      :class="fadeState === 'visible' ? 'opacity-100' : 'opacity-0'"
    >
      <!-- Region Name Banner -->
      <div class="bg-slate-800 text-white py-3 text-center">
        <h2 v-if="isAnimating && currentRegion" class="text-xl font-bold">
          {{ currentRegion.name }}
        </h2>
        <h2 v-else class="text-xl font-bold">Final National Results</h2>
      </div>

      <!-- Content: candidate bars + map -->
      <div class="flex flex-1 overflow-hidden">
        <!-- Left 1/3: Candidate Results -->
        <div class="w-1/3 bg-slate-50 p-4 border-r border-slate-200 overflow-y-auto">
          <div v-if="loading" class="text-slate-500 text-center py-8">Loading...</div>
          <div v-else class="space-y-3">
            <div
              v-for="candidate in displayCandidates"
              :key="`${candidate.id}-${currentRegionIndex}-${phase}`"
              class="bg-white rounded-xl p-3 border border-slate-200"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getCandidatePrimaryColor(candidate.id) }"></div>
                  <span class="font-semibold text-slate-800">{{ candidate.name }}</span>
                  <span v-if="candidate.id === myPlayerId" class="text-xs text-blue-600 font-medium">(You)</span>
                  <span v-if="isAnimating && candidate.changed" class="text-xs px-1.5 py-0.5 rounded"
                    :class="candidate.support > candidate.supportBefore ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                    {{ candidate.support > candidate.supportBefore ? '+' : '' }}{{ ((candidate.support - candidate.supportBefore) * 100).toFixed(1) }}%
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    class="turn-summary-bar h-full rounded-full"
                    :style="isAnimating ? {
                      '--bar-from': ((candidate.supportBefore || 0) * 100) + '%',
                      '--bar-to': ((candidate.support !== undefined ? candidate.support : candidate.national_support) * 100) + '%',
                      backgroundColor: getCandidatePrimaryColor(candidate.id)
                    } : {
                      '--bar-from': '0%',
                      '--bar-to': ((candidate.national_support || 0) * 100) + '%',
                      backgroundColor: getCandidatePrimaryColor(candidate.id)
                    }"
                  ></div>
                </div>
                <span class="font-bold text-lg min-w-[60px] text-right" :style="{ color: getCandidatePrimaryColor(candidate.id) }">
                  <template v-if="isAnimating">
                    {{ animatedNumbers[candidate.id] !== undefined ? getAnimatedNumber(candidate.id) : ((candidate.supportBefore || 0) * 100).toFixed(1) }}%
                  </template>
                  <template v-else>
                    {{ ((candidate.national_support || 0) * 100).toFixed(1) }}%
                  </template>
                </span>
              </div>
              <div v-if="getActionForCandidate(candidate.id)" class="mt-2 pt-2 border-t border-slate-100">
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                    {{ getActionForCandidate(candidate.id).action_name }}{{ getActionForCandidate(candidate.id).region_name ? ` — ${getActionForCandidate(candidate.id).region_name}` : '' }}
                  </span>
                  <span v-if="getActionForCandidate(candidate.id).spending > 0" class="text-red-600">-{{ formatCurrency(getActionForCandidate(candidate.id).spending) }}</span>
                  <span v-if="getActionForCandidate(candidate.id).earned > 0" class="text-green-600">+{{ formatCurrency(getActionForCandidate(candidate.id).earned) }}</span>
                </div>
              </div>
              <div v-else class="mt-2 pt-2 border-t border-slate-100">
                <span class="text-xs text-slate-400 italic">No action this round</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right 2/3: Map -->
        <div class="flex-1 bg-slate-100 flex items-center justify-center p-4">
          <div ref="mapContainer" class="w-full h-full flex items-center justify-center" style="max-width: 450px; max-height: 380px;">
            <div v-if="mapError" class="text-slate-500 text-center">{{ mapError }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useGameStore } from '../stores/game';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const route = useRoute();
const router = useRouter();
const acknowledging = ref(false);
const gameStore = useGameStore();
const gameId = computed(() => route.params.id);
const turnNumber = computed(() => parseInt(route.params.turnNumber, 10) || 1);

const loading = ref(true);
const summaryData = ref({
  regions: [],
  allRegions: [],
  turn: 0,
  actionsByPlayer: {},
  currentRegionIndex: 0,
  currentRegion: null,
  isAnimating: true,
  fadeState: 'visible',
  phase: 'results'
});
const mapContainer = ref(null);
const mapError = ref(null);
const mapSvg = ref(null);
const myPlayerId = ref(null);
const animatedNumbers = ref({});
let numberAnimationFrame = null;
let animateTimeout = null;

const candidateColorSchemes = {
  green: ['#F9FBEF', '#E3EECA', '#C5DFA0', '#8BC550', '#6BBE45', '#40AB48', '#2C8943', '#1E6431', '#1A3819'],
  blue: ['#EFF3FB', '#CAD4EE', '#A0BBDF', '#5075C5', '#456BBE', '#4059AB', '#2C4D89', '#1E3264', '#191F38'],
  red: ['#FBEFEF', '#EECACA', '#DFA0A0', '#C55050', '#BE4545', '#AB4040', '#892C2C', '#641E1E', '#381919'],
  cyan: ['#EFF8FB', '#CAE6EE', '#A0D6DF', '#58BACB', '#2CA5BA', '#4082AB', '#2C7089', '#1E5764', '#193338'],
  purple: ['#FBEFF9', '#EECAEB', '#DFA0D6', '#D781CA', '#D463C3', '#AB3D9D', '#962587', '#7B106D', '#5E0A53'],
  water: ['#DFFFFD', '#C2F4F1', '#A0F6E4', '#77EDE3', '#52DACF', '#23B5AC', '#1EACA3', '#078E86', '#024440']
};

const SVG_PATH_ID_TO_REGION_NAME = {
  'una-sana-canton': 'Una-Sana Canton', 'posavina-canton': 'Posavina Canton', 'tuzla-canton': 'Tuzla Canton',
  'zenica-doboj-canton': 'Zenica-Doboj Canton', 'bosnian-podrinje': 'Bosnian-Podrinje', 'central-bosnia-canton': 'Central Bosnia Canton',
  'herzegovina-neretva-canton': 'Herzegovina-Neretva Canton', 'west-herzegovina-canton': 'West Herzegovina Canton',
  'sarajevo-canton': 'Sarajevo Canton', 'canton-10': 'Canton 10 (Herzeg-Bosnia)', 'banja-luka': 'Banja Luka Core',
  'krajina-west': 'Krajina West', 'doboj': 'Doboj', 'bijeljina': 'Bijeljina', 'podrinje': 'Podrinje', 'romanija': 'Romanija',
  'eastern-herzegovina': 'Eastern Herzegovina', 'brcko': 'Brcko District'
};

const isAnimating = computed(() => summaryData.value.isAnimating);
const currentRegionIndex = computed(() => summaryData.value.currentRegionIndex);
const currentRegion = computed(() => summaryData.value.currentRegion);
const fadeState = computed(() => summaryData.value.fadeState);
const phase = computed(() => summaryData.value.phase);

const displayCandidates = computed(() => {
  const d = summaryData.value;
  if (d.isAnimating && d.currentRegion?.candidates) return d.currentRegion.candidates;
  const players = gameStore.gameState?.all_players || [];
  return [...players]
    .map(p => ({ id: p.id, name: p.candidate_name || 'Unknown', national_support: p.national_support || 0 }))
    .sort((a, b) => (b.national_support || 0) - (a.national_support || 0));
});

const playerColorMap = computed(() => {
  const colors = ['green', 'blue', 'red', 'cyan', 'purple', 'water'];
  const map = {};
  (gameStore.gameState?.all_players || []).forEach((p, i) => { map[p.id] = colors[i % colors.length]; });
  if (gameStore.gameState?.player?.id && !map[gameStore.gameState.player.id]) map[gameStore.gameState.player.id] = 'green';
  return map;
});

function getCandidatePrimaryColor(playerId) {
  const scheme = playerColorMap.value[playerId] || 'green';
  return candidateColorSchemes[scheme]?.[5] || '#40AB48';
}

function getRegionColor(support, colorScheme) {
  const colors = candidateColorSchemes[colorScheme] || candidateColorSchemes.green;
  let p = support <= 1 ? support * 100 : support;
  p = Math.max(0, Math.min(100, p));
  if (p === 0) return '#e2e8f0';
  if (p < 10) return colors[0]; if (p < 20) return colors[1]; if (p < 30) return colors[2];
  if (p < 40) return colors[3]; if (p < 50) return colors[4]; if (p < 60) return colors[5];
  if (p < 70) return colors[6]; if (p < 75) return colors[7];
  return colors[8];
}

function getActionForCandidate(playerId) {
  const data = summaryData.value.actionsByPlayer[playerId] ?? summaryData.value.actionsByPlayer[Number(playerId)] ?? summaryData.value.actionsByPlayer[String(playerId)];
  if (!data?.actions?.length) return null;
  if (currentRegion.value && data.regionActions) {
    const rId = currentRegion.value.id;
    const act = data.regionActions[rId] ?? data.regionActions[Number(rId)] ?? data.regionActions[String(rId)];
    if (act) return act;
  }
  // Final view: merge multi-region campaign actions (same action_id) into one display
  const byActionId = {};
  for (const a of data.actions) {
    const key = a.action_id ?? a.action_name;
    if (!byActionId[key]) {
      byActionId[key] = { ...a, region_names: [], totalSpending: 0 };
    }
    byActionId[key].totalSpending += a.spending || 0;
    if (a.region_name) byActionId[key].region_names.push(a.region_name);
  }
  const merged = Object.values(byActionId)[0];
  if (!merged) return data.actions[0];
  const regionDisplay = merged.region_names.length > 1
    ? merged.region_names.join(', ')
    : (merged.region_names[0] || merged.region_name);
  return {
    ...merged,
    region_name: regionDisplay,
    spending: merged.totalSpending
  };
}

function formatCurrency(amount) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M KM';
  if (amount >= 1000) return Math.round(amount / 1000) + 'K KM';
  return Math.round(amount) + ' KM';
}

function getAnimatedNumber(id) {
  const v = animatedNumbers.value[id];
  return v != null ? v.toFixed(1) : '0.0';
}

function animateNumbers(candidates, duration = 1500) {
  if (numberAnimationFrame) cancelAnimationFrame(numberAnimationFrame);
  const start = performance.now();
  function tick(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const updated = {};
    candidates.forEach(c => {
      const from = (c.supportBefore || 0) * 100;
      const to = (c.support !== undefined ? c.support : c.national_support) * 100;
      updated[c.id] = from + (to - from) * eased;
    });
    animatedNumbers.value = updated;
    if (progress < 1) numberAnimationFrame = requestAnimationFrame(tick);
  }
  numberAnimationFrame = requestAnimationFrame(tick);
}

function updateMapHighlight() {
  const svg = mapSvg.value || mapContainer.value?.querySelector('svg');
  if (!svg) return;
  const data = summaryData.value;
  const allPaths = svg.querySelectorAll('path');
  const regionsList = data.allRegions || data.regions;

  const findRegion = (pathId) => {
    let r = regionsList.find(x => x.name === SVG_PATH_ID_TO_REGION_NAME[pathId]);
    if (!r && pathId) {
      const norm = s => s.toLowerCase().replace(/[–—]/g, '-').replace(/č/gi, 'c').replace(/[^a-z0-9]/g, '');
      const np = norm(pathId);
      r = regionsList.find(x => norm(x.name).includes(np) || np.includes(norm(x.name)));
    }
    return r;
  };
  const getRegionIdx = (r) => !r || !data.regions?.length ? -1 : data.regions.findIndex(x => x.name === r.name || x.id === r.id);
  const getLeaderColor = (r, useBefore) => {
    if (!r?.candidates?.length) return '#e2e8f0';
    const leader = r.candidates[0];
    const scheme = playerColorMap.value[leader.id] || 'green';
    const sup = useBefore ? (leader.supportBefore ?? leader.support) : leader.support;
    return getRegionColor(sup, scheme);
  };

  if (data.isAnimating && data.regions?.length) {
    const idx = data.currentRegionIndex ?? 0;
    allPaths.forEach(path => {
      const pathId = path.getAttribute('id') || '';
      const region = findRegion(pathId);
      const ai = getRegionIdx(region);
      path.style.stroke = '#000';
      path.style.strokeWidth = '0.5px';
      path.style.transition = 'fill 1.5s ease-out';
      if (ai < 0) path.style.fill = '#e2e8f0';
      else if (ai < idx) path.style.fill = getLeaderColor(region, false);
      else if (ai === idx && region) {
        path.style.fill = getLeaderColor(region, true);
        setTimeout(() => { path.style.fill = getLeaderColor(region, false); }, 50);
      } else path.style.fill = '#e2e8f0';
    });
  } else {
    const list = data.allRegions || data.regions;
    allPaths.forEach(path => {
      const pathId = path.getAttribute('id') || '';
      const region = list.find(r => r.name === SVG_PATH_ID_TO_REGION_NAME[pathId]) || list.find(r => {
        const norm = s => s.toLowerCase().replace(/[–—]/g, '-').replace(/č/gi, 'c').replace(/[^a-z0-9]/g, '');
        return norm(pathId) && (norm(r.name).includes(norm(pathId)) || norm(pathId).includes(norm(r.name)));
      });
      if (region) {
        path.style.transition = 'fill 0.5s ease-out';
        path.style.fill = getLeaderColor(region);
        path.style.stroke = '#000';
        path.style.strokeWidth = '0.5px';
      }
    });
  }
}

function runAnimation() {
  const d = summaryData.value;
  if (!d.isAnimating || d.currentRegionIndex >= d.regions.length) {
    d.isAnimating = false;
    d.currentRegion = null;
    updateMapHighlight();
    return;
  }
  d.currentRegion = d.regions[d.currentRegionIndex];
  d.fadeState = 'visible';
  if (d.currentRegion?.candidates) animateNumbers(d.currentRegion.candidates, 1500);
  updateMapHighlight();
  animateTimeout = setTimeout(() => {
    d.fadeState = 'fading-out';
    setTimeout(() => {
      d.currentRegionIndex++;
      d.fadeState = 'visible';
      runAnimation();
    }, 500);
  }, 2500);
}

function skipAnimation() {
  if (animateTimeout) clearTimeout(animateTimeout);
  if (numberAnimationFrame) cancelAnimationFrame(numberAnimationFrame);
  summaryData.value.isAnimating = false;
  summaryData.value.currentRegionIndex = summaryData.value.regions.length;
  summaryData.value.currentRegion = null;
  summaryData.value.fadeState = 'visible';
  updateMapHighlight();
}

async function loadMap() {
  if (!mapContainer.value) return;
  try {
    let svgText = null;
    try {
      const mod = await import('./SVG/bihmap.svg?raw');
      svgText = mod.default;
    } catch (e) {
      const r = await fetch('/bihmap.svg');
      if (r.ok) svgText = await r.text();
    }
    if (!svgText) {
      const r = await fetch((import.meta.env.BASE_URL || '/') + 'bihmap.svg');
      if (r.ok) svgText = await r.text();
    }
    if (!svgText) { mapError.value = 'Map unavailable'; return; }
    const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    svg.style.width = svg.style.height = '100%';
    svg.style.maxWidth = '450px';
    svg.style.maxHeight = '380px';
    svg.querySelectorAll('path').forEach(p => {
      p.style.fill = '#e2e8f0';
      p.style.stroke = '#000';
      p.style.strokeWidth = '0.5px';
      p.style.transition = 'fill 0.5s ease, opacity 0.5s ease';
    });
    mapContainer.value.innerHTML = '';
    mapContainer.value.appendChild(svg);
    mapSvg.value = svg;
    updateMapHighlight();
  } catch (e) {
    mapError.value = 'Map failed to load';
  }
}

async function loadData() {
  loading.value = true;
  try {
    const stateFromRoute = history.state || {};
    const prevRegional = stateFromRoute.previousRegionalSupport;
    const prevAllPlayers = stateFromRoute.previousAllPlayersRegionalSupport;
    const turnSummaryFromRoute = stateFromRoute.turnSummary;

    await gameStore.fetchGameState(gameId.value);
    const state = gameStore.gameState;
    if (!state) throw new Error('No game state');
    myPlayerId.value = state.player?.id;

    const candidates = (state.all_players || []).map(p => ({
      id: p.id,
      name: p.candidate_name || 'Unknown',
      national_support: p.national_support || 0
    }));

    const allRegional = state.all_players_regional_support || [];
    const regionalSupport = state.regional_support || [];

    const buildRegions = () => {
      return regionalSupport.map(r => {
        const regionCandidates = candidates.map(c => {
          const afterRs = allRegional.find(x => x.player_id == c.id && x.region_id == r.region_id);
          const currentSup = afterRs ? afterRs.support_percentage : (c.national_support || 0.15);
          const prevRs = prevAllPlayers ? prevAllPlayers.find(x => x.player_id == c.id && x.region_id == r.region_id) : null;
          const beforeSup = prevRs != null ? prevRs.support_percentage : currentSup;
          return {
            id: c.id,
            name: c.name,
            supportBefore: beforeSup,
            support: currentSup,
            national_support: currentSup,
            changed: Math.abs(currentSup - beforeSup) > 0.001
          };
        });
        regionCandidates.sort((a, b) => b.support - a.support);
        const hasChanges = regionCandidates.some(c => c.changed);
        return {
          id: r.region_id,
          name: r.region_name,
          regionCode: r.region_code,
          population: r.population,
          candidates: regionCandidates,
          hasChanges
        };
      });
    };

    const allRegions = buildRegions();
    const regionsWithChanges = (prevAllPlayers?.length || prevRegional?.length)
      ? allRegions.filter(r => r.hasChanges)
      : allRegions;
    const regions = regionsWithChanges.length > 0 ? regionsWithChanges : allRegions;

    let actionsByPlayer = {};
    if (turnSummaryFromRoute?.players?.length) {
      turnSummaryFromRoute.players.forEach(p => {
        const e = { actions: p.actions || [], regionActions: p.regionActions || {} };
        actionsByPlayer[p.player_id] = actionsByPlayer[Number(p.player_id)] = actionsByPlayer[String(p.player_id)] = e;
      });
    } else {
      try {
        const res = await axios.get(`${API_URL}/games/${gameId.value}/turn-summary/${turnNumber.value}`);
        const players = res.data.players || [];
        players.forEach(p => {
          const e = { actions: p.actions || [], regionActions: p.regionActions || {} };
          actionsByPlayer[p.player_id] = actionsByPlayer[Number(p.player_id)] = actionsByPlayer[String(p.player_id)] = e;
        });
      } catch (e) {
        console.warn('Could not fetch turn actions');
      }
    }

    summaryData.value = {
      turn: turnNumber.value,
      regions,
      allRegions,
      currentRegionIndex: 0,
      currentRegion: regions[0] || null,
      isAnimating: regions.length > 0,
      fadeState: 'visible',
      phase: 'results',
      actionsByPlayer
    };
  } catch (e) {
    console.error('Turn summary load error:', e);
  } finally {
    loading.value = false;
  }
}

async function handleContinue() {
  acknowledging.value = true;
  try {
    const res = await axios.post(`${API_URL}/games/${gameId.value}/acknowledge-turn-summary`);
    const turnAdvanced = res.data?.turn_advanced !== false;
    router.push({
      path: `/game/${gameId.value}`,
      state: { waitingForSummaryAck: !turnAdvanced }
    });
  } catch (e) {
    router.push(`/game/${gameId.value}`);
  } finally {
    acknowledging.value = false;
  }
}

onMounted(async () => {
  await loadData();
  await nextTick();
  await loadMap();
  await nextTick();
  if (summaryData.value.isAnimating && summaryData.value.regions.length > 0) {
    setTimeout(runAnimation, 100);
  } else {
    updateMapHighlight();
  }
});

onUnmounted(() => {
  if (animateTimeout) clearTimeout(animateTimeout);
  if (numberAnimationFrame) cancelAnimationFrame(numberAnimationFrame);
});
</script>
