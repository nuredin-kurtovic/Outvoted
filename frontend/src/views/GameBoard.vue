<template>
  <div class="h-screen flex flex-col overflow-hidden bg-slate-100">

    <div v-if="gameStore.loading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 mt-4 text-lg">Loading campaign...</p>
      </div>
    </div>

    <!-- Waiting Lobby for Multiplayer Games -->
    <div v-else-if="gameState && gameState.game.status === 'waiting'" class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8 overflow-auto">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full max-w-2xl">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
          <h2 class="text-2xl font-bold mb-2">Waiting for Players</h2>
          <p class="text-blue-100">Share the game code with friends to join</p>
        </div>
        
        <!-- Game Code -->
        <div class="p-6 border-b border-gray-200 text-center">
          <p class="text-sm text-gray-500 mb-2">Game Code</p>
          <div class="flex items-center justify-center gap-3">
            <span class="text-4xl font-mono font-bold text-gray-800 tracking-widest">
              {{ gameState.game.join_code }}
            </span>
            <button @click="copyGameCode" class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Copy code">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Your Candidate Info -->
        <div class="p-6 border-b border-gray-200 bg-blue-50">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
              <img 
                v-if="gameState.player.image_url" 
                :src="gameState.player.image_url" 
                :alt="gameState.player.candidate_name"
                class="w-full h-full object-cover object-top"
                @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
              />
              <div v-else class="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
            </div>
            <div>
              <p class="text-sm text-gray-500">Your Candidate</p>
              <h3 class="text-lg font-bold text-gray-800">{{ gameState.player.candidate_name }}</h3>
              <p class="text-sm text-gray-600">{{ gameState.player.ethnicity }} • {{ gameState.player.ideology }}</p>
            </div>
          </div>
        </div>
        
        <!-- Players List -->
        <div class="p-6">
          <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Players ({{ gameState.all_players?.length || 1 }} / {{ gameState.game.max_players || 2 }})
          </h3>
          <div class="space-y-3">
            <div v-for="player in gameState.all_players" :key="player.id"
                 class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0"
                   :class="player.is_ai ? 'bg-gray-400' : 'bg-blue-500'">
                <img 
                  v-if="player.image_url" 
                  :src="player.image_url" 
                  :alt="player.candidate_name"
                  class="w-full h-full object-cover object-top"
                  @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <p class="font-semibold text-gray-800">{{ player.candidate_name }}</p>
                <p class="text-xs text-gray-500">{{ player.ethnicity }} • {{ player.ideology }}</p>
              </div>
              <span v-if="!player.is_ai && player.id === gameState.player.id" class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">You</span>
              <span v-else-if="player.is_ai" class="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded font-semibold">AI</span>
            </div>
            
            <!-- Waiting slots -->
            <div v-for="n in (gameState.game.max_players || 2) - (gameState.all_players?.length || 1)" :key="'empty-' + n"
                 class="flex items-center gap-3 p-3 border-2 border-dashed border-gray-300 rounded-xl">
              <div class="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-gray-400 font-medium">Waiting for player...</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Connection Status -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div class="flex items-center justify-center gap-2 text-sm">
            <span class="w-2 h-2 rounded-full" :class="isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></span>
            <span :class="isConnected ? 'text-green-600' : 'text-red-600'">
              {{ isConnected ? 'Connected - waiting for other players to join' : 'Connecting...' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="gameState && gameState.game.status !== 'waiting'" class="flex-1 flex flex-col overflow-hidden bg-slate-100" :key="`game-${gameId}-${gameState.game.current_turn}`">
      
      <!-- Top Bar -->
      <div class="bg-white shadow-md px-4 py-2 flex items-center justify-between z-30">
        <!-- Left: Back to Lobby -->
        <router-link to="/games" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          <span class="font-medium text-slate-700">Back to Lobby</span>
        </router-link>
        
        <!-- Right: Turn Status -->
        <div class="flex items-center gap-2">
          <!-- Join code for multiplayer -->
          <div v-if="gameState.game.join_code && gameState.game.game_type === 'multiplayer'" class="px-3 py-1.5 bg-slate-100 rounded-lg">
            <span class="text-slate-500 text-sm">Code:</span>
            <span class="font-mono font-bold text-slate-800 ml-1">{{ gameState.game.join_code }}</span>
          </div>
          
          <!-- Timer for multiplayer -->
          <div v-if="gameState.game.game_type === 'multiplayer' && remainingTime > 0" class="px-3 py-1.5 rounded-lg flex items-center gap-2" :class="remainingTime <= 30 ? 'bg-red-50' : 'bg-slate-100'">
            <svg class="w-4 h-4" :class="remainingTime <= 30 ? 'text-red-500' : 'text-slate-500'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span class="font-mono font-bold" :class="remainingTime <= 30 ? 'text-red-600' : 'text-slate-800'">{{ formatTime(remainingTime) }}</span>
          </div>
          
          <!-- Turn status badge -->
          <div v-if="gameState.game.status === 'active' && gameState.game.can_play" class="bg-green-500 text-white rounded-lg px-4 py-1.5 font-bold flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            YOUR TURN
          </div>
          <div v-else-if="gameState.game.status === 'active' && gameState.game.has_completed_turn" class="bg-amber-500 text-white rounded-lg px-4 py-1.5 font-bold flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            WAITING
          </div>
          <div v-else-if="gameState.game.status === 'completed'" @click="initializeAndShowElection()" class="bg-purple-500 text-white rounded-lg px-4 py-1.5 font-bold cursor-pointer hover:bg-purple-600 flex items-center gap-2">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            VIEW RESULTS
          </div>
        </div>
      </div>

      <!-- Main Game Area -->
      <div class="flex-1 flex overflow-hidden relative">
        
        <!-- LEFT PANEL -->
        <div class="absolute left-4 top-4 z-20 w-72">
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            <!-- Candidate Header -->
            <div class="p-4 flex items-center gap-3 border-b border-slate-100">
              <img v-if="gameState.player.image_url" :src="gameState.player.image_url" class="w-14 h-14 rounded-xl object-cover shadow" />
              <div v-else class="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center">
                <svg class="w-7 h-7 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-slate-800 truncate">{{ gameState.player.candidate_name }}</h3>
                <p class="text-slate-500 text-sm">{{ gameState.player.ethnicity }}</p>
              </div>
            </div>
            
            <!-- Stats -->
            <div class="p-4 space-y-3">
              <!-- Support -->
              <div class="flex items-center justify-between">
                <span class="text-slate-600">Support</span>
                <span class="text-xl font-bold text-blue-600">{{ useElectionPercentages ? getPlayerDisplayPercentage(gameState.player).toFixed(2) : (gameState.player.national_support * 100).toFixed(1) }}%</span>
              </div>
              
              <!-- Budget -->
              <div class="flex items-center justify-between">
                <span class="text-slate-600">Budget</span>
                <span class="text-lg font-bold text-emerald-600">{{ formatCurrency(gameState.player.budget) }}</span>
              </div>
              
              <!-- Charisma -->
              <div class="flex items-center justify-between">
                <span class="text-slate-600">Charisma</span>
                <span class="text-lg font-bold" :class="gameState.player.charisma_points >= 50 ? 'text-orange-500' : 'text-slate-700'">{{ gameState.player.charisma_points }}</span>
              </div>
              
              <!-- Days -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-100">
                <span class="text-slate-600">Days Left</span>
                <span class="text-lg font-bold text-slate-800">{{ Math.max(0, gameState.game.max_turns - displayCurrentTurn) }}</span>
              </div>
            </div>
            
            <!-- Standings -->
            <div v-if="gameState.all_players && gameState.all_players.length > 1" class="border-t border-slate-100 p-4">
              <div class="text-xs font-bold text-slate-400 uppercase mb-3">Standings</div>
              <div class="space-y-2">
                <div v-for="(p, i) in sortedPlayers" :key="p.id" class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" 
                        :class="i === 0 ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'">{{ i + 1 }}</span>
                  <span class="flex-1 truncate" :class="p.is_current_player ? 'font-semibold text-blue-600' : 'text-slate-700'">{{ p.candidate_name }}</span>
                  <span class="font-bold text-slate-800">{{ useElectionPercentages ? getPlayerDisplayPercentage(p).toFixed(2) : (p.national_support * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
            
            <!-- Active Buffs -->
            <div v-if="gameState.active_skills.length > 0" class="border-t border-slate-100 p-4">
              <div class="text-xs font-bold text-purple-500 uppercase mb-2">Active Buffs</div>
              <div class="space-y-1">
                <div v-for="skill in gameState.active_skills" :key="skill.id" class="flex items-center justify-between text-sm">
                  <span class="text-slate-700">{{ skill.action_name }}</span>
                  <span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold text-xs">{{ skill.turns_remaining }}t</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Calendar Shortcut -->
          <button @click="showCalendarModal = true" class="mt-3 w-full bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 hover:bg-blue-50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <div class="text-left">
              <div class="font-semibold text-slate-800">Calendar</div>
              <div class="text-xs text-slate-500">Day {{ displayCurrentTurn }} of {{ gameState.game.max_turns }}</div>
            </div>
          </button>
        </div>
        
        <!-- MAP AREA -->
        <div class="flex-1 relative overflow-hidden flex items-start justify-center pt-8">
          
          <!-- Zoom Controls - top center below bar -->
          <div class="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-slate-800/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-slate-600">
            <button @click="zoomOut" class="w-8 h-8 hover:bg-slate-700 text-white rounded flex items-center justify-center text-lg font-bold">−</button>
            <button @click="resetZoom" class="w-8 h-8 hover:bg-slate-700 text-white rounded flex items-center justify-center text-[10px] font-bold">1:1</button>
            <button @click="zoomIn" class="w-8 h-8 hover:bg-slate-700 text-white rounded flex items-center justify-center text-lg font-bold">+</button>
          </div>
          
          <!-- Map wrapper -->
          <div class="relative" style="perspective: 900px; perspective-origin: 50% 40%;">
            <!-- Map with 3D tilt -->
            <div class="map-3d-container relative transition-transform duration-200" :style="{ transform: `rotateX(35deg) scale(${mapZoom})`, transformStyle: 'preserve-3d' }">
              <div class="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/20 rounded-[50%] blur-lg"></div>
              <div ref="svgContainer" class="map-svg-container px-20 py-4 relative" style="background: linear-gradient(180deg, #F5F0EB 0%, #E8E4E0 40%, #DEDAD6 70%, #D0CCC8 100%); border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                <div v-if="!gameState?.regional_support" class="flex items-center justify-center h-64 text-gray-500 text-sm">Loading...</div>
              </div>
            </div>
          </div>
          
          <!-- Candidate Legend - pinned to bottom -->
          <div class="absolute bottom-[30px] left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg px-3 py-2">
            <span class="text-xs text-slate-500 font-medium mr-1">Leaders:</span>
            <div
              v-for="player in sortedPlayers"
              :key="player.id"
              class="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              :class="player.is_current_player ? 'bg-slate-100' : ''"
            >
              <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getCandidatePrimaryColor(player.id) }"></div>
              <span class="font-medium text-xs text-slate-700">{{ player.candidate_name }}</span>
              <span class="text-[10px] font-bold" :style="{ color: getCandidatePrimaryColor(player.id) }">
                {{ useElectionPercentages ? getPlayerDisplayPercentage(player).toFixed(2) : (player.national_support * 100).toFixed(0) }}%
              </span>
            </div>
          </div>
          
        </div>
        
        <!-- Hover Tooltip - fixed position follows cursor -->
        <div v-if="hoveredRegion && hoveredRegionData" class="fixed bg-white rounded-xl shadow-xl pointer-events-none z-50 min-w-[200px] border border-slate-200 overflow-hidden" :style="tooltipStyle">
          <div class="px-3 py-2 bg-slate-50 border-b border-slate-100">
            <div class="font-semibold text-slate-800 text-sm">{{ hoveredRegionData.name }}</div>
            <div class="text-xs text-slate-400">{{ formatPopulation(hoveredRegionData.population) }} voters</div>
          </div>
          <div class="p-2 space-y-1">
            <div v-for="candidate in hoveredRegionData.candidates" :key="candidate.id" class="flex items-center gap-2 px-2 py-1 rounded-lg text-sm" :class="candidate.isYou ? 'bg-blue-50' : ''">
              <span class="w-9 text-center font-bold" :class="candidate.isYou ? 'text-blue-600' : 'text-slate-700'">{{ Math.round(candidate.support * 100) }}%</span>
              <span class="flex-1 truncate text-slate-600">{{ candidate.name }}</span>
              <span class="text-slate-400 text-xs">{{ candidate.isYou ? '(You)' : candidate.isAI ? '(AI)' : '' }}</span>
            </div>
          </div>
        </div>
        
        <!-- RIGHT ACTIONS PANEL -->
        <div class="absolute right-4 top-4 z-20 w-64">
          <!-- Waiting for other player to view summary -->
          <div v-if="waitingForSummaryAck" class="mb-3 bg-amber-500 text-white rounded-xl p-3 text-center font-semibold shadow-lg">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>Waiting for other player to view turn summary...</span>
            </div>
          </div>
          <!-- Turn Status -->
          <div v-else-if="gameState.game.status === 'active' && gameState.game.has_completed_turn" class="mb-3 bg-emerald-500 text-white rounded-xl p-3 text-center font-semibold shadow-lg">
            <div class="flex items-center justify-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Turn Complete
            </div>
          </div>
          
          <!-- Actions Menu -->
          <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div class="p-4 border-b border-slate-100">
              <h3 class="font-bold text-slate-800">Actions</h3>
            </div>
            
            <div class="p-3 space-y-2">
              <!-- Global Campaign -->
              <button @click="openActionModal('global')" :disabled="!gameState.game.can_play" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 disabled:opacity-40 transition-colors text-left">
                <div class="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <div class="font-semibold text-slate-800">Global</div>
                  <div class="text-xs text-slate-500">Nationwide campaign</div>
                </div>
              </button>
              
              <!-- Local Campaign -->
              <button @click="openActionModal('local')" :disabled="!gameState.game.can_play" class="w-full flex items-center gap-3 p-3 rounded-xl disabled:opacity-40 transition-colors text-left" :class="selectedRegions.length ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-slate-50'">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" :class="selectedRegions.length ? 'bg-emerald-500' : 'bg-slate-300'">
                  <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold" :class="selectedRegions.length ? 'text-emerald-700' : 'text-slate-800'">Local</div>
                  <div class="text-xs truncate" :class="selectedRegions.length ? 'text-emerald-600' : 'text-slate-500'">{{ selectedRegions.length ? getSelectedRegionsSummary() : 'Select regions' }}</div>
                </div>
              </button>
              
              <!-- Fundraising -->
              <button @click="openActionModal('fundraising')" :disabled="!gameState.game.can_play" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 disabled:opacity-40 transition-colors text-left">
                <div class="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <div class="font-semibold text-slate-800">Fundraising</div>
                  <div class="text-xs text-slate-500">Raise money</div>
                </div>
              </button>
              
              <!-- Skills -->
              <button @click="openActionModal('skills')" :disabled="!gameState.game.can_play" class="w-full flex items-center gap-3 p-3 rounded-xl disabled:opacity-40 transition-colors text-left hover:bg-purple-50">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-500">
                  <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <div class="min-w-0">
                  <div class="font-semibold text-slate-800">Skills</div>
                  <div class="text-xs text-slate-500">Special abilities</div>
                </div>
              </button>
            </div>
          </div>
          
          <!-- Budget Shortcut -->
          <button @click="showBudgetModal = true" class="mt-3 w-full bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 hover:bg-emerald-50 transition-colors">
            <div class="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div class="text-left">
              <div class="font-semibold text-slate-800">Budget</div>
              <div class="text-xs text-emerald-600 font-semibold">{{ formatCurrency(gameState.player.budget) }}</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Calendar Modal -->
      <div v-if="showCalendarModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showCalendarModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-modalIn">
          <div class="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <div>
                <h3 class="font-bold text-lg">Campaign Timeline</h3>
                <p class="text-sm text-blue-100">Day {{ displayCurrentTurn }} of {{ gameState.game.max_turns }}</p>
              </div>
            </div>
            <button @click="showCalendarModal = false" class="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-5">
            <!-- Calendar Grid -->
            <div class="grid grid-cols-7 sm:grid-cols-10 gap-2 mb-4">
              <div
                v-for="day in gameState.game.max_turns"
                :key="day"
                class="rounded-lg p-2 border min-h-[60px] flex flex-col items-center justify-center cursor-pointer transition-all"
                :class="getCalendarDayClass(day)"
                @click="day < displayCurrentTurn ? viewTurnDetails(day) : null"
              >
                <div class="text-lg font-bold">{{ day }}</div>
                <div v-if="day === displayCurrentTurn && gameState.game.status === 'active'" class="text-[10px] font-bold">NOW</div>
                <div v-else-if="day < displayCurrentTurn" class="text-green-500 text-xs">✓</div>
              </div>
            </div>
            
            <!-- Legend -->
            <div class="flex items-center justify-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-4">
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded bg-blue-600"></div>
                <span>Current</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                <span>Completed</span>
              </div>
              <div class="flex items-center gap-1">
                <div class="w-3 h-3 rounded bg-slate-100 border border-slate-200"></div>
                <span>Upcoming</span>
              </div>
            </div>
            
            <!-- Progress -->
            <div class="mt-4 bg-slate-50 rounded-xl p-4">
              <div class="flex justify-between text-sm mb-2">
                <span class="text-slate-600">Campaign Progress</span>
                <span class="font-bold text-slate-800">{{ Math.round((displayCurrentTurn / gameState.game.max_turns) * 100) }}%</span>
              </div>
              <div class="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full" :style="{ width: (displayCurrentTurn / gameState.game.max_turns * 100) + '%' }"></div>
              </div>
              <div class="flex justify-between text-xs text-slate-500 mt-2">
                <span>{{ displayCurrentTurn }} days completed</span>
                <span>{{ Math.max(0, gameState.game.max_turns - displayCurrentTurn) }} days remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Budget Modal -->
      <div v-if="showBudgetModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="showBudgetModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-modalIn">
          <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-5 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <h3 class="font-bold text-lg">Campaign Finances</h3>
            </div>
            <button @click="showBudgetModal = false" class="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="p-5">
            <!-- Current Budget -->
            <div class="text-center mb-6 bg-emerald-50 rounded-xl p-6">
              <div class="text-sm text-emerald-600 mb-1">Available Budget</div>
              <div class="text-4xl font-bold text-emerald-700">{{ formatCurrency(gameState.player.budget) }}</div>
            </div>
            
            <!-- Financial Summary -->
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div class="bg-red-50 rounded-xl p-3 text-center">
                <div class="text-xs text-red-600 mb-1">Spent</div>
                <div class="text-lg font-bold text-red-700">{{ formatCurrency(gameState.player.spending?.total_spent || 0) }}</div>
              </div>
              <div class="bg-green-50 rounded-xl p-3 text-center">
                <div class="text-xs text-green-600 mb-1">Raised</div>
                <div class="text-lg font-bold text-green-700">{{ formatCurrency(gameState.player.spending?.total_earned || 0) }}</div>
              </div>
              <div class="bg-slate-50 rounded-xl p-3 text-center">
                <div class="text-xs text-slate-600 mb-1">Net Flow</div>
                <div class="text-lg font-bold" :class="(gameState.player.spending?.total_earned || 0) - (gameState.player.spending?.total_spent || 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ (gameState.player.spending?.total_earned || 0) - (gameState.player.spending?.total_spent || 0) >= 0 ? '+' : '' }}{{ formatCurrency((gameState.player.spending?.total_earned || 0) - (gameState.player.spending?.total_spent || 0)) }}
                </div>
              </div>
            </div>
            
            <!-- Recent Spending -->
            <div v-if="recentSpending.length > 0" class="border-t border-slate-100 pt-4">
              <div class="text-xs font-bold text-slate-400 uppercase mb-3">Recent Activity</div>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                <div v-for="item in recentSpending" :key="item.id" class="flex items-center justify-between text-sm p-2 rounded-lg" :class="item.amount > 0 ? 'bg-green-50' : 'bg-red-50'">
                  <span class="text-slate-700">{{ item.action_name }}</span>
                  <span class="font-bold" :class="item.amount > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ item.amount > 0 ? '+' : '' }}{{ formatCurrency(item.amount) }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="border-t border-slate-100 pt-4 text-center text-slate-500 text-sm">
              No financial activity yet
            </div>
          </div>
        </div>
      </div>

      <!-- Turn Summary - now a full page at /game/:id/turn/:turnNumber -->
      <div v-if="false" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-modalIn">
          <!-- Header -->
          <div class="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <h3 class="font-bold text-lg">Day {{ turnSummaryData.turn }} Results</h3>
              <span class="text-sm text-slate-300">{{ turnSummaryData.isAnimating ? `${turnSummaryData.currentRegionIndex + 1}/${turnSummaryData.regions.length}` : 'Complete' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button v-if="turnSummaryData.isAnimating" @click="skipTurnSummaryAnimation" class="text-xs px-3 py-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                Skip
              </button>
              <button @click="closeTurnSummary" class="w-8 h-8 hover:bg-white/20 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          
          <!-- Results (bars + map) -->
          <div 
            class="transition-opacity duration-500"
            :class="turnSummaryData.fadeState === 'visible' ? 'opacity-100' : 'opacity-0'"
          >
            <!-- Region Name Banner (smaller when showing results) -->
            <div class="bg-slate-800 text-white py-3 text-center">
              <h2 v-if="turnSummaryData.isAnimating && turnSummaryData.currentRegion" class="text-xl font-bold">
                {{ turnSummaryData.currentRegion.name }}
              </h2>
              <h2 v-else class="text-xl font-bold">Final National Results</h2>
            </div>
            
            <!-- Content -->
            <div class="flex h-[420px]">
              <!-- Left 1/3: Candidate Results -->
              <div class="w-1/3 bg-slate-50 p-4 border-r border-slate-200 overflow-y-auto">
                <!-- Candidate bars: when animating = per-region with growth; when complete = global % same as leaders -->
                <div class="space-y-3">
                  <div
                    v-for="candidate in (turnSummaryData.isAnimating && turnSummaryData.currentRegion ? turnSummaryData.currentRegion.candidates : turnSummaryFinalCandidates)"
                    :key="`${candidate.id}-${turnSummaryData.currentRegionIndex}-${turnSummaryData.phase}`"
                    class="bg-white rounded-xl p-3 border border-slate-200"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex items-center gap-2">
                        <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: getCandidatePrimaryColor(candidate.id) }"></div>
                        <span class="font-semibold text-slate-800">{{ candidate.name }}</span>
                        <span v-if="candidate.id === gameState.player.id" class="text-xs text-blue-600 font-medium">(You)</span>
                        <span v-if="turnSummaryData.isAnimating && candidate.changed" class="text-xs px-1.5 py-0.5 rounded" 
                          :class="candidate.support > candidate.supportBefore ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'">
                          {{ candidate.support > candidate.supportBefore ? '+' : '' }}{{ ((candidate.support - candidate.supportBefore) * 100).toFixed(1) }}%
                        </span>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          class="turn-summary-bar h-full rounded-full" 
                          :style="turnSummaryData.isAnimating ? { 
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
                        <template v-if="turnSummaryData.isAnimating">
                          {{ animatedNumbers[candidate.id] ? getAnimatedNumber(candidate.id) : ((candidate.supportBefore || 0) * 100).toFixed(1) }}%
                        </template>
                        <template v-else>
                          {{ useElectionPercentages ? getPlayerDisplayPercentage(candidate).toFixed(2) : ((candidate.national_support || 0) * 100).toFixed(0) }}%
                        </template>
                      </span>
                    </div>
                    <!-- Action info for this region/candidate -->
                    <div v-if="getTurnActionForCandidate(candidate.id)" class="mt-2 pt-2 border-t border-slate-100">
                      <div class="flex items-center gap-2 text-xs">
                        <span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                          {{ getTurnActionForCandidate(candidate.id).action_name }}{{ getTurnActionForCandidate(candidate.id).region_name ? ` — ${getTurnActionForCandidate(candidate.id).region_name}` : '' }}
                        </span>
                        <span v-if="getTurnActionForCandidate(candidate.id).spending > 0" class="text-red-600">
                          -{{ formatCurrency(getTurnActionForCandidate(candidate.id).spending) }}
                        </span>
                        <span v-if="getTurnActionForCandidate(candidate.id).earned > 0" class="text-green-600">
                          +{{ formatCurrency(getTurnActionForCandidate(candidate.id).earned) }}
                        </span>
                      </div>
                    </div>
                    <div v-else class="mt-2 pt-2 border-t border-slate-100">
                      <span class="text-xs text-slate-400 italic">No action this round</span>
                      <span class="text-[10px] text-slate-300 ml-1">(id: {{ candidate.id }})</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Right 2/3: Map -->
              <div class="w-2/3 bg-slate-100 flex items-center justify-center p-4">
                <div ref="turnSummaryMapContainer" class="w-full h-full flex items-center justify-center">
                  <!-- SVG Map will be injected here -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Modal -->
      <div
        v-if="showActionsModal && selectedActionType"
        class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="showActionsModal = false"
      >
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] overflow-hidden flex flex-col animate-modalIn border border-slate-200">
          <div class="flex justify-between items-center px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-white">
            <h3 class="text-lg font-bold flex items-center gap-3">
              <div class="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <svg v-if="selectedActionType === 'global'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <svg v-else-if="selectedActionType === 'local'" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                <svg v-else-if="selectedActionType === 'fundraising'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              {{ getModalTitle() }}
            </h3>
            <button @click="showActionsModal = false" class="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          
          <div class="overflow-y-auto p-5 bg-slate-50">
              <!-- Global Campaigns -->
              <div v-if="selectedActionType === 'global'">
                <p class="text-slate-500 mb-4 text-sm">Reach voters across all regions</p>
                <p class="text-slate-400 text-xs mb-3">Regions at 100% support are not affected (no campaign works there).</p>
                <div v-if="globalCampaignActions.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    v-for="action in globalCampaignActions"
                    :key="action.id"
                    class="rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all bg-white group"
                  >
                    <div class="p-4">
                      <div class="flex items-start justify-between mb-2">
                        <span class="font-semibold text-slate-800">{{ action.name }}</span>
                        <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{{ formatCurrency(action.base_cost) }}</span>
                      </div>
                      <p class="text-slate-500 text-sm mb-3 line-clamp-2">{{ action.description }}</p>
                      <div v-if="action.charisma_cost > 0" class="text-xs text-orange-600 flex items-center gap-1 mb-3">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        {{ action.charisma_cost }} charisma
                      </div>
                      <button
                        @click="executeAction(action, 'campaign'); showActionsModal = false"
                        :disabled="!gameState.game.can_play || gameState.player.budget < action.base_cost || (action.charisma_cost > 0 && gameState.player.charisma_points < action.charisma_cost)"
                        class="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        Launch Campaign
                      </button>
                    </div>
                  </div>
                </div>
                <div v-else class="text-center py-8 text-slate-400">
                  <p>No global campaigns available.</p>
                </div>
              </div>
              
              <!-- Local Campaigns -->
              <div v-if="selectedActionType === 'local' && localCampaignActions.length > 0">
                <div v-if="selectedRegions.length === 0" class="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm flex items-center gap-2">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  Select regions on the map (click to add, click again to remove)
                </div>
                <div v-else class="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
                  <svg class="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                  Targeting <strong>{{ selectedRegions.length }} region(s)</strong>: {{ getSelectedRegionsSummary() }}
                </div>
                <div v-if="hasAnySelectedRegionFull" class="mb-4 p-3 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-sm flex items-center gap-2">
                  <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                  Some selected regions are at 100% support; remove them to continue.
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div
                    v-for="action in localCampaignActions"
                    :key="action.id"
                    class="rounded-xl overflow-hidden border border-slate-200 hover:border-green-400 hover:shadow-md transition-all bg-white group"
                  >
                    <div class="p-4">
                      <div class="flex items-start justify-between mb-2">
                        <span class="font-semibold text-slate-800">{{ action.name }}</span>
                        <span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                          {{ formatCurrency(action.base_cost) }}{{ selectedRegions.length > 1 ? ` × ${selectedRegions.length} = ${formatCurrency(action.base_cost * selectedRegions.length)}` : '' }}
                        </span>
                      </div>
                      <p class="text-slate-500 text-sm mb-3 line-clamp-2">{{ action.description }}</p>
                      <div v-if="action.rules?.last_week_only" class="text-xs text-orange-600 flex items-center gap-1 mb-3">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Final week only
                      </div>
                      <button
                        @click="executeAction(action, 'campaign'); showActionsModal = false"
                        :disabled="selectedRegions.length === 0 || !gameState.game.can_play || hasAnySelectedRegionFull || (gameState.player.budget < (action.base_cost * selectedRegions.length))"
                        class="w-full py-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg v-if="selectedRegions.length" class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                        {{ selectedRegions.length === 0 ? 'Select Regions' : hasAnySelectedRegionFull ? 'Region at 100%' : gameState.player.budget < (action.base_cost * selectedRegions.length) ? 'Not enough budget' : `Launch in ${selectedRegions.length} region(s)` }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Fundraising -->
              <div v-if="selectedActionType === 'fundraising' && fundraisingActions.length > 0">
                <p class="text-slate-500 mb-4 text-sm">Raise funds for your campaign</p>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div
                    v-for="action in fundraisingActions"
                    :key="action.id"
                    class="rounded-xl overflow-hidden border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all bg-white"
                    :class="isActionUsed(action.id) ? 'opacity-50' : ''"
                  >
                    <div class="p-4">
                      <div class="flex items-start justify-between mb-2">
                        <span class="font-semibold text-slate-800">{{ action.name }}</span>
                        <span v-if="isActionUsed(action.id)" class="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full">USED</span>
                      </div>
                      <p class="text-slate-500 text-sm mb-3 line-clamp-2">{{ action.description }}</p>
                      <button
                        @click="executeAction(action, 'fundraising'); showActionsModal = false"
                        :disabled="isActionUsed(action.id) || !gameState.game.can_play"
                        class="w-full py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {{ isActionUsed(action.id) ? 'Already Used' : 'Fundraise' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Skills -->
              <div v-if="selectedActionType === 'skills' && skillActions.length > 0">
                <p class="text-slate-500 mb-4 text-sm">Temporary buffs (3 turns duration)</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    v-for="action in skillActions"
                    :key="action.id"
                    class="rounded-xl overflow-hidden border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all bg-white"
                  >
                    <div class="p-4">
                      <div class="flex items-start justify-between mb-2">
                        <span class="font-semibold text-slate-800">{{ action.name }}</span>
                        <span class="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                          {{ action.charisma_cost || 0 }}
                        </span>
                      </div>
                      <p class="text-slate-500 text-sm mb-3 line-clamp-2">{{ action.description }}</p>
                      <button
                        @click="executeAction(action, 'skill'); showActionsModal = false"
                        :disabled="!gameState.game.can_play || gameState.player.charisma_points < (action.charisma_cost || 0)"
                        class="w-full py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-slate-200 disabled:text-slate-400 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                        {{ gameState.player.charisma_points < (action.charisma_cost || 0) ? `Need ${action.charisma_cost} charisma` : 'Activate' }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="selectedActionType && getActionsForType().length === 0" class="text-center py-8 text-navy-600">
                No actions available in this category.
              </div>
          </div>
        </div>
      </div>


      <!-- Success/Error Messages -->
      <div
        v-if="message"
        class="fixed bottom-6 right-6 bg-white rounded-xl shadow-2xl p-5 max-w-sm border-2"
        :class="messageType === 'error' ? 'border-red-300' : 'border-green-300'"
      >
        <p :class="messageType === 'error' ? 'text-red-700' : 'text-green-700'">
          {{ message }}
        </p>
      </div>

      <!-- Socket Notification (top center) -->
      <Transition name="slide-down">
        <div
          v-if="socketNotification"
          class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div class="flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl border-2"
               :class="{
                 'bg-blue-50 border-blue-300': socketNotification.type === 'info',
                 'bg-green-50 border-green-300': socketNotification.type === 'success',
                 'bg-red-50 border-red-300': socketNotification.type === 'error'
               }">
            <!-- Icon -->
            <div v-if="socketNotification.type === 'info'" class="text-blue-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div v-else-if="socketNotification.type === 'success'" class="text-green-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div v-else class="text-red-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <!-- Message -->
            <span class="font-medium"
                  :class="{
                    'text-blue-700': socketNotification.type === 'info',
                    'text-green-700': socketNotification.type === 'success',
                    'text-red-700': socketNotification.type === 'error'
                  }">
              {{ socketNotification.message }}
            </span>
            <!-- Live indicator -->
            <div v-if="isConnected" class="flex items-center gap-1 text-xs text-gray-500">
              <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>Live</span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Announcement Modal - REMOVED (use Turn Summary page instead) -->
      <div v-if="false" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <div>
                  <h3 class="font-bold">Turn {{ announcementData.turn || gameState.game.current_turn }} Complete</h3>
                  <p class="text-sm text-slate-300">Here's what happened</p>
                </div>
              </div>
              <button @click="showAnnouncementModal = false" class="text-white/70 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          
          <!-- Content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">
            
            <!-- National Support Change - Main Highlight -->
            <div v-if="announcementData.totalNationalChange !== undefined" class="rounded-xl p-4"
                 :class="announcementData.totalNationalChange >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <div class="flex items-center justify-between">
                <div>
                  <div class="text-xs uppercase tracking-wide font-semibold" :class="announcementData.totalNationalChange >= 0 ? 'text-green-600' : 'text-red-600'">
                    National Support Change
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    {{ (announcementData.nationalSupportBefore * 100).toFixed(1) }}% → {{ (announcementData.nationalSupportAfter * 100).toFixed(1) }}%
                  </div>
                </div>
                <div class="text-3xl font-black" :class="announcementData.totalNationalChange >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ announcementData.totalNationalChange >= 0 ? '+' : '' }}{{ (announcementData.totalNationalChange * 100).toFixed(2) }}%
                </div>
              </div>
            </div>

            <!-- Your Action -->
            <div v-if="announcementData.yourAction" class="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                <span class="font-bold text-gray-800 text-sm">Your Action</span>
              </div>
              <div class="bg-white rounded-lg p-3 border border-blue-100">
                <div class="font-semibold text-gray-800">{{ announcementData.yourAction.actionName }}</div>
                <div v-if="announcementData.yourAction.regionName" class="text-sm text-gray-500">
                  {{ announcementData.yourAction.global ? '🌍 All Regions' : '📍 ' + announcementData.yourAction.regionName }}
                </div>
                
                <!-- Campaign specific -->
                <div v-if="announcementData.yourAction.type === 'campaign'" class="mt-2 pt-2 border-t border-gray-100 space-y-1">
                  <div v-if="!announcementData.yourAction.global && announcementData.yourAction.oldSupport !== undefined" class="text-sm">
                    <span class="text-gray-500">Only in {{ announcementData.yourAction.regionName || 'target region' }}:</span>
                    <span class="font-semibold text-gray-700 ml-1">{{ (announcementData.yourAction.oldSupport * 100).toFixed(1) }}% → {{ (announcementData.yourAction.newSupport * 100).toFixed(1) }}%</span>
                    <span class="ml-1 font-bold" :class="announcementData.yourAction.supportGain >= 0 ? 'text-green-600' : 'text-red-600'">
                      ({{ announcementData.yourAction.supportGain >= 0 ? '+' : '' }}{{ (announcementData.yourAction.supportGain * 100).toFixed(1) }}%)
                    </span>
                    <div class="text-xs text-gray-400 mt-0.5">Local campaigns affect only this region.</div>
                  </div>
                  <div class="text-sm">
                    <span class="text-gray-500">National impact (weighted average):</span>
                    <span class="font-bold ml-1" :class="announcementData.actionNationalChange >= 0 ? 'text-green-600' : 'text-red-600'">
                      {{ announcementData.actionNationalChange >= 0 ? '+' : '' }}{{ (announcementData.actionNationalChange * 100).toFixed(2) }}%
                    </span>
                    <div class="text-xs text-gray-400 mt-0.5">Your overall national support moved by this much because the campaigned region has a share of total population.</div>
                  </div>
                  <div class="text-sm text-gray-500">
                    💰 Cost: {{ formatCurrency(announcementData.yourAction.cost) }}
                  </div>
                </div>

                <!-- Fundraising -->
                <div v-if="announcementData.yourAction.type === 'fundraising'" class="mt-2 pt-2 border-t border-gray-100">
                  <div class="text-sm font-bold text-green-600">
                    +{{ formatCurrency(announcementData.yourAction.budgetGain) }}
                  </div>
                </div>

                <!-- Skill -->
                <div v-if="announcementData.yourAction.type === 'skill'" class="mt-2 pt-2 border-t border-gray-100">
                  <div class="text-sm text-purple-600 font-semibold">
                    Active for {{ announcementData.yourAction.duration }} turns
                  </div>
                </div>

              </div>
            </div>

            <!-- Passive Shift (collapsed by default if there's other content) -->
            <details v-if="announcementData.passiveShift?.changes?.length > 0" class="bg-gray-50 rounded-xl border border-gray-200">
              <summary class="p-3 cursor-pointer flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span class="font-semibold text-sm text-gray-700">Demographic Shift</span>
                </div>
                <span class="text-sm font-bold" :class="announcementData.passiveShift.global_change >= 0 ? 'text-green-600' : 'text-red-600'">
                  {{ announcementData.passiveShift.global_change >= 0 ? '+' : '' }}{{ (announcementData.passiveShift.global_change * 100).toFixed(2) }}%
                </span>
              </summary>
              <div class="px-3 pb-3 space-y-1 max-h-40 overflow-y-auto">
                <p class="text-xs text-gray-500 mb-2">Small changes in every region from demographic drift (not from your campaign).</p>
                <div v-for="change in announcementData.passiveShift.changes" :key="change.region_id" 
                     class="flex justify-between text-xs bg-white rounded px-2 py-1">
                  <span class="text-gray-600">{{ change.region_name }}</span>
                  <span :class="change.change >= 0 ? 'text-green-600' : 'text-red-600'" class="font-semibold">
                    {{ change.change >= 0 ? '+' : '' }}{{ (change.change * 100).toFixed(2) }}%
                  </span>
                </div>
              </div>
            </details>

            <!-- AI Actions -->
            <details v-if="announcementData.otherPlayers?.length > 0" class="bg-gray-50 rounded-xl border border-gray-200">
              <summary class="p-3 cursor-pointer flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                  <span class="font-semibold text-sm text-gray-700">Opponent Actions</span>
                </div>
                <span class="text-xs text-gray-500">{{ announcementData.otherPlayers.length }} actions</span>
              </summary>
              <div class="px-3 pb-3 space-y-2">
                <div v-for="(playerAction, idx) in announcementData.otherPlayers" :key="idx" 
                     class="bg-white rounded-lg p-2 border border-gray-200 text-sm">
                  <div class="font-semibold text-gray-800">{{ playerAction.playerName }}</div>
                  <div class="text-xs text-gray-500">{{ playerAction.actionName }}
                    <span v-if="playerAction.regionName"> • {{ playerAction.regionName }}</span>
                  </div>
                </div>
              </div>
            </details>
          </div>
          
          <!-- Footer -->
          <div class="p-4 border-t border-gray-200 bg-gray-50">
            <button
              @click="showAnnouncementModal = false"
              class="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Continue Campaign
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Election Results Modal -->
    <ElectionResults
      :show="showElectionResults"
      :election="electionData"
      @close="showElectionResults = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useGameStore } from '../stores/game';
import { useSocket } from '../composables/useSocket';
import ElectionResults from '../components/ElectionResults.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const gameStore = useGameStore();
const { joinGame, leaveGame, on, off, isConnected } = useSocket();

const gameId = route.params.id;
const { gameState, availableActions } = storeToRefs(gameStore);

// Socket notification state
const socketNotification = ref(null);

// Timer state
const remainingTime = ref(0);
const totalTime = ref(120);
const selectedRegions = ref([]); // Multi-select for local campaigns
const hoveredRegion = ref(null);
const message = ref('');
const messageType = ref('success');
const tooltipStyle = ref({ top: '0px', left: '0px' });
const svgContainer = ref(null);
const showActionsModal = ref(false);
const selectedActionType = ref(null);
const showAnnouncementModal = ref(false);
const showRegionInfoModal = ref(false);
const showCalendarModal = ref(false);
const showBudgetModal = ref(false);
const selectedMapCandidate = ref(null); // null means show current player
const regionInfoData = ref(null);
const announcementData = ref({});
const showRegionPopup = ref(false);
const regionPopupData = ref(null);
const popupPosition = ref(null);
const mapZoom = ref(1.0);
const hoveredRegionData = ref(null);
const showElectionResults = ref(false);
const electionData = ref({ results: [], total_voters: 0, voter_turnout: 0 });

// Turn summary modal
const showTurnSummary = ref(false);
const turnSummaryData = ref({
  turn: 0,
  regions: [],
  candidates: [],
  currentRegionIndex: 0,
  currentRegion: null,
  isAnimating: false,
  fadeState: 'visible', // 'visible', 'fading-out'
  phase: 'name', // 'name' = show region name only, 'results' = show bars + map
  actionsByPlayer: null // snapshot from turn-summary API when modal opened (player_id -> { actions, regionActions, ... })
});
const turnActionsData = ref({}); // fallback / legacy
const turnSummaryMapContainer = ref(null);
let turnSummaryMapLoaded = false;
let turnSummaryMapSvg = null; // Store the SVG element
// Store previous regional support to detect changes (current player only, for legacy)
let previousRegionalSupport = null;
// Store all players' regional support before turn ends so turn summary can show AI/other changes
let previousAllPlayersRegionalSupport = null;
// When true, don't update map colors until turn summary is dismissed
const suppressMapUpdate = ref(false);
// Map uses these - only updated when !suppressMapUpdate (prevents partial-turn coloring)
const mapDisplayRegionalSupport = ref([]);
const mapDisplayAllPlayersRegionalSupport = ref([]);
const waitingForSummaryAck = ref(false);
// Animated number values for turn summary
const animatedNumbers = ref({});
let numberAnimationFrame = null;

const campaignActions = computed(() => {
  const campaigns = availableActions.value.filter(a => a.type === 'campaign');
  console.log('All campaign actions:', campaigns.map(a => ({ name: a.name, rules: a.rules })));
  return campaigns;
});

const globalCampaignActions = computed(() => {
  if (!campaignActions.value || campaignActions.value.length === 0) {
    console.log('No campaign actions available');
    return [];
  }
  
  console.log('Filtering global campaigns from:', campaignActions.value.length, 'campaigns');
  
  const global = campaignActions.value.filter(a => {
    // Handle both string and object rules
    let rules = a.rules;
    
    console.log(`Checking action: ${a.name}`, {
      hasRules: !!rules,
      rulesType: typeof rules,
      rulesValue: rules
    });
    
    if (!rules) {
      console.warn(`Action ${a.name} has no rules`);
      return false;
    }
    
    if (typeof rules === 'string') {
      try {
        rules = JSON.parse(rules);
      } catch (e) {
        console.error('Error parsing rules for action:', a.name, e);
        return false;
      }
    }
    
    // Check for global scope - also check if it's explicitly not local
    const isGlobal = rules?.scope === 'global' || 
                     (a.name === 'TV' || a.name === 'Social Media' || a.name === 'Radio');
    
    console.log(`Action ${a.name}: scope=${rules?.scope}, isGlobal=${isGlobal}`);
    
    if (isGlobal) {
      console.log(`✓ Found global campaign: ${a.name}`, rules);
    }
    return isGlobal;
  });
  
  console.log(`Global campaigns found: ${global.length}`, global.map(a => a.name));
  return global;
});

const localCampaignActions = computed(() => {
  if (!campaignActions.value || campaignActions.value.length === 0) {
    return [];
  }
  
  const local = campaignActions.value.filter(a => {
    // Handle both string and object rules
    let rules = a.rules;
    if (typeof rules === 'string') {
      try {
        rules = JSON.parse(rules);
      } catch (e) {
        console.error('Error parsing rules for action:', a.name, e);
        rules = {};
      }
    }
    
    // Explicitly exclude global campaigns by name as well
    const isLocal = rules?.scope !== 'global' && 
                    a.name !== 'TV' && 
                    a.name !== 'Social Media' && 
                    a.name !== 'Radio';
    
    return isLocal;
  });
  console.log('Local campaigns:', local.map(a => a.name));
  return local;
});

const fundraisingActions = computed(() => {
  return availableActions.value.filter(a => a.type === 'fundraising');
});

const skillActions = computed(() => {
  return availableActions.value.filter(a => a.type === 'skill');
});

const needsRegion = computed(() => {
  return localCampaignActions.value.length > 0;
});

// Any selected region at 100%? (no campaign allowed there)
const hasAnySelectedRegionFull = computed(() => {
  if (!selectedRegions.value?.length || !gameState.value?.all_players_regional_support) return false;
  const supportByRegion = {};
  gameState.value.all_players_regional_support.forEach(r => {
    const rid = r.region_id;
    if (!supportByRegion[rid]) supportByRegion[rid] = 0;
    supportByRegion[rid] += parseFloat(r.support_percentage) || 0;
  });
  return selectedRegions.value.some(rid => (supportByRegion[rid] || 0) >= 0.9999);
});

// Cap displayed turn at max_turns to avoid "31/30" when game completes
const displayCurrentTurn = computed(() => {
  const g = gameState.value?.game;
  if (!g) return 1;
  return Math.min(g.current_turn || 1, g.max_turns || 30);
});

onMounted(async () => {
  suppressMapUpdate.value = false;
  waitingForSummaryAck.value = !!history.state?.waitingForSummaryAck;
  await loadGameState();
  if (gameState.value?.game?.status === 'waiting') {
    router.replace(`/game/${gameId}/lobby`);
    return;
  }
  await loadActions();
  // Load SVG map after game state is loaded - use nextTick to ensure DOM is ready
  await new Promise(resolve => setTimeout(resolve, 100));
  await loadSvgMap();
  
  // Set initial timer values from game state
  if (gameState.value?.game?.remaining_time) {
    remainingTime.value = gameState.value.game.remaining_time;
  }
  if (gameState.value?.game?.turn_duration) {
    totalTime.value = gameState.value.game.turn_duration;
  }
  
  // Check if game is completed and load election results
  if (gameState.value?.game?.status === 'completed') {
    await loadElectionResults();
  }

  // Join socket room for real-time updates
  joinGame(gameId);
  
  // Set up socket event listeners
  setupSocketListeners();
});

onUnmounted(() => {
  // Leave socket room when leaving the game
  leaveGame(gameId);
});

// Socket event handlers
function setupSocketListeners() {
  // Player joined the game
  on('player_joined', async (data) => {
    console.log('[SOCKET] Player joined:', data);
    showSocketNotification(`${data.candidateName} joined the game!`, 'info');
    
    // Refresh game state to see new player
    await loadGameState();
  });

  // Game started (all players joined)
  on('game_started', async (data) => {
    console.log('[SOCKET] Game started:', data);
    showSocketNotification('All players ready! Game is starting!', 'success');
    
    // Set timer duration
    if (data.turnDuration) {
      totalTime.value = data.turnDuration;
      remainingTime.value = data.turnDuration;
    }
    
    // Refresh game state
    await loadGameState();
    await loadActions();
  });

  // Timer sync - update countdown
  on('timer_sync', (data) => {
    remainingTime.value = data.remaining;
    totalTime.value = data.total;
  });

  // Timer expired
  on('timer_expired', async (data) => {
    console.log('[SOCKET] Timer expired:', data);
    showSocketNotification('Time is up! Moving to next day...', 'info');
    remainingTime.value = 0;
  });

  // Turn started (new turn with timer)
  on('turn_started', (data) => {
    console.log('[SOCKET] Turn started:', data);
    totalTime.value = data.duration;
    remainingTime.value = data.duration;
  });

  // Another player completed their turn - don't update map until turn fully ends
  on('player_turn_completed', async (data) => {
    console.log('[SOCKET] Player turn completed:', data);
    
    if (data.playerId !== gameState.value?.player?.id) {
      showSocketNotification(
        `${data.candidateName} finished (${data.playersCompleted}/${data.totalPlayers})`, 
        'info'
      );
    }
    
    suppressMapUpdate.value = true; // Keep map at previous turn until everyone finishes
    await loadGameState();
  });

  // Turn complete, go to summary (single/AI: turn already advanced; multiplayer: will advance when both ack)
  on('turn_complete_pending_summary', async (data) => {
    console.log('[SOCKET] Turn complete, pending summary:', data);
    showActionsModal.value = false;
    if (!previousAllPlayersRegionalSupport) {
      previousRegionalSupport = gameState.value?.regional_support
        ? JSON.parse(JSON.stringify(gameState.value.regional_support))
        : null;
      previousAllPlayersRegionalSupport = gameState.value?.all_players_regional_support?.length
        ? JSON.parse(JSON.stringify(gameState.value.all_players_regional_support))
        : null;
    }
    const completedTurn = data.completedTurn ?? (data.newTurn ? data.newTurn - 1 : 1);
    router.push({
      name: 'TurnSummary',
      params: { id: gameId, turnNumber: String(completedTurn) },
      state: {
        previousRegionalSupport: previousRegionalSupport || null,
        previousAllPlayersRegionalSupport: previousAllPlayersRegionalSupport || null,
        turnSummary: data.turnSummary || null
      }
    });
  });

  // Turn ended (single/AI: immediate navigate; multiplayer after both acked: just refresh if we were waiting)
  on('turn_ended', async (data) => {
    console.log('[SOCKET] Turn ended:', data);
    showActionsModal.value = false;
    waitingForSummaryAck.value = false;
    await loadGameState();
    await loadActions();
    if (history.state?.waitingForSummaryAck) {
      return; // We were waiting, other player acked - just refreshed, no navigation
    }
    const completedTurn = data.newTurn - 1;
    if (!previousAllPlayersRegionalSupport) {
      previousRegionalSupport = gameState.value?.regional_support
        ? JSON.parse(JSON.stringify(gameState.value.regional_support))
        : null;
      previousAllPlayersRegionalSupport = gameState.value?.all_players_regional_support?.length
        ? JSON.parse(JSON.stringify(gameState.value.all_players_regional_support))
        : null;
    }
    router.push({
      name: 'TurnSummary',
      params: { id: gameId, turnNumber: String(completedTurn) },
      state: {
        previousRegionalSupport: previousRegionalSupport || null,
        previousAllPlayersRegionalSupport: previousAllPlayersRegionalSupport || null,
        turnSummary: data.turnSummary || null
      }
    });
  });

  // Game completed
  on('game_complete', async (data) => {
    console.log('[SOCKET] Game complete:', data);
    showSocketNotification('Campaign is over! Election Day has arrived!', 'success');
    remainingTime.value = 0;
    
    // Refresh and show election results
    await loadGameState();
    await loadElectionResults();
  });

  // Player connected/disconnected
  on('player_connected', (data) => {
    console.log('[SOCKET] Player connected:', data);
  });

  on('player_disconnected', (data) => {
    console.log('[SOCKET] Player disconnected:', data);
  });

  // Game was deleted (e.g. by host) - redirect to games list
  on('game_deleted', (data) => {
    if (data?.gameId && parseInt(data.gameId, 10) === parseInt(gameId, 10)) {
      showSocketNotification('This game was deleted', 'error');
      router.push({ name: 'Games' });
    }
  });
}

function showSocketNotification(message, type = 'info') {
  socketNotification.value = { message, type };
  setTimeout(() => {
    socketNotification.value = null;
  }, 4000);
}

async function loadGameState() {
  await gameStore.fetchGameState(gameId);
}

async function loadActions() {
  const result = await gameStore.fetchAvailableActions(gameId);
  if (result.success) {
    console.log('Loaded actions:', availableActions.value);
    console.log('Campaign actions:', campaignActions.value);
    console.log('Global campaigns:', globalCampaignActions.value);
    console.log('Local campaigns:', localCampaignActions.value);
    // Debug: log rules for each campaign action
    campaignActions.value.forEach(action => {
      console.log(`Action: ${action.name}, Rules:`, action.rules, 'Scope:', action.rules?.scope);
    });
  }
}

function selectRegion(regionId) {
  const idx = selectedRegions.value.indexOf(regionId);
  if (idx >= 0) {
    selectedRegions.value = selectedRegions.value.filter(id => id !== regionId);
  } else {
    selectedRegions.value = [...selectedRegions.value, regionId];
  }
}

function isActionUsed(actionId) {
  return gameState.value?.used_action_ids?.includes(actionId) || false;
}

async function executeAction(action, actionType) {
  // Parse rules if needed
  let rules = action.rules;
  if (typeof rules === 'string') {
    try {
      rules = JSON.parse(rules);
    } catch (e) {
      console.error('Error parsing rules in executeAction:', e);
      rules = {};
    }
  }
  
  // Check if it's a global campaign (by scope or by name)
  const isGlobalCampaign = actionType === 'campaign' && (
    rules?.scope === 'global' || 
    action.name === 'TV' || 
    action.name === 'Social Media' || 
    action.name === 'Radio'
  );
  
  const isLocalCampaign = actionType === 'campaign' && !isGlobalCampaign;
  
  // Only require region for local campaigns
  if (isLocalCampaign && !selectedRegions.value?.length) {
    showMessage('Please select at least one region first', 'error');
    return;
  }
  
  console.log('Executing action:', {
    name: action.name,
    type: actionType,
    isGlobalCampaign,
    isLocalCampaign,
    requiresRegion: isLocalCampaign
  });

  try {
    const actionData = {
      action_id: action.id
    };

    if (actionType === 'campaign' && !isGlobalCampaign) {
      actionData.region_ids = selectedRegions.value;
    }

    // Show loading state
    showMessage('Executing action...', 'success');
    
    const executedRegionIds = (actionType === 'campaign' && !isGlobalCampaign) ? [...selectedRegions.value] : null;
    
    // IMPORTANT: Save previous support BEFORE taking action so we can show AI changes in turn summary
    // This must happen before the API call, not in the socket handler, to avoid race conditions
    previousRegionalSupport = gameState.value?.regional_support 
      ? JSON.parse(JSON.stringify(gameState.value.regional_support))
      : null;
    previousAllPlayersRegionalSupport = gameState.value?.all_players_regional_support?.length
      ? JSON.parse(JSON.stringify(gameState.value.all_players_regional_support))
      : null;
    
    // Multiplayer: don't color map until both players finish - suppress map update until turn ends
    suppressMapUpdate.value = true;
    
    const result = await gameStore.takeTurn(gameId, actionData);

    if (result.success) {
      selectedRegions.value = [];
      
      // Immediately update national support if provided in response
      if (result.result.national_support !== undefined && gameState.value?.player) {
        gameState.value.player.national_support = result.result.national_support;
        console.log('Updated national support from response:', result.result.national_support);
      }
      
      setTimeout(async () => {
        if (result.result.turn_ended) {
          await loadGameState();
          await loadActions();
        }
        
        // Prepare announcement data
        const actionResult = result.result.action_result || {};
        const executedAction = availableActions.value.find(a => a.id === action.id);
        const actionName = executedAction?.name || action.name || 'Unknown Action';
        
        // Get your action details
        // For local campaigns, calculate the actual support change from old/new values
        let localSupportGain = actionResult.supportGain || 0;
        if (!actionResult.global && actionResult.oldSupport !== undefined && actionResult.newSupport !== undefined) {
          localSupportGain = actionResult.newSupport - actionResult.oldSupport;
        }
        
        const yourAction = {
          actionName: actionName,
          type: action.type,
          cost: actionResult.cost || 0,
          supportGain: localSupportGain,
          oldSupport: actionResult.oldSupport,
          newSupport: actionResult.newSupport,
          global: actionResult.global,
          budgetGain: actionResult.budgetGain,
          duration: actionResult.skillActivated ? 3 : undefined,
          regionName: null
        };
        
        // Get region name(s) if applicable
        if (executedRegionIds?.length) {
          yourAction.regionName = actionResult.regions?.map(r => r.region_name).join(', ') ||
            executedRegionIds.map(rid => gameState.value?.regional_support?.find(r => r.region_id === rid)?.region_name).filter(Boolean).join(', ');
        } else if (actionResult.global && actionResult.regions && actionResult.regions.length > 0) {
          // For global campaigns, show all regions
          yourAction.regionName = 'All Regions';
        }
        
        // Get other players' actions
        const otherPlayers = [];
        if (result.result.ai_moves && result.result.ai_moves.length > 0) {
          for (const aiMove of result.result.ai_moves) {
            // Get player name from gameState
            const player = gameState.value?.players?.find(p => p.id === aiMove.playerId);
            const playerName = player?.candidate_name || `AI Player ${aiMove.playerId}`;
            
            // Get action name from result
            let aiActionName = 'Unknown Action';
            let aiRegionName = null;
            let aiSupportGain = null;
            let aiBudgetGain = null;
            
            if (aiMove.result) {
              // Try to infer action type from result
              if (aiMove.result.supportGain !== undefined) {
                if (aiMove.result.global) {
                  aiActionName = 'Global Campaign';
                  aiSupportGain = aiMove.result.supportGain;
                  aiRegionName = 'All Regions';
                } else {
                  aiActionName = 'Local Campaign';
                  aiSupportGain = aiMove.result.supportGain;
                  if (aiMove.result.regions && aiMove.result.regions.length > 0) {
                    aiRegionName = aiMove.result.regions[0].region_name;
                  }
                }
              } else if (aiMove.result.budgetGain !== undefined) {
                aiActionName = 'Fundraising';
                aiBudgetGain = aiMove.result.budgetGain;
              } else if (aiMove.result.skillActivated) {
                aiActionName = 'Skill';
              }
            }
            
            otherPlayers.push({
              playerName: playerName,
              actionName: aiActionName,
              regionName: aiRegionName,
              supportGain: aiSupportGain,
              budgetGain: aiBudgetGain
            });
          }
        }
        
        // Get passive shift data from result
        const passiveShift = result.result.passive_shift || { changes: [], global_change: 0 };
        const totalNationalChange = result.result.total_national_change || 0;
        const actionNationalChange = result.result.action_national_change || 0;
        const nationalSupportBefore = result.result.national_support_before || 0;
        const nationalSupportAfter = result.result.national_support || 0;
        
        console.log('Passive shift data:', passiveShift);
        console.log('Total national change:', totalNationalChange);
        console.log('Action national change:', actionNationalChange);
        
        if (!result.result.turn_ended) {
          showMessage('Action complete! Waiting for other players...', 'success');
        } else {
          suppressMapUpdate.value = false;
        }
        
        if (result.result.game_complete) {
          setTimeout(() => {
            showMessage('Game completed!', 'success');
          }, 2000);
        }
      }, 800); // Increased delay to ensure backend updates complete
    } else {
      showMessage(result.error || 'Failed to execute action', 'error');
    }
  } catch (error) {
    console.error('Execute action error:', error);
    showMessage('An error occurred', 'error');
  }
}

function showMessage(msg, type = 'success') {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 3000);
}

function copyGameCode() {
  if (gameState.value?.game?.join_code) {
    navigator.clipboard.writeText(gameState.value.game.join_code);
    showMessage('Game code copied!', 'success');
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Turn Summary Modal Functions

// Get the action a candidate performed for the current region being shown
function getTurnActionForCandidate(candidateId) {
  // Use snapshot stored when modal opened so we always have the right data
  const map = turnSummaryData.value.actionsByPlayer ?? turnActionsData.value;
  if (!map || typeof map !== 'object') return null;
  const playerData = map[candidateId] ?? map[Number(candidateId)] ?? map[String(candidateId)];
  if (!playerData) return null;

  const actions = playerData.actions || [];
  const regionActions = playerData.regionActions || {};

  // If showing a specific region, get the action for that region (try number and string key)
  if (turnSummaryData.value.isAnimating && turnSummaryData.value.currentRegion) {
    const regionId = turnSummaryData.value.currentRegion.id;
    const act = regionActions[regionId] ?? regionActions[Number(regionId)] ?? regionActions[String(regionId)];
    if (act) return act;
  }

  // If showing final results, return the first/primary action (or first region action as fallback)
  if (actions.length > 0) return actions[0];
  const firstRegion = Object.values(regionActions)[0];
  return firstRegion ?? null;
}

async function fetchTurnActions(gameId, turnNumber) {
  const buildMap = (players) => {
    const actionsMap = {};
    for (const player of players) {
      const pid = player.player_id;
      const entry = {
        actions: player.actions || [],
        regionActions: player.regionActions || {},
        totalSpent: player.totalSpent ?? 0,
        totalEarned: player.totalEarned ?? 0
      };
      actionsMap[pid] = entry;
      actionsMap[Number(pid)] = entry;
      actionsMap[String(pid)] = entry;
    }
    return actionsMap;
  };
  try {
    let response = await axios.get(`${API_URL}/games/${gameId}/turn-summary/${turnNumber}`);
    let data = response.data;
    let players = data.players || [];
    const hasAnyActions = players.some(p => (p.actions && p.actions.length > 0) || (p.regionActions && Object.keys(p.regionActions).length > 0));
    // If no actions for this turn, try previous turn (off-by-one with "completed" turn)
    if ((players.length === 0 || !hasAnyActions) && turnNumber > 1) {
      response = await axios.get(`${API_URL}/games/${gameId}/turn-summary/${turnNumber - 1}`);
      data = response.data;
      players = data.players || [];
    }
    const actionsMap = buildMap(players);
    turnActionsData.value = actionsMap;
  } catch (error) {
    console.error('Failed to fetch turn actions:', error);
    turnActionsData.value = {};
  }
}

async function showTurnSummaryModal(turnNumber, actionsByPlayerFromSocket = null) {
  if (!gameState.value?.regional_support || !gameState.value?.all_players) return;
  if (actionsByPlayerFromSocket) {
    turnActionsData.value = actionsByPlayerFromSocket;
  } else {
    const gid = gameId ?? gameState.value?.game?.id;
    if (!gid) return;
    await fetchTurnActions(gid, turnNumber);
  }
  
  // Build candidates data
  const candidates = gameState.value.all_players.map(p => ({
    id: p.id,
    name: p.candidate_name,
    ethnicity: p.ethnicity,
    national_support: p.national_support,
    change: 0
  }));
  
  // Build regions data with candidate support (before and after)
  const allRegionalSupport = gameState.value.all_players_regional_support || [];
  
  const allRegions = gameState.value.regional_support.map(r => {
    // Build candidates with before/after support (all players, including AI)
    const regionCandidates = candidates.map(c => {
      const regionSupport = allRegionalSupport.find(
        rs => rs.player_id == c.id && rs.region_id == r.region_id
      );
      const currentSupport = regionSupport ? regionSupport.support_percentage : (c.national_support || 0.15);
      // Before support: use saved snapshot for all players so AI/other changes animate too
      const prevForPlayer = previousAllPlayersRegionalSupport?.find(
        rs => rs.player_id == c.id && rs.region_id == r.region_id
      );
      const supportBefore = prevForPlayer != null
        ? prevForPlayer.support_percentage
        : currentSupport;
      return { 
        id: c.id, 
        name: c.name, 
        supportBefore: supportBefore,
        support: currentSupport,
        changed: Math.abs(currentSupport - supportBefore) > 0.001
      };
    });
    regionCandidates.sort((a, b) => b.support - a.support);
    
    // Check if any candidate's support changed in this region
    const hasChanges = regionCandidates.some(c => c.changed);
    
    return {
      id: r.region_id,
      name: r.region_name,
      regionCode: r.region_code,
      population: r.population,
      leaderId: regionCandidates[0]?.id,
      candidates: regionCandidates,
      hasChanges: hasChanges
    };
  });
  
  // Filter to only regions with changes (if we have previous data), fallback to all regions
  const regionsWithChanges = previousAllPlayersRegionalSupport?.length || previousRegionalSupport
    ? allRegions.filter(r => r.hasChanges) 
    : allRegions;
  // Always show modal when turn ends - use changed regions if any, otherwise show all (e.g. first turn)
  const regions = regionsWithChanges.length > 0 ? regionsWithChanges : allRegions;
  
  turnSummaryData.value = {
    turn: turnNumber,
    regions: regions,
    allRegions: allRegions,
    candidates: candidates,
    currentRegionIndex: 0,
    currentRegion: regions[0],
    isAnimating: true,
    fadeState: 'visible',
    phase: 'results',
    actionsByPlayer: actionsByPlayerFromSocket ?? turnActionsData.value
  };

  // Reset map loaded flag to force reload
  turnSummaryMapLoaded = false;

  showTurnSummary.value = true;
  
  // Wait for DOM to update, load map first, then start animation
  await nextTick();
  
  // Load map before starting animation
  setTimeout(async () => {
    await loadTurnSummaryMap();
    // Small delay after map loads to ensure it's rendered
    setTimeout(() => {
      animateTurnSummary();
    }, 100);
  }, 100);
  
  // Clear previous support after using it
  previousRegionalSupport = null;
  previousAllPlayersRegionalSupport = null;
}

async function loadTurnSummaryMap() {
  if (!turnSummaryMapContainer.value) return;
  
  try {
    let svgText = null;
    let loaded = false;
    
    // Try multiple paths (bihmap.svg)
    const paths = ['/bihmap.svg', '/src/views/SVG/bihmap.svg', './SVG/bihmap.svg'];
    
    for (const path of paths) {
      if (loaded) break;
      try {
        const response = await fetch(path);
        if (response.ok) {
          svgText = await response.text();
          loaded = true;
          console.log('Turn summary map loaded from:', path);
        }
      } catch (e) {
        console.log('Failed to load from', path);
      }
    }
    
    // If still not loaded, try importing the module
    if (!loaded) {
      try {
        const module = await import('./SVG/bihmap.svg?raw');
        svgText = module.default;
        loaded = true;
        console.log('Turn summary map loaded via import');
      } catch (e) {
        console.log('Import failed:', e);
      }
    }
    
    if (!svgText) {
      console.error('Could not load SVG for turn summary');
      turnSummaryMapContainer.value.innerHTML = '<div class="text-slate-400 text-center">Map loading...</div>';
      return;
    }
    
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    // Set SVG size
    svgElement.setAttribute('width', '100%');
    svgElement.setAttribute('height', '100%');
    svgElement.style.maxWidth = '450px';
    svgElement.style.maxHeight = '380px';
    
    // Result map: black, very thin border for all regions always (no zoom)
    const allPaths = svgElement.querySelectorAll('path');
    allPaths.forEach(path => {
      path.style.fill = '#e2e8f0';
      path.style.stroke = '#000';
      path.style.strokeWidth = '0.5px';
      path.style.transition = 'fill 0.5s ease, opacity 0.5s ease';
    });
    
    turnSummaryMapContainer.value.innerHTML = '';
    turnSummaryMapContainer.value.appendChild(svgElement);
    turnSummaryMapSvg = svgElement; // Store reference
    turnSummaryMapLoaded = true;
    
    // Highlight first region
    updateTurnSummaryMapHighlight();
  } catch (error) {
    console.error('Error loading turn summary map:', error);
    turnSummaryMapContainer.value.innerHTML = '<div class="text-slate-400 text-center">Map unavailable</div>';
  }
}

function updateTurnSummaryMapHighlight() {
  // Use stored SVG reference, or try to find it in container
  let svg = turnSummaryMapSvg;
  if (!svg && turnSummaryMapContainer.value) {
    svg = turnSummaryMapContainer.value.querySelector('svg');
  }
  if (!svg) {
    console.log('Turn summary: No SVG found for highlighting');
    return;
  }
  
  // Make sure SVG is in the container
  if (turnSummaryMapContainer.value && !turnSummaryMapContainer.value.contains(svg)) {
    turnSummaryMapContainer.value.innerHTML = '';
    turnSummaryMapContainer.value.appendChild(svg);
  }
  
  const data = turnSummaryData.value;
  const allPaths = svg.querySelectorAll('path');
  
  // Region ID mapping - bihmap.svg path IDs (kebab-case) to database region names
  const SVG_PATH_ID_TO_REGION_NAME = {
    'una-sana-canton': 'Una-Sana Canton',
    'posavina-canton': 'Posavina Canton',
    'tuzla-canton': 'Tuzla Canton',
    'zenica-doboj-canton': 'Zenica-Doboj Canton',
    'bosnian-podrinje': 'Bosnian-Podrinje',
    'central-bosnia-canton': 'Central Bosnia Canton',
    'herzegovina-neretva-canton': 'Herzegovina-Neretva Canton',
    'west-herzegovina-canton': 'West Herzegovina Canton',
    'sarajevo-canton': 'Sarajevo Canton',
    'canton-10': 'Canton 10 (Herzeg-Bosnia)',
    'banja-luka': 'Banja Luka Core',
    'krajina-west': 'Krajina West',
    'doboj': 'Doboj',
    'bijeljina': 'Bijeljina',
    'podrinje': 'Podrinje',
    'romanija': 'Romanija',
    'eastern-herzegovina': 'Eastern Herzegovina',
    'brcko': 'Brcko District'
  };
  
  // Helper to find region from path (in data.regions or data.allRegions)
  const regionsList = data.allRegions || data.regions;
  const findRegionForPath = (pathId) => {
    const regionName = SVG_PATH_ID_TO_REGION_NAME[pathId];
    let region = regionsList.find(r => r.name === regionName);
    
    if (!region && pathId) {
      const normalize = (str) => str.toLowerCase()
        .replace(/[–—]/g, '-')
        .replace(/č/gi, 'c')
        .replace(/[^a-z0-9]/g, '');
      
      const normalizedPathId = normalize(pathId);
      region = regionsList.find(r => {
        const normalizedName = normalize(r.name);
        return normalizedName.includes(normalizedPathId) || normalizedPathId.includes(normalizedName);
      });
    }
    return region;
  };
  
  // Get index of region in the animation order (data.regions)
  const getRegionAnimationIndex = (region) => {
    if (!region || !data.regions) return -1;
    const idx = data.regions.findIndex(r => r.name === region.name || r.id === region.id);
    return idx;
  };
  
  // Get color for a region based on leader's support (intensity-based like main map)
  const getRegionLeaderColor = (region, useBefore = false) => {
    if (!region) return '#e2e8f0';
    const leader = region.candidates[0]; // Already sorted by support
    if (!leader) return '#e2e8f0';
    const colorScheme = playerColorMap.value[leader.id] || 'green';
    const support = useBefore ? (leader.supportBefore || leader.support) : leader.support;
    return getRegionColor(support, colorScheme);
  };
  
  // When animating: previous regions keep final color; current region animates from before→after; rest gray
  if (data.isAnimating && data.regions?.length) {
    const currentIdx = data.currentRegionIndex ?? 0;
    allPaths.forEach(path => {
      const pathId = path.getAttribute('id') || '';
      const region = findRegionForPath(pathId);
      const animIdx = getRegionAnimationIndex(region);
      
      path.style.stroke = '#000';
      path.style.strokeWidth = '0.5px';
      path.style.transition = 'fill 1.5s ease-out';
      
      if (animIdx < 0) {
        // Not in changed regions list: gray
        path.style.fill = '#e2e8f0';
      } else if (animIdx < currentIdx) {
        // Already shown: keep final (after) color
        path.style.fill = getRegionLeaderColor(region, false);
      } else if (animIdx === currentIdx && region) {
        // Current region: animate from before color to after color (in-place)
        const beforeColor = getRegionLeaderColor(region, true);
        const afterColor = getRegionLeaderColor(region, false);
        path.style.fill = beforeColor;
        setTimeout(() => {
          path.style.fill = afterColor;
        }, 50);
      } else {
        // Not yet shown: gray
        path.style.fill = '#e2e8f0';
      }
    });
  } else if (!data.isAnimating) {
    // Show ALL regions colored by leader when animation is done (use allRegions, not just changed ones)
    const regionsToUse = data.allRegions || data.regions;
    
    allPaths.forEach(path => {
      const pathId = path.getAttribute('id') || '';
      const regionName = SVG_PATH_ID_TO_REGION_NAME[pathId];
      
      // Find region in allRegions
      let region = regionsToUse.find(r => r.name === regionName);
      
      // Fuzzy matching fallback
      if (!region && pathId) {
        const normalize = (str) => str.toLowerCase()
          .replace(/[–—]/g, '-')
          .replace(/č/gi, 'c')
          .replace(/[^a-z0-9]/g, '');
        
        const normalizedPathId = normalize(pathId);
        region = regionsToUse.find(r => {
          const normalizedName = normalize(r.name);
          return normalizedName.includes(normalizedPathId) || normalizedPathId.includes(normalizedName);
        });
      }
      
      if (region) {
        path.style.transition = 'fill 0.5s ease-out';
        path.style.fill = getRegionLeaderColor(region);
        path.style.stroke = '#000';
        path.style.strokeWidth = '0.5px';
      }
    });
  }
}

function animateTurnSummary() {
  const data = turnSummaryData.value;
  
  // Check if animation is done
  if (!data.isAnimating || data.currentRegionIndex >= data.regions.length) {
    // Show final results
    data.phase = 'results';
    data.fadeState = 'visible';
    data.isAnimating = false;
    data.currentRegion = null;
    
    // Update map for final view (map already loaded at start)
    updateTurnSummaryMapHighlight();
    return;
  }
  
  // Set current region and fade in
  data.currentRegion = data.regions[data.currentRegionIndex];
  data.phase = 'results';
  data.fadeState = 'visible';
  
  // Animate numbers for current region (1.5s to match bars and map)
  if (data.currentRegion?.candidates) {
    animateNumbers(data.currentRegion.candidates, 1500);
  }
  
  // Just update the map highlighting (map is loaded at start)
  updateTurnSummaryMapHighlight();
  
  // Display results for 2.5 seconds (animations are 1.5s + buffer)
  setTimeout(() => {
    // Fade out
    data.fadeState = 'fading-out';
    
    setTimeout(() => {
      // Move to next region
      data.currentRegionIndex++;
      animateTurnSummary();
    }, 500); // Fade out duration
  }, 2500); // Display time
}

// Animate numbers from previous to current value
function animateNumbers(candidates, duration = 1000) {
  if (numberAnimationFrame) {
    cancelAnimationFrame(numberAnimationFrame);
  }
  
  // Initialize animated values to starting values
  const newAnimated = {};
  candidates.forEach(c => {
    const from = (c.supportBefore || 0) * 100;
    const to = (c.support !== undefined ? c.support : c.national_support) * 100;
    newAnimated[c.id] = { current: from, target: to };
  });
  animatedNumbers.value = newAnimated;
  
  const startTime = performance.now();
  
  function tick(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    
    const updated = {};
    candidates.forEach(c => {
      const from = (c.supportBefore || 0) * 100;
      const to = (c.support !== undefined ? c.support : c.national_support) * 100;
      updated[c.id] = { 
        current: from + (to - from) * eased, 
        target: to 
      };
    });
    animatedNumbers.value = updated;
    
    if (progress < 1) {
      numberAnimationFrame = requestAnimationFrame(tick);
    }
  }
  
  numberAnimationFrame = requestAnimationFrame(tick);
}

function getAnimatedNumber(candidateId) {
  const val = animatedNumbers.value[candidateId];
  if (val) {
    return val.current.toFixed(1);
  }
  return '0.0';
}

function closeTurnSummary() {
  if (numberAnimationFrame) {
    cancelAnimationFrame(numberAnimationFrame);
    numberAnimationFrame = null;
  }
  animatedNumbers.value = {};
  showTurnSummary.value = false;
  turnSummaryMapLoaded = false;
  turnSummaryMapSvg = null; // Clear SVG reference
  turnSummaryData.value = {
    turn: 0, regions: [], candidates: [],
    currentRegionIndex: 0, currentRegion: null, isAnimating: false,
    fadeState: 'visible', phase: 'results',
    actionsByPlayer: null
  };
}

function skipTurnSummaryAnimation() {
  turnSummaryData.value.isAnimating = false;
  turnSummaryData.value.currentRegion = null;
  turnSummaryData.value.currentRegionIndex = turnSummaryData.value.regions.length;
  turnSummaryData.value.fadeState = 'visible';
  turnSummaryData.value.phase = 'results';
  
  // Update map for final view (map already loaded at start)
  updateTurnSummaryMapHighlight();
}

function formatCurrency(amount) {
  // Format as number with commas, then add KM suffix
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount) + ' KM';
}

// Calendar helper functions
function getCalendarDayClass(day) {
  if (!gameState.value) return 'border-slate-200 bg-slate-50';
  
  const isCurrentTurn = day === displayCurrentTurn.value && gameState.value.game.status === 'active';
  const isPast = day < displayCurrentTurn.value;
  
  if (isCurrentTurn) {
    return 'border-blue-500 bg-blue-600 text-white shadow-lg';
  } else if (isPast) {
    return 'border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300';
  } else {
    return 'border-slate-200 bg-slate-50 opacity-60';
  }
}

function viewTurnDetails(day) {
  router.push({ name: 'TurnSummary', params: { id: gameId, turnNumber: String(day) } });
}

// Recent spending computed
const recentSpending = computed(() => {
  // This would come from game state in a real implementation
  // For now return empty array
  return [];
});

function formatCurrencyShort(amount) {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1) + 'M';
  } else if (amount >= 1000) {
    return Math.round(amount / 1000) + 'K';
  }
  return amount.toString();
}

function formatPopulation(pop) {
  if (pop >= 1000000) {
    return (pop / 1000000).toFixed(1) + 'M';
  } else if (pop >= 1000) {
    return Math.round(pop / 1000) + 'K';
  }
  return pop.toString();
}

function getPopulationWeight(region) {
  if (!gameState.value?.regional_support) return 0;
  const totalPop = gameState.value.regional_support.reduce((sum, r) => sum + r.population, 0);
  return ((region.population / totalPop) * 100).toFixed(1);
}

function getRankText() {
  if (!gameState.value?.all_players) return '';
  const sorted = [...gameState.value.all_players].sort((a, b) => b.national_support - a.national_support);
  const myRank = sorted.findIndex(p => !p.is_ai) + 1;
  if (myRank === 1) return '🥇 Leading';
  if (myRank === 2) return '🥈 2nd Place';
  if (myRank === 3) return '🥉 3rd Place';
  return `#${myRank} of ${sorted.length}`;
}

function getSelectedRegionsSummary() {
  if (!selectedRegions.value?.length || !gameState.value?.regional_support) return '';
  const names = selectedRegions.value
    .map(rid => gameState.value.regional_support.find(r => r.region_id === rid)?.region_name)
    .filter(Boolean);
  return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
}

// Action visual helpers
function getActionGradient(actionName) {
  const gradients = {
    'TV': 'bg-gradient-to-br from-blue-500 to-indigo-600',
    'Social Media': 'bg-gradient-to-br from-pink-500 to-rose-600',
    'Radio': 'bg-gradient-to-br from-purple-500 to-violet-600',
    'Billboards': 'bg-gradient-to-br from-cyan-500 to-teal-600',
    'Small Meeting': 'bg-gradient-to-br from-green-500 to-emerald-600',
    'Rally': 'bg-gradient-to-br from-orange-500 to-red-500',
    'Door to Door': 'bg-gradient-to-br from-amber-500 to-yellow-600',
    'Big Rally': 'bg-gradient-to-br from-red-500 to-pink-600',
    'Local Fundraiser': 'bg-gradient-to-br from-emerald-500 to-green-600',
    'Diaspora Gala': 'bg-gradient-to-br from-purple-500 to-indigo-600',
    'Corporate Donations': 'bg-gradient-to-br from-slate-600 to-gray-700',
    'Online Crowdfunding': 'bg-gradient-to-br from-blue-500 to-cyan-500',
  };
  return gradients[actionName] || 'bg-gradient-to-br from-gray-500 to-gray-600';
}

// Get emoji for action
function getActionEmoji(actionName) {
  const emojis = {
    'TV': '📺',
    'Social Media': '📱',
    'Radio': '📻',
    'Billboards': '🪧',
    'Small Meeting': '👥',
    'Rally': '📢',
    'Door to Door': '🚪',
    'Big Rally': '🎪',
    'Local Fundraiser': '🎉',
    'Diaspora Gala': '🌟',
    'Corporate Donations': '🏢',
    'Online Crowdfunding': '💻',
    'TV Media Bonus': '📺',
    'Door-to-Door Discount': '🚪',
    'Foreign Aid': '🌍',
    'National Rally Boost': '📢',
  };
  return emojis[actionName] || '🎯';
}

// Get star rating (1-5) for action effectiveness
function getActionStarRating(action) {
  // For campaigns - based on support gain percentage
  if (action.base_support_gain) {
    const gain = parseFloat(action.base_support_gain);
    if (gain >= 0.10) return 5;      // 10%+ = 5 stars (Big Rally)
    if (gain >= 0.065) return 4;     // 6.5%+ = 4 stars (Rally, Door to Door)
    if (gain >= 0.045) return 3;     // 4.5%+ = 3 stars (TV, Small Meeting)
    if (gain >= 0.035) return 2;     // 3.5%+ = 2 stars (Radio, Social Media, Billboards)
    return 1;
  }
  // For fundraising - based on budget gain
  if (action.base_budget_gain) {
    const gain = parseFloat(action.base_budget_gain);
    if (gain >= 70000) return 5;     // 70K+ = 5 stars (Diaspora Gala)
    if (gain >= 45000) return 4;     // 45K+ = 4 stars (Corporate Donations)
    if (gain >= 30000) return 3;     // 30K+ = 3 stars (Local Fundraiser)
    if (gain >= 20000) return 2;     // 20K+ = 2 stars (Online Crowdfunding)
    return 1;
  }
  return 3; // Default
}

function getSkillGradient(skillName) {
  const gradients = {
    'TV Media Bonus': 'bg-gradient-to-br from-blue-600 to-indigo-700',
    'Door-to-Door Discount': 'bg-gradient-to-br from-amber-500 to-orange-600',
    'Foreign Aid': 'bg-gradient-to-br from-emerald-500 to-teal-600',
  };
  return gradients[skillName] || 'bg-gradient-to-br from-purple-500 to-purple-700';
}

function getEthnicityTextClass(ethnicity) {
  switch (ethnicity) {
    case 'Bosniak': return 'text-green-600 font-medium';
    case 'Serb': return 'text-blue-600 font-medium';
    case 'Croat': return 'text-red-600 font-medium';
    default: return 'text-gray-600 font-medium';
  }
}

function getIdeologyTextClass(ideology) {
  switch (ideology) {
    case 'Conservative': return 'text-purple-600';
    case 'Liberal': return 'text-yellow-600';
    case 'Socialist': return 'text-rose-600';
    default: return 'text-gray-600';
  }
}

// When game is completed we have election results – use vote_percentage so main screen matches final results screen
const useElectionPercentages = computed(() => 
  gameState.value?.game?.status === 'completed' && electionData.value?.results?.length > 0
);

const sortedPlayers = computed(() => {
  if (!gameState.value?.all_players) return [];
  const list = [...gameState.value.all_players].map(p => ({
    ...p,
    is_current_player: p.id === gameState.value?.player?.id
  }));
  if (useElectionPercentages.value && electionData.value?.results?.length) {
    const byId = Object.fromEntries(
      (electionData.value.results || []).map(r => [r.player_id, r.vote_percentage])
    );
    return list.sort((a, b) => (byId[b.id] ?? 0) - (byId[a.id] ?? 0));
  }
  return list.sort((a, b) => b.national_support - a.national_support);
});

function getPlayerDisplayPercentage(player) {
  if (useElectionPercentages.value && electionData.value?.results?.length) {
    const result = electionData.value.results.find(r => r.player_id === player.id);
    return result ? result.vote_percentage : (player.national_support || 0) * 100;
  }
  return (player.national_support || 0) * 100;
}

// Turn summary final screen: candidates sorted like leaders (by current global %)
const turnSummaryFinalCandidates = computed(() => {
  const candidates = turnSummaryData.value?.candidates || [];
  if (candidates.length === 0) return [];
  if (useElectionPercentages.value && electionData.value?.results?.length) {
    const byId = Object.fromEntries(
      (electionData.value.results || []).map(r => [r.player_id, r.vote_percentage])
    );
    return [...candidates].sort((a, b) => (byId[b.id] ?? 0) - (byId[a.id] ?? 0));
  }
  return [...candidates].sort((a, b) => (b.national_support || 0) - (a.national_support || 0));
});

const sortedRegions = computed(() => {
  if (!gameState.value?.regional_support) return [];
  return [...gameState.value.regional_support].sort((a, b) => b.population - a.population);
});

// Color schemes for different candidates - light to vibrant progression (9 shades each)
const candidateColorSchemes = {
  green: ['#F9FBEF', '#E3EECA', '#C5DFA0', '#8BC550', '#6BBE45', '#40AB48', '#2C8943', '#1E6431', '#1A3819'],
  blue: ['#EFF3FB', '#CAD4EE', '#A0BBDF', '#5075C5', '#456BBE', '#4059AB', '#2C4D89', '#1E3264', '#191F38'],
  red: ['#FBEFEF', '#EECACA', '#DFA0A0', '#C55050', '#BE4545', '#AB4040', '#892C2C', '#641E1E', '#381919'],
  cyan: ['#EFF8FB', '#CAE6EE', '#A0D6DF', '#58BACB', '#2CA5BA', '#4082AB', '#2C7089', '#1E5764', '#193338'],
  purple: ['#FBEFF9', '#EECAEB', '#DFA0D6', '#D781CA', '#D463C3', '#AB3D9D', '#962587', '#7B106D', '#5E0A53'],
  water: ['#DFFFFD', '#C2F4F1', '#A0F6E4', '#77EDE3', '#52DACF', '#23B5AC', '#1EACA3', '#078E86', '#024440']
};

// Assign colors to players based on index
const playerColorMap = computed(() => {
  const colors = ['green', 'blue', 'red', 'cyan', 'purple', 'water'];
  const map = {};
  if (gameState.value?.all_players) {
    gameState.value.all_players.forEach((player, index) => {
      map[player.id] = colors[index % colors.length];
    });
  }
  // Ensure current player has a color even if not in all_players
  if (gameState.value?.player?.id && !map[gameState.value.player.id]) {
    map[gameState.value.player.id] = colors[0];
  }
  return map;
});

// Get the current color scheme based on selected candidate
const currentColorScheme = computed(() => {
  if (selectedMapCandidate.value && playerColorMap.value[selectedMapCandidate.value]) {
    return playerColorMap.value[selectedMapCandidate.value];
  }
  // Default to current player's color
  if (gameState.value?.player?.id && playerColorMap.value[gameState.value.player.id]) {
    return playerColorMap.value[gameState.value.player.id];
  }
  return 'green';
});

// SVG Map functions – gradient per support % (0–100)
// 0% = light gray; thresholds: 10, 20, 30, 40, 50, 60, 70, 75, 80 (last color above 80%)
const ZERO_SUPPORT_GRAY = '#e2e8f0';
function getRegionColor(supportPercentage, colorScheme = null) {
  const scheme = colorScheme || currentColorScheme.value;
  const colors = candidateColorSchemes[scheme] || candidateColorSchemes.green;
  let p = supportPercentage;
  if (p <= 1) p = p * 100;
  p = Math.max(0, Math.min(100, p));
  if (p === 0) return ZERO_SUPPORT_GRAY;
  if (p < 10) return colors[0];
  if (p < 20) return colors[1];
  if (p < 30) return colors[2];
  if (p < 40) return colors[3];
  if (p < 50) return colors[4];
  if (p < 60) return colors[5];
  if (p < 70) return colors[6];
  if (p < 75) return colors[7];
  return colors[8]; // 75%+ and above 80% – darkest
}

// Get primary color for a candidate
function getCandidatePrimaryColor(playerId) {
  const scheme = playerColorMap.value[playerId] || 'green';
  return candidateColorSchemes[scheme][5]; // Middle-dark color
}

// Get the leading candidate in a region (allPlayersSupport override for map display)
function getRegionLeader(region, allPlayersSupportOverride) {
  const allRegionalSupport = allPlayersSupportOverride ?? gameState.value?.all_players_regional_support ?? [];
  const candidates = [];
  if (gameState.value?.all_players) {
    gameState.value.all_players.forEach(p => {
      const regionSupport = allRegionalSupport.find(
        rs => rs.player_id == p.id && rs.region_id == region.region_id
      );
      candidates.push({
        id: p.id,
        support: regionSupport ? regionSupport.support_percentage : (p.national_support || 0.15)
      });
    });
  }
  candidates.sort((a, b) => b.support - a.support);
  return {
    leaderId: candidates[0]?.id || gameState.value?.player?.id,
    leaderSupport: candidates[0]?.support || 0.15
  };
}

function getSupportTextColor(supportPercentage) {
  const percentage = supportPercentage * 100;
  if (percentage < 20) return 'text-red-600';
  if (percentage < 40) return 'text-orange-600';
  if (percentage < 60) return 'text-green-600';
  if (percentage < 80) return 'text-blue-600';
  return 'text-blue-700';
}

async function loadSvgMap() {
  // Wait for container to be available
  if (!svgContainer.value) {
    console.log('Waiting for SVG container...');
    // Retry after a short delay
    setTimeout(() => {
      if (svgContainer.value) {
        loadSvgMap();
      }
    }, 100);
    return;
  }
  
  // Wait for game state with regional support
  const regionalSupport = effectiveMapRegionalSupport.value;
  if (!regionalSupport?.length) {
    console.log('Waiting for game state with regional support...');
    return;
  }
  
  console.log('Loading SVG map with', regionalSupport.length, 'regions');
  
  try {
    // Fetch SVG file - try multiple paths
    let svgText = '';
    // Try multiple methods to load SVG
    let loaded = false;
    
    // Method 1: Try Vite's ?raw import (most reliable) - bihmap.svg
    try {
      const svgModule = await import('./SVG/bihmap.svg?raw');
      svgText = svgModule.default;
      console.log('SVG loaded via ?raw import (bihmap.svg)');
      loaded = true;
    } catch (e1) {
      console.log('?raw import failed, trying fetch...', e1);
    }
    
    // Method 2: Try fetching from public folder
    if (!loaded) {
      try {
        const response = await fetch('/bihmap.svg');
        if (response.ok) {
          svgText = await response.text();
          console.log('SVG loaded via fetch from /bihmap.svg');
          loaded = true;
        }
      } catch (e2) {
        console.log('Public folder fetch failed, trying src path...', e2);
      }
    }
    
    // Method 3: Try fetching from src path
    if (!loaded) {
      try {
        const response = await fetch('/src/views/SVG/bihmap.svg');
        if (response.ok) {
          svgText = await response.text();
          console.log('SVG loaded via fetch from /src/views/SVG/bihmap.svg');
          loaded = true;
        }
      } catch (e3) {
        console.log('Src path fetch failed', e3);
      }
    }
    
    if (!loaded || !svgText) {
      console.error('Could not load SVG from any method');
      if (svgContainer.value) {
        svgContainer.value.innerHTML = '<div class="p-4 text-center text-navy-600">Map unavailable - SVG not found. Check console for details.</div>';
      }
      return;
    }
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;
    
    // bihmap.svg: path id (kebab-case) → game region name (DB regions table)
    const SVG_PATH_ID_TO_REGION_NAME = {
      'una-sana-canton': 'Una-Sana Canton',
      'posavina-canton': 'Posavina Canton',
      'tuzla-canton': 'Tuzla Canton',
      'zenica-doboj-canton': 'Zenica-Doboj Canton',
      'bosnian-podrinje': 'Bosnian-Podrinje',
      'central-bosnia-canton': 'Central Bosnia Canton',
      'herzegovina-neretva-canton': 'Herzegovina-Neretva Canton',
      'west-herzegovina-canton': 'West Herzegovina Canton',
      'sarajevo-canton': 'Sarajevo Canton',
      'canton-10': 'Canton 10 (Herzeg-Bosnia)',
      'banja-luka': 'Banja Luka Core',
      'krajina-west': 'Krajina West',
      'doboj': 'Doboj',
      'bijeljina': 'Bijeljina',
      'podrinje': 'Podrinje',
      'romanija': 'Romanija',
      'eastern-herzegovina': 'Eastern Herzegovina',
      'brcko': 'Brcko District'
    };
    
    const allPaths = svgElement.querySelectorAll('path');
    const regionByName = {};
    const allPlayersSupport = effectiveMapAllPlayersRegionalSupport.value;
    regionalSupport.forEach(r => {
      regionByName[r.region_name] = r;
    });
    
    let mappedCount = 0;
    allPaths.forEach(path => {
      const pathId = path.getAttribute('id') || '';
      const regionName = SVG_PATH_ID_TO_REGION_NAME[pathId];
      const region = regionName ? regionByName[regionName] : null;
      if (!region) return;
      
      // Use style.fill so it overrides .cls-1 { fill: #d6d6d6 } in the SVG
      const { leaderId, leaderSupport } = getRegionLeader(region, allPlayersSupport);
      const colorScheme = playerColorMap.value[leaderId] || 'green';
      const fillColor = getRegionColor(leaderSupport, colorScheme);
      path.style.fill = fillColor;
      
      // Debug first region only
      if (mappedCount === 0) {
        console.log(`Map coloring debug:`, {
          region: region.region_name,
          leaderId,
          leaderSupport: (leaderSupport * 100).toFixed(1) + '%',
          colorScheme,
          fillColor,
          allPlayers: gameState.value.all_players?.length,
          playerColorMap: Object.keys(playerColorMap.value).length
        });
      }
      path.removeAttribute('class');
      const isSelected = selectedRegions.value.includes(region.region_id);
      const baseStroke = isSelected ? 2.5 : 0.6;
      const scaledStroke = baseStroke / mapZoom.value;
      path.setAttribute('stroke', isSelected ? '#2563eb' : '#555');
      path.style.strokeWidth = `${scaledStroke}px`;
      path.style.opacity = isSelected ? '1' : '1';
      path.style.cursor = 'pointer';
      path.setAttribute('data-region-id', region.region_id);
      path.setAttribute('data-region-code', region.region_code || '');
      mappedCount++;
    });
    console.log(`Map: ${mappedCount} paths linked to regions (bihmap.svg)`);
    
    // Set SVG size - larger map
    svgElement.setAttribute('width', '520');
    svgElement.setAttribute('height', '500');
    svgElement.setAttribute('class', 'max-w-full max-h-full');
    svgElement.style.objectFit = 'contain';
    
    // Clear container and append SVG element directly (not as HTML string)
    if (svgContainer.value) {
      svgContainer.value.innerHTML = '';
      svgContainer.value.appendChild(svgElement);
      
      // Add event listeners after DOM insertion
      // Use requestAnimationFrame to ensure DOM is fully rendered
      requestAnimationFrame(() => {
        const pathsWithRegions = svgElement.querySelectorAll('path[data-region-id]');
        console.log(`Attaching event listeners to ${pathsWithRegions.length} paths`);
        
        pathsWithRegions.forEach(path => {
          const regionId = parseInt(path.getAttribute('data-region-id'));
          const regionCode = path.getAttribute('data-region-code');
          
          // Add click handler - just selects region
          path.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Region clicked:', regionId, regionCode);
            selectRegion(regionId);
          });
          
          // Add hover handlers
          path.addEventListener('mouseenter', (e) => {
            hoveredRegion.value = regionId;
            updateHoveredRegionData(regionId);
            updateTooltipPosition(e);
          });
          
          path.addEventListener('mouseleave', () => {
            hoveredRegion.value = null;
            hoveredRegionData.value = null;
          });
          
          // Add mousemove for tooltip positioning
          path.addEventListener('mousemove', (e) => {
            updateTooltipPosition(e);
          });
        });
        
        console.log('Event listeners attached successfully');
      });
    }
  } catch (error) {
    console.error('Error loading SVG:', error);
    // Fallback: show message
    if (svgContainer.value) {
      svgContainer.value.innerHTML = '<div class="p-4 text-center text-navy-600">Error loading map. Please refresh the page.</div>';
    }
  }
}

