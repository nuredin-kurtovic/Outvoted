<template>
  <div class="min-h-screen flex items-center justify-center relative py-12">
    <!-- Animated background elements -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 left-20 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-20 right-20 w-96 h-96 bg-slate-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
    </div>
    
    <div class="text-center px-4 relative z-10 max-w-4xl mx-auto">
      <!-- Main Logo and Title -->
      <div class="mb-10">
        <div class="inline-block bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-5 shadow-2xl mb-6">
          <svg class="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
          </svg>
        </div>
      </div>
      
      <h1 class="text-6xl sm:text-7xl font-extrabold mb-4 text-gray-900 tracking-tight">
        OUTVOTED
      </h1>
      
      <p class="text-2xl mb-4 text-gray-600 font-medium">Political Campaign Strategy Game</p>
      
      <p class="text-lg mb-12 text-gray-500 max-w-2xl mx-auto leading-relaxed">
        Master the art of political campaigning. Build support, manage resources, and outmaneuver your opponents in this strategic battle for votes.
      </p>
      
      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
        <router-link
          to="/login"
          class="inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
          <span>Login</span>
        </router-link>
        <router-link
          to="/register"
          class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-xl"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>Start Campaign</span>
        </router-link>
      </div>
      
      <!-- Features Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="bg-blue-100 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/></svg>
          </div>
          <h3 class="text-lg font-bold mb-2 text-gray-800">Strategic Campaigns</h3>
          <p class="text-gray-500 text-sm leading-relaxed">Plan and execute campaigns across regions with precision and strategy</p>
        </div>
        
        <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="bg-green-100 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          </div>
          <h3 class="text-lg font-bold mb-2 text-gray-800">Real-time Analytics</h3>
          <p class="text-gray-500 text-sm leading-relaxed">Track your support and make data-driven decisions to win</p>
        </div>
        
        <div class="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <div class="bg-amber-100 rounded-xl p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
            <svg class="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h3 class="text-lg font-bold mb-2 text-gray-800">Compete & Win</h3>
          <p class="text-gray-500 text-sm leading-relaxed">Outsmart opponents and claim victory in the political arena</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Home page
</script>
