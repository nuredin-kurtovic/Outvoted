import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useGameStore = defineStore('game', () => {
  const currentGame = ref(null);
  const gameState = ref(null);
  const availableActions = ref([]);
  const regions = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function fetchGames() {
    try {
      loading.value = true;
      const response = await axios.get(`${API_URL}/games`);
      return { success: true, games: response.data.games };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch games';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function createGame(gameData) {
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.post(`${API_URL}/games`, gameData);
      return { success: true, game: response.data.game };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to create game';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function fetchGameState(gameId) {
    // Only show full-page loading on initial load (no state yet). Refreshes keep the board mounted so the map doesn't disappear.
    const isInitialLoad = !gameState.value;
    try {
      if (isInitialLoad) loading.value = true;
      error.value = null;
      const response = await axios.get(`${API_URL}/games/${gameId}`);
      const newState = response.data;
      
      // Log changes for debugging
      if (gameState.value) {
        const oldBudget = gameState.value.player?.budget;
        const newBudget = newState.player?.budget;
        const oldSupport = gameState.value.player?.national_support;
        const newSupport = newState.player?.national_support;
        
        if (oldBudget !== newBudget || oldSupport !== newSupport) {
          console.log('Game state changed:', {
            budget: `${oldBudget} → ${newBudget}`,
            support: `${(oldSupport * 100).toFixed(1)}% → ${(newSupport * 100).toFixed(1)}%`,
            turn: newState.game.current_turn
          });
        }
      }
      
      gameState.value = newState;
      return { success: true, state: newState };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch game state';
      console.error('Fetch game state error:', err);
      return { success: false, error: error.value };
    } finally {
      if (isInitialLoad) loading.value = false;
    }
  }

  async function fetchAvailableActions(gameId) {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}/actions`);
      availableActions.value = response.data.actions;
      console.log('Fetched actions from API:', response.data.actions);
      console.log('Actions with rules:', response.data.actions.map(a => ({ 
        name: a.name, 
        type: a.type, 
        rules: a.rules,
        rulesType: typeof a.rules 
      })));
      return { success: true, actions: response.data.actions };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch actions';
      return { success: false, error: error.value };
    }
  }

  async function fetchRegions() {
    try {
      const response = await axios.get(`${API_URL}/games/regions/all`);
      regions.value = response.data.regions;
      return { success: true, regions: response.data.regions };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch regions';
      return { success: false, error: error.value };
    }
  }

  async function fetchCandidates() {
    try {
      const response = await axios.get(`${API_URL}/games/candidates`);
      return { success: true, candidates: response.data.candidates };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch candidates';
      return { success: false, error: error.value };
    }
  }

  async function takeTurn(gameId, actionData) {
    try {
      loading.value = true;
      const response = await axios.post(`${API_URL}/games/${gameId}/turn`, actionData);
      
      // Refresh game state after turn
      await fetchGameState(gameId);
      
      return { success: true, result: response.data };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to take turn';
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function fetchSpendingHistory(gameId) {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}/spending`);
      return { success: true, spending: response.data.spending };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch spending history';
      return { success: false, error: error.value };
    }
  }

  async function fetchTurnSummary(gameId, turnNumber = null) {
    try {
      const url = turnNumber 
        ? `${API_URL}/games/${gameId}/turn-summary?turn=${turnNumber}`
        : `${API_URL}/games/${gameId}/turn-summary`;
      const response = await axios.get(url);
      return { success: true, summary: response.data };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch turn summary';
      return { success: false, error: error.value };
    }
  }

  async function fetchDashboard(gameId) {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}/dashboard`);
      return { success: true, dashboard: response.data };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch dashboard';
      return { success: false, error: error.value };
    }
  }

  async function fetchPlayers(gameId) {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}/players`);
      return { success: true, players: response.data.players };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch players';
      return { success: false, error: error.value };
    }
  }

  async function fetchElectionResults(gameId) {
    try {
      const response = await axios.get(`${API_URL}/games/${gameId}/election`);
      return { success: true, election: response.data };
    } catch (err) {
      error.value = err.response?.data?.error || 'Failed to fetch election results';
      return { success: false, error: error.value };
    }
  }

  async function initializeElection(gameId) {
    try {
      console.log(`[ELECTION INIT] Frontend: Initializing election for game ${gameId}`);
      const response = await axios.post(`${API_URL}/games/${gameId}/election/initialize`);
      console.log(`[ELECTION INIT] Frontend: Success!`, response.data);
      return { success: true, election: response.data.election };
    } catch (err) {
      console.error(`[ELECTION INIT] Frontend: Error initializing election:`, err);
      console.error(`[ELECTION INIT] Frontend: Error response:`, err.response?.data);
      console.error(`[ELECTION INIT] Frontend: Error status:`, err.response?.status);
      console.error(`[ELECTION INIT] Frontend: Error message:`, err.message);
      error.value = err.response?.data?.error || err.response?.data?.message || 'Failed to initialize election';
      return { success: false, error: error.value };
    }
  }

  function clearGameState() {
    currentGame.value = null;
    gameState.value = null;
    availableActions.value = [];
  }

  return {
    currentGame,
    gameState,
    availableActions,
    regions,
    loading,
    error,
    fetchGames,
    createGame,
    fetchGameState,
    fetchAvailableActions,
    fetchRegions,
    fetchCandidates,
    takeTurn,
    fetchSpendingHistory,
    fetchTurnSummary,
    fetchDashboard,
    fetchPlayers,
    fetchElectionResults,
    initializeElection,
    clearGameState
  };
});
