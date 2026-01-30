import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import gameRoutes, { setSocketIO, handleTimerExpiration } from './routes/games.js';
import adminRoutes from './routes/admin.js';
import { runMigrations } from './database/migrations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Run database migrations
runMigrations();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Pass io and timer functions to game routes
setSocketIO(io, { startTurnTimer, stopTurnTimer, getRemainingTime });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Outvoted API is running' });
});

// Active game timers (stored in memory for real-time sync)
const gameTimers = new Map();

// Function to start a turn timer for a game
function startTurnTimer(gameId, durationSeconds = 60) {
    // Clear any existing timer
    if (gameTimers.has(gameId)) {
        clearInterval(gameTimers.get(gameId).interval);
    }
    
    const startTime = Date.now();
    const endTime = startTime + (durationSeconds * 1000);
    
    const timerData = {
        startTime,
        endTime,
        durationSeconds,
        interval: null
    };
    
    // Emit timer sync every second
    timerData.interval = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        io.to(`game_${gameId}`).emit('timer_sync', {
            gameId,
            remaining,
            total: durationSeconds
        });
        
        // Timer expired
        if (remaining <= 0) {
            clearInterval(timerData.interval);
            gameTimers.delete(gameId);
            io.to(`game_${gameId}`).emit('timer_expired', { gameId });
            console.log(`[TIMER] Game ${gameId} turn timer expired`);
            
            // Handle the turn expiration (auto-advance turn)
            handleTimerExpiration(gameId);
        }
    }, 1000);
    
    gameTimers.set(gameId, timerData);
    console.log(`[TIMER] Started ${durationSeconds}s timer for game ${gameId}`);
    
    return { startTime, endTime, durationSeconds };
}

// Function to stop a turn timer
function stopTurnTimer(gameId) {
    if (gameTimers.has(gameId)) {
        clearInterval(gameTimers.get(gameId).interval);
        gameTimers.delete(gameId);
        console.log(`[TIMER] Stopped timer for game ${gameId}`);
    }
}

// Function to get remaining time for a game
function getRemainingTime(gameId) {
    if (!gameTimers.has(gameId)) return 0;
    const timer = gameTimers.get(gameId);
    return Math.max(0, Math.ceil((timer.endTime - Date.now()) / 1000));
}

// Export timer functions for use in routes
export { startTurnTimer, stopTurnTimer, getRemainingTime };

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);
    
    // Join a game room
    socket.on('join_game', (gameId) => {
        const room = `game_${gameId}`;
        socket.join(room);
        console.log(`[SOCKET] Client ${socket.id} joined room: ${room}`);
        
        // Send current timer state if game has active timer
        if (gameTimers.has(gameId)) {
            const remaining = getRemainingTime(gameId);
            const timer = gameTimers.get(gameId);
            socket.emit('timer_sync', {
                gameId,
                remaining,
                total: timer.durationSeconds
            });
        }
        
        // Notify others in the room
        socket.to(room).emit('player_connected', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
    });
    
    // Leave a game room
    socket.on('leave_game', (gameId) => {
        const room = `game_${gameId}`;
        socket.leave(room);
        console.log(`[SOCKET] Client ${socket.id} left room: ${room}`);
        
        // Notify others in the room
        socket.to(room).emit('player_disconnected', {
            socketId: socket.id,
            timestamp: new Date().toISOString()
        });
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log(`[SOCKET] Client disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
    console.log(`Socket.IO enabled`);
});

// Export io for use in routes
export { io };