// Update only path colors/strokes without reloading the whole map (avoids flash/reload mid-step)
function updateMapColors() {
  const svg = svgContainer.value?.querySelector('svg');
  const regionalSupport = effectiveMapRegionalSupport.value;
  if (!svg || !regionalSupport?.length) return;
  const allPlayersSupport = effectiveMapAllPlayersRegionalSupport.value;
  const paths = svg.querySelectorAll('path[data-region-id]');
  paths.forEach(path => {
    const regionId = parseInt(path.getAttribute('data-region-id'), 10);
    const region = regionalSupport.find(r => r.region_id === regionId);
    if (!region) return;
    const { leaderId, leaderSupport } = getRegionLeader(region, allPlayersSupport);
    const colorScheme = playerColorMap.value[leaderId] || 'green';
    const fillColor = getRegionColor(leaderSupport, colorScheme);
    path.style.fill = fillColor;
    const isSelected = selectedRegions.value.includes(region.region_id);
    const baseStroke = isSelected ? 2.5 : 0.6;
    const scaledStroke = baseStroke / mapZoom.value;
    path.setAttribute('stroke', isSelected ? '#2563eb' : '#555');
    path.style.strokeWidth = `${scaledStroke}px`;
    path.style.opacity = isSelected ? '1' : '0.85';
  });
}

