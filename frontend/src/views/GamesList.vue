<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header Section -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
        <div>
          <div class="flex items-center gap-4 mb-3">
            <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-3 shadow-lg">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <div>
              <h2 class="text-4xl font-extrabold text-gray-800">Your Campaigns</h2>
              <p class="text-gray-600 mt-1">Manage your political campaigns</p>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-4">
          <router-link
            v-if="isAdmin"
            to="/admin"
            class="btn-primary bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span>Admin</span>
          </router-link>
          <button
            @click="openJoinModal"
            class="btn-primary bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
            </svg>
            <span>Join Game</span>
          </button>
          <button
            @click="openCreateModal"
            class="btn-primary flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      <!-- Tabs: Active / Completed -->
      <div v-if="!gameStore.loading && games.length > 0" class="flex gap-2 mb-6">
        <button
          @click="gamesTab = 'active'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="gamesTab === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'"
        >
          Active
        </button>
        <button
          @click="gamesTab = 'completed'"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="gamesTab === 'completed' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'"
        >
          Completed
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="gameStore.loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p class="text-gray-600 mt-6 text-lg font-semibold">Loading campaigns...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredGames.length === 0" class="flex flex-col items-center justify-center py-20">
        <div class="card-modern max-w-md text-center">
          <div class="bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <svg class="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-800 mb-3">No Campaigns Yet</h3>
          <p class="text-gray-600 mb-8">Start your political journey by selecting a candidate!</p>
          <button @click="openCreateModal" class="btn-primary">
            Start Campaign
          </button>
        </div>
      </div>

      <!-- Games Grid -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="game in filteredGames"
          :key="game.id"
          class="group card-modern cursor-pointer hover:-translate-y-2 border-2 border-gray-100 hover:border-blue-300"
          @click="goToGame(game)"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600">
              <img 
                v-if="game.image_url" 
                :src="game.image_url" 
                :alt="game.candidate_name"
                class="w-full h-full object-cover object-top"
                @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {{ game.candidate_name?.charAt(0) || '?' }}
              </div>
            </div>
            <span class="badge-modern" :class="getStatusClass(game.status)">
              {{ game.status }}
            </span>
          </div>
          
          <h3 class="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
            {{ game.candidate_name }}
          </h3>
          
          <div class="space-y-2 mb-4 text-sm">
            <div class="flex items-center gap-2 text-gray-600">
              <span class="font-medium">{{ game.ethnicity }}</span>
              <span class="text-gray-400">•</span>
              <span class="font-medium">{{ game.ideology }}</span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <span>Day {{ game.current_turn }}/{{ game.max_turns }}</span>
            </div>
          </div>
          
          <button
            @click.stop="deleteGame(game.id)"
            class="w-full bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Create Game Modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white rounded-2xl max-w-4xl w-full mx-4 border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <h3 class="text-2xl font-bold">Select Your Candidate</h3>
          <p class="text-blue-100 mt-1">Choose a real politician to lead your campaign</p>
        </div>
        
        <!-- Filter Tabs -->
        <div class="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div class="flex gap-2 flex-wrap">
            <button
              @click="candidateFilter = 'all'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="candidateFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
            >
              All
            </button>
            <button
              @click="candidateFilter = 'Bosniak'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="candidateFilter === 'Bosniak' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
            >
              Bosniak
            </button>
            <button
              @click="candidateFilter = 'Serb'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="candidateFilter === 'Serb' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
            >
              Serb
            </button>
            <button
              @click="candidateFilter = 'Croat'"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="candidateFilter === 'Croat' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
            >
              Croat
            </button>
          </div>
        </div>
        
        <!-- Candidates Grid -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="candidate in filteredCandidates"
              :key="candidate.id"
              @click="selectCandidate(candidate)"
              class="border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg overflow-hidden"
              :class="selectedCandidate?.id === candidate.id 
                ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-300' 
                : 'border-gray-200 hover:border-blue-300 bg-white'"
            >
              <!-- Candidate Image Header -->
              <div class="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                <img 
                  v-if="candidate.image_url" 
                  :src="candidate.image_url" 
                  :alt="candidate.name"
                  class="w-full h-full object-cover object-top"
                  @error="handleImageError($event, candidate)"
                  @load="handleImageLoad($event, candidate)"
                />
                <div v-if="!candidate.image_url || candidate._imageError" class="w-full h-full flex items-center justify-center">
                  <div class="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                       :class="getEthnicityColor(candidate.ethnicity)">
                    {{ candidate.name.charAt(0) }}
                  </div>
                </div>
                <!-- Ethnicity stripe -->
                <div class="absolute bottom-0 left-0 right-0 h-1" :class="getEthnicityStripe(candidate.ethnicity)"></div>
                <!-- Selection checkmark -->
                <div v-if="selectedCandidate?.id === candidate.id" 
                     class="absolute top-2 right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                  </svg>
                </div>
              </div>
              <!-- Candidate Info -->
              <div class="p-4">
                <h4 class="font-bold text-gray-800 text-lg">{{ candidate.name }}</h4>
                <div class="flex items-center gap-2 mt-2">
                  <span class="text-xs px-2 py-1 rounded-full font-medium" :class="getEthnicityBadge(candidate.ethnicity)">
                    {{ candidate.ethnicity }}
                  </span>
                  <span class="text-xs px-2 py-1 rounded-full font-medium" :class="getIdeologyBadge(candidate.ideology)">
                    {{ candidate.ideology }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mt-3 line-clamp-2">{{ candidate.description }}</p>
                <div class="flex items-center text-xs text-gray-400 mt-2">
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  </svg>
                  {{ candidate.home_region_name }}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Max Players (shown after candidate selected) -->
        <div v-if="selectedCandidate" class="border-t border-gray-200 bg-gray-50 p-6">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700">Max players:</span>
            <select v-model="maxPlayers" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
            </select>
          </div>
        </div>
        
        <!-- Modal Footer -->
        <div class="border-t border-gray-200 p-6 bg-white flex gap-4">
          <button
            @click="showCreateModal = false"
            class="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleCreateGame"
            :disabled="!selectedCandidate || creatingGame"
            class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ creatingGame ? 'Creating...' : 'Create Game' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Join Game Modal -->
    <div
      v-if="showJoinModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      @click.self="showJoinModal = false"
    >
      <div class="bg-white rounded-2xl max-w-4xl w-full mx-4 border border-gray-200 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6">
          <h3 class="text-2xl font-bold">Join Game</h3>
          <p class="text-green-100 mt-1">Enter the game code and select your candidate</p>
        </div>
        
        <!-- Join Code Input -->
        <div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Game Code</label>
          <input
            v-model="joinCode"
            type="text"
            placeholder="Enter 6-digit code"
            maxlength="6"
            class="w-full px-4 py-3 border-2 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none transition-colors"
            :class="joinCodeError ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-green-500'"
          />
          <p v-if="joinCodeError" class="text-red-500 text-sm mt-2 text-center">{{ joinCodeError }}</p>
          <p v-else-if="joinCode.length === 6 && !loadingJoinCandidates && joinCandidates.length > 0" class="text-green-600 text-sm mt-2 text-center">
            Game found! Select your candidate below.
          </p>
        </div>
        
        <!-- Loading state -->
        <div v-if="loadingJoinCandidates" class="flex-1 flex items-center justify-center p-8">
          <div class="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <span class="ml-3 text-gray-600">Checking game...</span>
        </div>
        
        <!-- Show candidates only if valid code -->
        <template v-else-if="joinCode.length === 6 && !joinCodeError">
          <!-- Filter Tabs -->
          <div class="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <div class="flex gap-2 flex-wrap">
              <button
                @click="candidateFilter = 'all'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="candidateFilter === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
              >
                All
              </button>
              <button
                @click="candidateFilter = 'Bosniak'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="candidateFilter === 'Bosniak' ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
              >
                Bosniak
              </button>
              <button
                @click="candidateFilter = 'Serb'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="candidateFilter === 'Serb' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
              >
                Serb
              </button>
              <button
                @click="candidateFilter = 'Croat'"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                :class="candidateFilter === 'Croat' ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
              >
                Croat
              </button>
            </div>
          </div>
          
          <!-- Candidates Grid -->
          <div class="flex-1 overflow-y-auto p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="candidate in filteredJoinCandidates"
                :key="candidate.id"
                @click="!candidate.is_taken && selectCandidate(candidate)"
                class="border-2 rounded-xl transition-all overflow-hidden"
                :class="[
                  candidate.is_taken 
                    ? 'border-gray-200 bg-gray-100 cursor-not-allowed' 
                    : selectedCandidate?.id === candidate.id 
                      ? 'border-green-500 bg-green-50 shadow-md cursor-pointer ring-2 ring-green-300' 
                      : 'border-gray-200 hover:border-green-300 bg-white cursor-pointer hover:shadow-lg'
                ]"
              >
                <!-- Candidate Image Header -->
                <div class="relative h-32 overflow-hidden" :class="candidate.is_taken ? 'grayscale opacity-50' : ''">
                  <img 
                    v-if="candidate.image_url && !candidate._imageError" 
                    :src="candidate.image_url" 
                    :alt="candidate.name"
                    class="w-full h-full object-cover object-top bg-gradient-to-br from-gray-100 to-gray-200"
                    @error="handleImageError($event, candidate)"
                    @load="handleImageLoad($event, candidate)"
                  />
                  <div v-if="!candidate.image_url || candidate._imageError" class="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div class="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl"
                         :class="candidate.is_taken ? 'bg-gray-400' : getEthnicityColor(candidate.ethnicity)">
                      {{ candidate.name.charAt(0) }}
                    </div>
                  </div>
                  <!-- Ethnicity stripe -->
                  <div class="absolute bottom-0 left-0 right-0 h-1" 
                       :class="candidate.is_taken ? 'bg-gray-400' : getEthnicityStripe(candidate.ethnicity)"></div>
                  <!-- TAKEN badge -->
                  <div v-if="candidate.is_taken" 
                       class="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                    TAKEN
                  </div>
                  <!-- Selection checkmark -->
                  <div v-else-if="selectedCandidate?.id === candidate.id" 
                       class="absolute top-2 right-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
                    </svg>
                  </div>
                </div>
                <!-- Candidate Info -->
                <div class="p-4" :class="candidate.is_taken ? 'opacity-60' : ''">
                  <h4 class="font-bold text-lg" :class="candidate.is_taken ? 'text-gray-400' : 'text-gray-800'">
                    {{ candidate.name }}
                  </h4>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="text-xs px-2 py-1 rounded-full font-medium" 
                          :class="candidate.is_taken ? 'bg-gray-200 text-gray-500' : getEthnicityBadge(candidate.ethnicity)">
                      {{ candidate.ethnicity }}
                    </span>
                    <span class="text-xs px-2 py-1 rounded-full font-medium" 
                          :class="candidate.is_taken ? 'bg-gray-200 text-gray-500' : getIdeologyBadge(candidate.ideology)">
                      {{ candidate.ideology }}
                    </span>
                  </div>
                  <p class="text-sm mt-3 line-clamp-2" :class="candidate.is_taken ? 'text-gray-400' : 'text-gray-600'">
                    {{ candidate.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- Prompt to enter code -->
        <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
          <p class="text-gray-500">Enter the 6-digit game code to see available candidates</p>
        </div>
        
        <!-- Modal Footer -->
        <div class="border-t border-gray-200 p-6 bg-white flex gap-4">
          <button
            @click="showJoinModal = false"
            class="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            @click="handleJoinGame"
            :disabled="!selectedCandidate || !joinCode || joiningGame"
            class="flex-1 bg-gradient-to-r from-green-600 to-emerald-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
          >
            {{ joiningGame ? 'Joining...' : 'Join Game' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '../stores/game';
import { useAuthStore } from '../stores/auth';
import { useSocket } from '../composables/useSocket';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const router = useRouter();
const gameStore = useGameStore();
const authStore = useAuthStore();
const { on, off } = useSocket();

const games = ref([]);
const isAdmin = computed(() => authStore.isAdmin);
const candidates = ref([]);
const joinCandidates = ref([]); // Candidates with availability for joining
const takenCandidateIds = ref([]);
const showCreateModal = ref(false);
const showJoinModal = ref(false);
const selectedCandidate = ref(null);
const candidateFilter = ref('all');
const gamesTab = ref('active');
const maxPlayers = ref(2);
const joinCode = ref('');
const creatingGame = ref(false);
const joiningGame = ref(false);
const loadingJoinCandidates = ref(false);
const joinCodeError = ref('');

const filteredCandidates = computed(() => {
  if (candidateFilter.value === 'all') {
    return candidates.value;
  }
  return candidates.value.filter(c => c.ethnicity === candidateFilter.value);
});

const filteredGames = computed(() => {
  if (gamesTab.value === 'active') {
    return games.value.filter(g => g.status !== 'completed');
  }
  return games.value.filter(g => g.status === 'completed');
});

const filteredJoinCandidates = computed(() => {
  const list = joinCandidates.value.length > 0 ? joinCandidates.value : candidates.value;
  if (candidateFilter.value === 'all') {
    return list;
  }
  return list.filter(c => c.ethnicity === candidateFilter.value);
});

onMounted(async () => {
  await loadGames();
  await loadCandidates();
  await authStore.checkAdminStatus();
  on('game_deleted', handleGameDeleted);
});

onUnmounted(() => {
  off('game_deleted', handleGameDeleted);
});

function handleGameDeleted(data) {
  if (data?.gameId) {
    games.value = games.value.filter(g => g.id !== data.gameId);
  }
}

async function loadGames() {
  const result = await gameStore.fetchGames();
  if (result.success) {
    games.value = result.games;
  }
}

async function loadCandidates() {
  const result = await gameStore.fetchCandidates();
  if (result.success) {
    candidates.value = result.candidates;
    // Initialize image error state for all candidates
    candidates.value.forEach(c => {
      c._imageError = false;
    });
  }
}

function handleImageError(event, candidate) {
  // Silently handle image errors - don't log to avoid console spam
  candidate._imageError = true;
  if (event.target) {
    event.target.style.display = 'none';
  }
}

function handleImageLoad(event, candidate) {
  candidate._imageError = false;
}

// Watch join code and fetch available candidates when valid
watch(joinCode, async (newCode) => {
  joinCodeError.value = '';
  selectedCandidate.value = null;
  
  if (newCode && newCode.length === 6) {
    await fetchAvailableCandidates(newCode);
  } else {
    joinCandidates.value = [];
    takenCandidateIds.value = [];
  }
});

async function fetchAvailableCandidates(code) {
  loadingJoinCandidates.value = true;
  try {
    const response = await axios.get(`${API_URL}/games/candidates/available/${code}`);
    joinCandidates.value = response.data.candidates;
    takenCandidateIds.value = response.data.taken_candidate_ids || [];
    joinCodeError.value = '';
    // Initialize image error state for join candidates
    joinCandidates.value.forEach(c => {
      c._imageError = false;
    });
  } catch (error) {
    joinCandidates.value = [];
    takenCandidateIds.value = [];
    if (error.response?.status === 404) {
      joinCodeError.value = 'Game not found or not accepting players';
    } else {
      joinCodeError.value = error.response?.data?.error || 'Error checking game';
    }
  } finally {
    loadingJoinCandidates.value = false;
  }
}

function openCreateModal() {
  selectedCandidate.value = null;
  candidateFilter.value = 'all';
  showCreateModal.value = true;
}

function openJoinModal() {
  selectedCandidate.value = null;
  candidateFilter.value = 'all';
  joinCode.value = '';
  joinCandidates.value = [];
  takenCandidateIds.value = [];
  joinCodeError.value = '';
  showJoinModal.value = true;
}

function selectCandidate(candidate) {
  if (candidate.is_taken) return;
  selectedCandidate.value = candidate;
}

function getEthnicityColor(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'bg-green-600';
    case 'Serb': return 'bg-blue-600';
    case 'Croat': return 'bg-red-600';
    default: return 'bg-gray-600';
  }
}

function getEthnicityStripe(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'bg-green-500';
    case 'Serb': return 'bg-blue-500';
    case 'Croat': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

function getEthnicityBadge(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'bg-green-100 text-green-700';
    case 'Serb': return 'bg-blue-100 text-blue-700';
    case 'Croat': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getIdeologyBadge(ideology) {
  switch (ideology) {
    case 'Conservative': return 'bg-purple-100 text-purple-700';
    case 'Liberal': return 'bg-yellow-100 text-yellow-700';
    case 'Socialist': return 'bg-rose-100 text-rose-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700';
    case 'waiting': return 'bg-yellow-100 text-yellow-700';
    case 'completed': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

async function handleCreateGame() {
  if (!selectedCandidate.value || creatingGame.value) return;
  
  creatingGame.value = true;
  try {
    const gameData = {
      candidate_id: selectedCandidate.value.id,
      max_players: maxPlayers.value
    };
    
    const result = await gameStore.createGame(gameData);
    
    if (result.success) {
      showCreateModal.value = false;
      selectedCandidate.value = null;
      if (result.game && result.game.id) {
        router.push(`/game/${result.game.id}/lobby`);
      } else {
        await loadGames();
      }
    } else {
      alert(result.error || 'Failed to create game');
    }
  } catch (error) {
    alert('Failed to create game');
  } finally {
    creatingGame.value = false;
  }
}

async function handleJoinGame() {
  if (!selectedCandidate.value || !joinCode.value || joiningGame.value) return;
  
  joiningGame.value = true;
  try {
    const response = await axios.post(`${API_URL}/games/join`, {
      join_code: joinCode.value,
      candidate_id: selectedCandidate.value.id
    });
    
    if (response.data.game && response.data.game.id) {
      showJoinModal.value = false;
      selectedCandidate.value = null;
      joinCode.value = '';
      router.push(`/game/${response.data.game.id}`);
    }
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to join game');
  } finally {
    joiningGame.value = false;
  }
}

async function deleteGame(gameId) {
  if (!confirm('Are you sure you want to delete this game?')) {
    return;
  }
  
  try {
    await axios.delete(`${API_URL}/games/${gameId}`);
    await loadGames();
  } catch (error) {
    alert(error.response?.data?.error || 'Failed to delete game');
  }
}

function goToGame(game) {
  const id = game?.id ?? game;
  if (game?.status === 'waiting') {
    router.push(`/game/${id}/lobby`);
  } else {
    router.push(`/game/${id}`);
  }
}
</script>
