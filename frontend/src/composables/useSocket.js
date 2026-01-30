import { ref, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

// Singleton socket instance
let socket = null;
const isConnected = ref(false);
const currentGameId = ref(null);

// Event callbacks storage
const eventCallbacks = new Map();

function initSocket() {
    if (socket && socket.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
        console.log('[SOCKET] Connected:', socket.id);
        isConnected.value = true;
        
        // Rejoin game room if we were in one
        if (currentGameId.value) {
            socket.emit('join_game', currentGameId.value);
        }
    });

    socket.on('disconnect', () => {
        console.log('[SOCKET] Disconnected');
        isConnected.value = false;
    });

    socket.on('connect_error', (error) => {
        console.error('[SOCKET] Connection error:', error);
    });

    return socket;
}

export function useSocket() {
    // Initialize socket on first use
    if (!socket) {
        initSocket();
    }

    function joinGame(gameId) {
        if (!socket) initSocket();
        
        currentGameId.value = gameId;
        socket.emit('join_game', gameId);
        console.log(`[SOCKET] Joining game room: game_${gameId}`);
    }

    function leaveGame(gameId) {
        if (!socket) return;
        
        socket.emit('leave_game', gameId);
        currentGameId.value = null;
        console.log(`[SOCKET] Left game room: game_${gameId}`);
    }

    function on(event, callback) {
        if (!socket) initSocket();
        
        // Store callback reference for cleanup
        if (!eventCallbacks.has(event)) {
            eventCallbacks.set(event, new Set());
        }
        eventCallbacks.get(event).add(callback);
        
        socket.on(event, callback);
    }

    function off(event, callback) {
        if (!socket) return;
        
        if (callback) {
            socket.off(event, callback);
            eventCallbacks.get(event)?.delete(callback);
        } else {
            // Remove all callbacks for this event
            socket.off(event);
            eventCallbacks.delete(event);
        }
    }

    function cleanup() {
        // Remove all registered event listeners
        eventCallbacks.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                socket?.off(event, callback);
            });
        });
        eventCallbacks.clear();
    }

    // Auto cleanup on component unmount
    onUnmounted(() => {
        cleanup();
    });

    return {
        socket,
        isConnected,
        currentGameId,
        joinGame,
        leaveGame,
        on,
        off,
        cleanup
    };
}