// Sync gameState -> mapDisplay only when not suppressing (turn summary not dismissed)
watch([() => gameState.value?.regional_support, () => gameState.value?.all_players_regional_support], () => {
  if (suppressMapUpdate.value) return;
  if (gameState.value?.regional_support?.length) {
    mapDisplayRegionalSupport.value = JSON.parse(JSON.stringify(gameState.value.regional_support));
  }
  if (gameState.value?.all_players_regional_support?.length) {
    mapDisplayAllPlayersRegionalSupport.value = JSON.parse(JSON.stringify(gameState.value.all_players_regional_support));
  }
}, { deep: true, immediate: true });

// Map uses display data (fallback to gameState for initial load before first sync)
const effectiveMapRegionalSupport = computed(() =>
  mapDisplayRegionalSupport.value?.length ? mapDisplayRegionalSupport.value : (gameState.value?.regional_support || [])
);
const effectiveMapAllPlayersRegionalSupport = computed(() =>
  mapDisplayAllPlayersRegionalSupport.value?.length ? mapDisplayAllPlayersRegionalSupport.value : (gameState.value?.all_players_regional_support || [])
);

// Watch for changes to update SVG colors
watch([effectiveMapRegionalSupport, selectedRegions, () => gameState.value?.game?.current_turn], async () => {
  if (!effectiveMapRegionalSupport.value?.length || showTurnSummary.value) return;
  await new Promise(resolve => setTimeout(resolve, 50));
  if (!svgContainer.value) return;
  const hasSvg = svgContainer.value.querySelector('svg');
  if (hasSvg) {
    updateMapColors();
  } else {
    loadSvgMap();
  }
}, { deep: true, immediate: true });

