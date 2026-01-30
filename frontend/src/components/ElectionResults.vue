<template>
  <div v-if="show" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
    <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-yellow-200">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 rounded-t-3xl">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4">
            <div class="bg-white/20 rounded-2xl p-4">
              <span class="text-5xl">🗳️</span>
            </div>
            <div>
              <h2 class="text-4xl font-extrabold">Presidential Election</h2>
              <p class="text-blue-100 text-lg mt-1">Final Results</p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="text-white hover:text-gray-200 text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-all"
          >
            ✕
          </button>
        </div>
        <div class="bg-white/20 rounded-xl p-4 mt-4">
          <div class="flex items-center justify-between text-sm">
            <span class="font-semibold">Total Voters:</span>
            <span class="text-2xl font-bold">{{ formatNumber(election.total_voters) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm mt-2">
            <span class="font-semibold">Voter Turnout:</span>
            <span class="text-xl font-bold">{{ (election.voter_turnout * 100).toFixed(1) }}%</span>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div class="p-8">
        <div class="space-y-6">
          <div
            v-for="(result, index) in sortedResults"
            :key="result.player_id"
            class="card-modern border-2 transition-all duration-500"
            :class="result.is_winner ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-white shadow-2xl scale-105' : 'border-gray-200'"
            :style="{ animationDelay: `${index * 200}ms` }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 flex-1">
                <!-- Rank -->
                <div class="flex-shrink-0">
                  <div
                    class="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-lg"
                    :class="result.is_winner 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
                      : index === 1 
                      ? 'bg-gradient-to-br from-blue-400 to-blue-500 text-white'
                      : index === 2
                      ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                      : 'bg-gray-200 text-gray-600'"
                  >
                    {{ index + 1 }}
                  </div>
                </div>

                <!-- Candidate Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-2xl font-bold text-gray-800">{{ result.candidate_name }}</h3>
                    <span v-if="result.is_winner" class="badge-modern bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm px-3 py-1">
                      🏆 Winner
                    </span>
                    <span v-if="result.is_ai" class="badge-modern bg-gray-400 text-white text-xs">
                      🤖 AI
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-gray-600">
                    <span>{{ result.ethnicity }}</span>
                    <span>•</span>
                    <span>{{ result.ideology }}</span>
                  </div>
                </div>

                <!-- Vote Count -->
                <div class="text-right flex-shrink-0">
                  <div class="text-3xl font-extrabold text-gray-800 mb-1">
                    {{ formatNumber(result.votes) }}
                  </div>
                  <div class="text-lg font-semibold text-gray-600">
                    {{ result.vote_percentage.toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="mt-4">
              <div class="w-full bg-gray-200 rounded-full h-6 overflow-hidden shadow-inner">
                <div
                  class="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                  :class="result.is_winner 
                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                    : index === 1
                    ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                    : 'bg-gradient-to-r from-gray-400 to-gray-500'"
                  :style="{ width: `${animatedPercentages[result.player_id] || 0}%` }"
                >
                  <span class="text-xs font-bold text-white">{{ animatedPercentages[result.player_id]?.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Winner Announcement -->
        <div v-if="winner" class="mt-8 text-center">
          <div class="bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl p-8 border-4 border-yellow-400">
            <div class="text-6xl mb-4 animate-bounce">🎉</div>
            <h3 class="text-3xl font-extrabold text-gray-800 mb-2">
              {{ winner.candidate_name }} Wins!
            </h3>
            <p class="text-xl text-gray-600">
              With {{ formatNumber(winner.votes) }} votes ({{ winner.vote_percentage.toFixed(2) }}%)
            </p>
          </div>
        </div>

        <!-- Close Button -->
        <div class="mt-8 flex justify-center">
          <button
            @click="$emit('close')"
            class="btn-primary px-8 py-4 text-lg"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const props = defineProps({
  show: Boolean,
  election: {
    type: Object,
    default: () => ({ results: [], total_voters: 0, voter_turnout: 0 })
  }
});

const emit = defineEmits(['close']);

const animatedPercentages = ref({});

const sortedResults = computed(() => {
  return [...(props.election.results || [])].sort((a, b) => b.votes - a.votes);
});

const winner = computed(() => {
  return sortedResults.value.find(r => r.is_winner) || sortedResults.value[0];
});

function formatNumber(num) {
  return new Intl.NumberFormat('en-US').format(num);
}

function animatePercentages() {
  sortedResults.value.forEach((result, index) => {
    setTimeout(() => {
      let current = 0;
      const target = result.vote_percentage;
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      const interval = duration / steps;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        animatedPercentages.value[result.player_id] = current;
      }, interval);
    }, index * 200);
  });
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    animatedPercentages.value = {};
    setTimeout(() => {
      animatePercentages();
    }, 300);
  }
});

onMounted(() => {
  if (props.show) {
    setTimeout(() => {
      animatePercentages();
    }, 300);
  }
});
</script>