function getRegionTooltip(regionId) {
  const region = effectiveMapRegionalSupport.value?.find(r => r.region_id === regionId);
  if (!region) return '';
  return `${region.region_name}: ${(region.support_percentage * 100).toFixed(1)}%`;
}

// Zoom functions - main map stroke scales with zoom (selected = blue thicker, others = gray)
function updateMapStrokes() {
  const svg = svgContainer.value?.querySelector('svg');
  if (!svg) return;
  const paths = svg.querySelectorAll('path[data-region-id]');
  paths.forEach(path => {
    const regionId = parseInt(path.getAttribute('data-region-id'), 10);
    const isSelected = selectedRegions.value.includes(regionId);
    path.setAttribute('stroke', isSelected ? '#2563eb' : '#555');
    path.style.strokeWidth = `${(isSelected ? 2.5 : 0.6) / mapZoom.value}px`;
  });
}

function zoomIn() {
  mapZoom.value = Math.min(mapZoom.value + 0.15, 1.5);
  updateMapStrokes();
}

function zoomOut() {
  mapZoom.value = Math.max(mapZoom.value - 0.15, 0.5);
  updateMapStrokes();
}

function resetZoom() {
  mapZoom.value = 1.0;
  updateMapStrokes();
}

// Update hovered region data with all candidates (uses map display data)
function updateHoveredRegionData(regionId) {
  const region = effectiveMapRegionalSupport.value?.find(r => r.region_id === regionId);
  if (!region) {
    hoveredRegionData.value = null;
    return;
  }
  
  const allRegionalSupport = effectiveMapAllPlayersRegionalSupport.value || [];
  
  // Build candidates list with support data
  const candidates = [];
  
  // Add all players with their actual regional support
  if (gameState.value.all_players) {
    gameState.value.all_players.forEach(p => {
      // Find this player's support for this specific region
      const regionSupport = allRegionalSupport.find(
        rs => rs.player_id == p.id && rs.region_id == regionId
      );
      
      candidates.push({
        id: p.id,
        name: p.candidate_name,
        support: regionSupport ? regionSupport.support_percentage : (p.national_support || 0.15),
        isYou: p.id == gameState.value.player.id,
        isAI: p.is_ai
      });
    });
  }
  
  // Sort by support descending
  candidates.sort((a, b) => b.support - a.support);
  
  hoveredRegionData.value = {
    id: region.region_id,
    name: region.region_name,
    population: region.population,
    candidates: candidates
  };
}

function openRegionPopup(regionId) {
  const region = gameState.value?.regional_support?.find(r => r.region_id === regionId);
  if (!region) return;
  
  // Calculate population weight
  const totalPop = gameState.value.regional_support.reduce((sum, r) => sum + r.population, 0);
  const weight = ((region.population / totalPop) * 100).toFixed(1);
  
  // Get all candidates' support in this region
  // For now, we show the player's support. In multiplayer, we'd show all players
  const candidates = [];
  
  // Add the current player
  candidates.push({
    id: gameState.value.player.id,
    name: gameState.value.player.candidate_name,
    ethnicity: gameState.value.player.ethnicity,
    ideology: gameState.value.player.ideology,
    support: region.support_percentage,
    isYou: true,
    isAI: false
  });
  
  // Add other players (AI or human)
  if (gameState.value.all_players) {
    gameState.value.all_players.forEach(p => {
      // Skip current player (already added)
      if (!p.is_ai && p.id === gameState.value.player.id) return;
      
      // For AI and other human players, we simulate their support based on their national support
      // In a real implementation, you'd have per-region support for all players
      candidates.push({
        id: p.id,
        name: p.candidate_name,
        ethnicity: p.ethnicity,
        ideology: p.ideology,
        support: p.national_support || 0.15, // Fallback
        isYou: false,
        isAI: p.is_ai
      });
    });
  }
  
  // Sort by support descending
  candidates.sort((a, b) => b.support - a.support);
  
  regionPopupData.value = {
    id: region.region_id,
    name: region.region_name,
    population: region.population,
    weight: weight,
    yourSupport: region.support_percentage,
    candidates: candidates,
    description: getRegionDescription(region.region_name)
  };
  
  showRegionPopup.value = true;
}

function showInlineRegionPopup(regionId, event) {
  const region = gameState.value?.regional_support?.find(r => r.region_id === regionId);
  if (!region) return;
  
  const weight = Math.round((region.population / gameState.value.total_population) * 100 * 10) / 10;
  
  regionPopupData.value = {
    id: region.region_id,
    name: region.region_name,
    population: region.population,
    weight: weight,
    yourSupport: region.support_percentage,
    description: getRegionDescription(region.region_name)
  };
  
  // Position popup near click, but ensure it stays on screen
  const popupWidth = 300;
  const popupHeight = 350;
  let left = event.clientX + 10;
  let top = event.clientY - 50;
  
  if (left + popupWidth > window.innerWidth) {
    left = event.clientX - popupWidth - 10;
  }
  if (top + popupHeight > window.innerHeight) {
    top = window.innerHeight - popupHeight - 20;
  }
  if (top < 60) top = 60;
  
  popupPosition.value = {
    left: left + 'px',
    top: top + 'px'
  };
  
  showRegionPopup.value = true;
}

function openRegionInfoModal(regionId) {
  const region = gameState.value?.regional_support?.find(r => r.region_id === regionId);
  if (!region) return;
  
  regionInfoData.value = {
    ...region,
    description: getRegionDescription(region.region_name)
  };
  showRegionInfoModal.value = true;
}

function getRegionDescription(regionName) {
  const descriptions = {
    // Federation cantons
    'Una-Sana Canton': 'Overwhelmingly Bosniak (~90%). Conservative-leaning with strong traditional values. Voters here prioritize Bosniak national interests but also respond to economic development promises. SDA stronghold.',
    'Posavina Canton': 'Majority Croat (~63%) with significant Bosniak minority. Very conservative. HDZ dominates Croat areas. Ethnic voting patterns are strong - candidates must appeal to specific communities.',
    'Tuzla Canton': 'Majority Bosniak (~88%) but politically unique. Known as a left-leaning region with socialist traditions. Voters prioritize workers\' rights over ethnic politics. Anti-nationalist sentiment exists.',
    'Zenica-Doboj Canton': 'Predominantly Bosniak (~82%) with Croat minority. Mix of conservative and socialist voters. Industrial working-class traditions. Economic issues can compete with ethnic appeals.',
    'Bosnian-Podrinje': 'Almost entirely Bosniak (~91%). Small but symbolic region. Voters value resilience and development investment.',
    'Central Bosnia Canton': 'Mixed Bosniak (~58%) and Croat (~36%) population. Ethnically divided voting - Croat areas support HDZ, Bosniak areas support SDA. Balance is key.',
    'Herzegovina-Neretva Canton': 'Split between Bosniaks (~49%) and Croats (~47%). Includes divided Mostar. Highly polarized ethnic voting. Success requires navigating both communities.',
    'West Herzegovina Canton': 'Almost entirely Croat (~98%). HDZ heartland. Strongest Croat nationalist region. Non-Croat or liberal candidates face major challenges here.',
    'Sarajevo Canton': 'Predominantly Bosniak (~85%) but most diverse and liberal region. Cosmopolitan voters favor pro-European, multi-ethnic policies. Urban, educated electorate.',
    'Canton 10 (Herzeg-Bosnia)': 'Majority Croat (~77%) with Bosniak minority. Strong HDZ support. Traditional Catholic values dominate. Croat identity politics are paramount.',
    // Republika Srpska regions
    'Banja Luka Core': 'Overwhelmingly Serb (~88%). Political and economic heart of RS. SNSD stronghold but urban opposition exists. Serb autonomy is the key issue. Most developed RS region.',
    'Krajina West': 'Predominantly Serb (~86%). Traditional conservative values. Rural character with strong nationalist sentiment. SNSD dominates.',
    'Doboj': 'Majority Serb (~70%) with significant Bosniak minority (~23%). Strategic location. Mixed political leanings. Potential for cross-ethnic appeals.',
    'Bijeljina': 'Overwhelmingly Serb (~83%). Agricultural region in northeast. Traditional conservative values. Strong SNSD support.',
    'Podrinje': 'Mixed Serb (~65%) and Bosniak (~29%) population. Sensitive post-war region. Development and reconciliation issues matter.',
    'Romanija': 'Predominantly Serb (~89%). Mountainous region near Sarajevo. Strong nationalist sentiment. Conservative values dominate.',
    'Eastern Herzegovina': 'Overwhelmingly Serb (~89%). Includes Trebinje area. Strong Orthodox traditions. Nationalist conservative stronghold.',
    // District
    'Brcko District': 'Uniquely mixed - Bosniak (~42%), Serb (~35%), Croat (~20%). As neutral territory under international supervision, voters are more pragmatic. Civic-minded candidates can succeed.',
  };
  
  return descriptions[regionName] || `This region has mixed ethnic and ideological composition. Understanding local demographics is key to winning support here.`;
}

function updateTooltipPosition(event) {
  // Use fixed positioning relative to viewport - tooltip follows cursor closely
  const offsetX = 15;
  const offsetY = -10;
  
  // Check if tooltip would go off right edge
  const tooltipWidth = 240;
  let left = event.clientX + offsetX;
  if (left + tooltipWidth > window.innerWidth) {
    left = event.clientX - tooltipWidth - offsetX;
  }
  
  tooltipStyle.value = {
    top: (event.clientY + offsetY) + 'px',
    left: left + 'px'
  };
}

function openActionModal(actionType) {
  selectedActionType.value = actionType;
  showActionsModal.value = true;
}

function getModalTitle() {
  const titles = {
    'global': 'Global Campaigns',
    'local': 'Local Campaigns',
    'fundraising': 'Fundraising Actions',
    'skills': 'Skills'
  };
  return titles[selectedActionType.value] || 'Actions';
}

function getModalIcon() {
  const icons = {
    'global': '🌍',
    'local': '📍',
    'fundraising': '💰',
    'skills': '⚡'
  };
  return icons[selectedActionType.value] || '📋';
}

function getModalHeaderColor() {
  const colors = {
    'global': 'bg-gradient-to-r from-navy-600 to-blue-700',
    'local': 'bg-gradient-to-r from-navy-600 to-blue-700',
    'fundraising': 'bg-gradient-to-r from-green-600 to-emerald-700',
    'skills': 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  };
  return colors[selectedActionType.value] || 'bg-gray-600';
}

function getActionsForType() {
  if (!selectedActionType.value) return [];
  switch(selectedActionType.value) {
    case 'global':
      return globalCampaignActions.value;
    case 'local':
      return localCampaignActions.value;
    case 'fundraising':
      return fundraisingActions.value;
    case 'skills':
      return skillActions.value;
    default:
      return [];
  }
}

// Watch for game state changes
watch(() => gameState.value, (newState, oldState) => {
  // Refresh actions when game state changes
  if (newState) {
    loadActions();
    
    // Check if game just completed
    if (oldState && oldState.game?.status !== 'completed' && newState.game?.status === 'completed') {
      loadElectionResults();
    }
    
    // Debug: Log changes
    if (oldState && newState.player) {
      console.log('Game state updated:', {
        turn: newState.game.current_turn,
        budget: newState.player.budget,
        charisma: newState.player.charisma_points,
        national_support: newState.player.national_support
      });
    }
  }
}, { deep: true });

async function loadElectionResults() {
  const result = await gameStore.fetchElectionResults(gameId);
  if (result.success && result.election) {
    electionData.value = result.election;
    // Show election results immediately
    showElectionResults.value = true;
  } else {
    showMessage('Failed to load election results. The game may need to complete first.', 'error');
  }
}

async function initializeAndShowElection() {
  console.log(`[ELECTION] GameBoard: Starting election initialization/display for game ${gameId}`);
  
  // Try to fetch first, if that fails, initialize
  console.log(`[ELECTION] GameBoard: Fetching existing election results...`);
  let result = await gameStore.fetchElectionResults(gameId);
  console.log(`[ELECTION] GameBoard: Fetch result:`, result);
  
  if (!result.success || !result.election || result.election.results.length === 0) {
    // Initialize election if it doesn't exist
    console.log(`[ELECTION] GameBoard: No existing results found, initializing election...`);
    result = await gameStore.initializeElection(gameId);
    console.log(`[ELECTION] GameBoard: Initialize result:`, result);
    
    if (!result.success) {
      console.error(`[ELECTION] GameBoard: Failed to initialize election:`, result.error);
      showMessage(result.error || 'Failed to initialize election', 'error');
      return;
    }
  }
  
  if (result.success && result.election) {
    console.log(`[ELECTION] GameBoard: Success! Showing election results:`, result.election);
    electionData.value = result.election;
    showElectionResults.value = true;
  } else {
    console.error(`[ELECTION] GameBoard: Unexpected result format:`, result);
    showMessage('Failed to load election results', 'error');
  }
}
</script>
