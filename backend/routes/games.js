import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { GameEngine } from '../game/gameEngine.js';
import { AIEngine } from '../game/aiEngine.js';

const router = express.Router();
const gameEngine = new GameEngine(pool);
const aiEngine = new AIEngine(pool, gameEngine);

// Socket.IO instance and timer functions (set by server.js)
let io = null;
let startTurnTimer = null;
let stopTurnTimer = null;
let getRemainingTime = null;

// Turn duration in seconds (2 minutes)
const TURN_DURATION = 60;

// Function to set the Socket.IO instance and timer functions
export function setSocketIO(socketIO, timerFunctions = {}) {
    io = socketIO;
    startTurnTimer = timerFunctions.startTurnTimer;
    stopTurnTimer = timerFunctions.stopTurnTimer;
    getRemainingTime = timerFunctions.getRemainingTime;
    console.log('[SOCKET] Socket.IO instance set in games routes');
}

// Helper function to emit to a game room
function emitToGame(gameId, event, data) {
    if (io) {
        const room = `game_${gameId}`;
        io.to(room).emit(event, data);
        console.log(`[SOCKET] Emitted '${event}' to room ${room}`);
    }
}

// Helper function to start turn timer for a game
function startGameTurnTimer(gameId) {
    if (startTurnTimer) {
        startTurnTimer(gameId, TURN_DURATION);
        emitToGame(gameId, 'turn_started', {
            gameId,
            duration: TURN_DURATION,
            timestamp: new Date().toISOString()
        });
    }
}

// Helper function to create AI opponent from predefined candidates
async function createAIOpponent(gameId, playerCandidateId) {
    try {
        console.log(`Creating AI opponent for game ${gameId}, excluding candidate ${playerCandidateId}`);
        
        // Get all candidates that are NOT already taken in this game
        const [takenCandidates] = await pool.execute(
            'SELECT candidate_id FROM game_players WHERE game_id = ? AND candidate_id IS NOT NULL',
            [gameId]
        );
        const takenIds = takenCandidates.map(c => c.candidate_id);
        
        // Query for available candidates, preferring different ethnicity from player
        const [playerCandidate] = await pool.execute(
            'SELECT ethnicity FROM candidates WHERE id = ?',
            [playerCandidateId]
        );
        const playerEthnicity = playerCandidate[0]?.ethnicity;
        
        // Get available candidates (not taken), prioritizing different ethnicity
        let query = 'SELECT * FROM candidates WHERE id NOT IN (?)';
        let params = [takenIds.length > 0 ? takenIds : [0]];
        
        if (playerEthnicity) {
            // First try to get candidates with different ethnicity
            const [diffEthnicityCandidates] = await pool.execute(
                'SELECT * FROM candidates WHERE id NOT IN (?) AND ethnicity != ? ORDER BY RAND() LIMIT 1',
                [takenIds.length > 0 ? takenIds : [0], playerEthnicity]
            );
            
            if (diffEthnicityCandidates.length > 0) {
                var aiCandidate = diffEthnicityCandidates[0];
            } else {
                // Fallback to any available candidate
                const [anyCandidates] = await pool.execute(
                    'SELECT * FROM candidates WHERE id NOT IN (?) ORDER BY RAND() LIMIT 1',
                    [takenIds.length > 0 ? takenIds : [0]]
                );
                if (anyCandidates.length === 0) {
                    throw new Error('No available candidates for AI opponent');
                }
                var aiCandidate = anyCandidates[0];
            }
        } else {
            // No player ethnicity info, just pick random
            const [randomCandidates] = await pool.execute(
                'SELECT * FROM candidates WHERE id NOT IN (?) ORDER BY RAND() LIMIT 1',
                [takenIds.length > 0 ? takenIds : [0]]
            );
            if (randomCandidates.length === 0) {
                throw new Error('No available candidates for AI opponent');
            }
            var aiCandidate = randomCandidates[0];
        }

        const { id: aiCandidateId, name: aiCandidateName, ethnicity: aiEthnicity, ideology: aiIdeology, home_region_id: homeRegionId } = aiCandidate;

        console.log(`AI candidate selected: ${aiCandidateName} (ID: ${aiCandidateId}), ${aiEthnicity}, ${aiIdeology}, region: ${homeRegionId}`);

        // Calculate starting budget
        const player = { ethnicity: aiEthnicity, ideology: aiIdeology, home_region_id: homeRegionId };
        const startingBudget = await gameEngine.calculateStartingBudget(player);

        console.log(`AI starting budget: ${startingBudget}`);

        // Create AI player with candidate reference
        const [aiPlayerResult] = await pool.execute(
            `INSERT INTO game_players 
             (game_id, user_id, candidate_id, candidate_name, ethnicity, ideology, home_region_id, budget, charisma_points, turn_order, is_ai)
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, 2, TRUE)`,
            [gameId, aiCandidateId, aiCandidateName, aiEthnicity, aiIdeology, homeRegionId, startingBudget]
        );

        const aiPlayerId = aiPlayerResult.insertId;
        console.log(`AI player created with ID: ${aiPlayerId}`);

        // Initialize regional support for AI
        const [allRegions] = await pool.execute('SELECT id FROM regions');
        console.log(`Initializing support for ${allRegions.length} regions`);
        
        for (const region of allRegions) {
            const initialSupport = await gameEngine.calculateInitialSupport(
                { ethnicity: aiEthnicity, ideology: aiIdeology, home_region_id: homeRegionId },
                region.id
            );

            await pool.execute(
                `INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
                 VALUES (?, ?, ?, ?)`,
                [gameId, aiPlayerId, region.id, initialSupport]
            );

            await pool.execute(
                `INSERT INTO support_history (game_id, player_id, region_id, turn_number, support_percentage)
                 VALUES (?, ?, ?, 0, ?)
                 ON DUPLICATE KEY UPDATE support_percentage = VALUES(support_percentage)`,
                [gameId, aiPlayerId, region.id, initialSupport]
            );
        }

        console.log(`AI opponent creation completed for game ${gameId}`);
        return aiPlayerId;
    } catch (error) {
        console.error('Error in createAIOpponent:', error);
        throw error;
    }
}

// Helper function to create a specific AI opponent by candidate ID
async function createSpecificAIOpponent(gameId, candidateId, turnOrder = 2) {
    try {
        console.log(`Creating specific AI opponent for game ${gameId}, candidate ${candidateId}`);
        
        // Fetch the specific candidate
        const [candidates] = await pool.execute(
            'SELECT * FROM candidates WHERE id = ?',
            [candidateId]
        );
        
        if (candidates.length === 0) {
            throw new Error(`Candidate ${candidateId} not found`);
        }
        
        const aiCandidate = candidates[0];
        const aiCandidateId = aiCandidate.id;
        const aiCandidateName = aiCandidate.name;
        const aiEthnicity = aiCandidate.ethnicity;
        const aiIdeology = aiCandidate.ideology;
        const homeRegionId = aiCandidate.home_region_id;

        console.log(`AI candidate selected: ${aiCandidateName} (ID: ${aiCandidateId}), ${aiEthnicity}, ${aiIdeology}, region: ${homeRegionId}`);

        // Calculate starting budget
        const player = { ethnicity: aiEthnicity, ideology: aiIdeology, home_region_id: homeRegionId };
        const startingBudget = await gameEngine.calculateStartingBudget(player);

        console.log(`AI starting budget: ${startingBudget}`);

        // Create AI player with candidate reference
        const [aiPlayerResult] = await pool.execute(
            `INSERT INTO game_players 
             (game_id, user_id, candidate_id, candidate_name, ethnicity, ideology, home_region_id, budget, charisma_points, turn_order, is_ai)
             VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, ?, TRUE)`,
            [gameId, aiCandidateId, aiCandidateName, aiEthnicity, aiIdeology, homeRegionId, startingBudget, turnOrder]
        );

        const aiPlayerId = aiPlayerResult.insertId;
        console.log(`AI player created with ID: ${aiPlayerId}`);

        // Initialize regional support for AI
        const [allRegions] = await pool.execute('SELECT id FROM regions');
        console.log(`Initializing support for ${allRegions.length} regions`);
        
        for (const region of allRegions) {
            const initialSupport = await gameEngine.calculateInitialSupport(
                { ethnicity: aiEthnicity, ideology: aiIdeology, home_region_id: homeRegionId },
                region.id
            );

            await pool.execute(
                `INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
                 VALUES (?, ?, ?, ?)`,
                [gameId, aiPlayerId, region.id, initialSupport]
            );

            await pool.execute(
                `INSERT INTO support_history (game_id, player_id, region_id, turn_number, support_percentage)
                 VALUES (?, ?, ?, 0, ?)
                 ON DUPLICATE KEY UPDATE support_percentage = VALUES(support_percentage)`,
                [gameId, aiPlayerId, region.id, initialSupport]
            );
        }

        console.log(`Specific AI opponent creation completed for game ${gameId}`);
        return aiPlayerId;
    } catch (error) {
        console.error('Error in createSpecificAIOpponent:', error);
        throw error;
    }
}

// Get all games for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const [games] = await pool.execute(
            `SELECT g.*, gp.id as player_id, gp.candidate_name, gp.ethnicity, gp.ideology, c.image_url as candidate_image_url
             FROM games g
             JOIN game_players gp ON g.id = gp.game_id
             LEFT JOIN candidates c ON gp.candidate_id = c.id
             WHERE gp.user_id = ?
             ORDER BY g.updated_at DESC`,
            [userId]
        );

        // Map games to include image_url
        const gamesWithImages = games.map(game => ({
            ...game,
            image_url: game.candidate_image_url || null
        }));

        res.json({ games: gamesWithImages });
    } catch (error) {
        console.error('Get games error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new game
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { candidate_id, max_players } = req.body;

        // Must select a predefined candidate
        if (!candidate_id) {
            return res.status(400).json({ 
                error: 'candidate_id is required. Please select a candidate.' 
            });
        }

        // Fetch the candidate details
        const [candidates] = await pool.execute(
            'SELECT * FROM candidates WHERE id = ?',
            [candidate_id]
        );

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const candidate = candidates[0];
        const { name: candidate_name, ethnicity, ideology, home_region_id } = candidate;

        const finalMaxPlayers = max_players ? Math.min(Math.max(2, parseInt(max_players)), 6) : 2;

        // Generate join code (6 digits)
        const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create game as multiplayer lobby (status: waiting)
        const [gameResult] = await pool.execute(
            'INSERT INTO games (host_user_id, status, game_type, join_code, max_players, max_turns, current_turn) VALUES (?, ?, ?, ?, ?, 30, 1)',
            [userId, 'waiting', 'multiplayer', joinCode, finalMaxPlayers]
        );

        const gameId = gameResult.insertId;

        // Calculate starting budget
        const player = { ethnicity, ideology, home_region_id };
        const startingBudget = await gameEngine.calculateStartingBudget(player);

        // Create player with candidate reference
        const [playerResult] = await pool.execute(
            `INSERT INTO game_players 
             (game_id, user_id, candidate_id, candidate_name, ethnicity, ideology, home_region_id, budget, charisma_points, turn_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 1)`,
            [gameId, userId, candidate_id, candidate_name, ethnicity, ideology, home_region_id, startingBudget]
        );

        const playerId = playerResult.insertId;

        // Initialize regional support for all regions
        const [regions] = await pool.execute('SELECT id FROM regions');
        
        for (const region of regions) {
            const initialSupport = await gameEngine.calculateInitialSupport(
                { ethnicity, ideology, home_region_id },
                region.id
            );

            await pool.execute(
                `INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
                 VALUES (?, ?, ?, ?)`,
                [gameId, playerId, region.id, initialSupport]
            );

            await pool.execute(
                `INSERT INTO support_history (game_id, player_id, region_id, turn_number, support_percentage)
                 VALUES (?, ?, ?, 0, ?)
                 ON DUPLICATE KEY UPDATE support_percentage = VALUES(support_percentage)`,
                [gameId, playerId, region.id, initialSupport]
            );
        }

        // Set current player turn to first player
        await pool.execute(
            'UPDATE games SET current_player_turn = ? WHERE id = ?',
            [1, gameId]
        );

        res.status(201).json({
            message: 'Game created. Add AI opponents or share the code to invite players.',
            game: { 
                id: gameId, 
                player_id: playerId,
                join_code: joinCode,
                game_type: 'multiplayer',
                max_players: finalMaxPlayers,
                status: 'waiting'
            }
        });
    } catch (error) {
        console.error('Create game error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all predefined candidates (must be before /:gameId routes)
router.get('/candidates', authenticateToken, async (req, res) => {
    try {
        const [candidates] = await pool.execute(`
            SELECT c.*, r.name as region_name 
            FROM candidates c 
            JOIN regions r ON c.home_region_id = r.id 
            ORDER BY c.ethnicity, c.name
        `);
        
        res.json({
            candidates: candidates.map(c => ({
                id: c.id,
                name: c.name,
                ethnicity: c.ethnicity,
                ideology: c.ideology,
                home_region_id: c.home_region_id,
                home_region_name: c.region_name,
                description: c.description,
                image_url: c.image_url
            }))
        });
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get available candidates for a specific game (excludes already taken candidates)
router.get('/candidates/available/:joinCode', authenticateToken, async (req, res) => {
    try {
        const { joinCode } = req.params;
        
        // Find game by join code
        const [games] = await pool.execute(
            'SELECT id FROM games WHERE join_code = ? AND status = ?',
            [joinCode, 'waiting']
        );
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found or not accepting players' });
        }
        
        const gameId = games[0].id;
        
        // Get taken candidate IDs
        const [takenCandidates] = await pool.execute(
            'SELECT candidate_id FROM game_players WHERE game_id = ? AND candidate_id IS NOT NULL',
            [gameId]
        );
        const takenIds = takenCandidates.map(c => c.candidate_id);
        
        // Get all candidates with availability status
        const [candidates] = await pool.execute(`
            SELECT c.*, r.name as region_name 
            FROM candidates c 
            JOIN regions r ON c.home_region_id = r.id 
            ORDER BY c.ethnicity, c.name
        `);
        
        res.json({
            candidates: candidates.map(c => ({
                id: c.id,
                name: c.name,
                ethnicity: c.ethnicity,
                ideology: c.ideology,
                home_region_id: c.home_region_id,
                home_region_name: c.region_name,
                description: c.description,
                image_url: c.image_url,
                is_taken: takenIds.includes(c.id)
            })),
            taken_candidate_ids: takenIds
        });
    } catch (error) {
        console.error('Get available candidates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get game state
router.get('/:gameId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;

        console.log(`[GAME STATE] Fetching state for game ${gameId}, user ${userId}`);

        // Get game info
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) {
            console.log(`[GAME STATE] Game ${gameId} not found`);
            return res.status(404).json({ error: 'Game not found' });
        }

        const game = games[0];
        console.log(`[GAME STATE] Game found: ${game.id}, type: ${game.game_type}, status: ${game.status}`);

        // Get player info with candidate image
        const [players] = await pool.execute(
            `SELECT gp.*, c.image_url as candidate_image_url
             FROM game_players gp
             LEFT JOIN candidates c ON gp.candidate_id = c.id
             WHERE gp.game_id = ? AND gp.user_id = ?`,
            [gameId, userId]
        );

        if (players.length === 0) {
            console.log(`[GAME STATE] Player not found for user ${userId} in game ${gameId}`);
            return res.status(404).json({ error: 'Player not found in this game' });
        }

        let player = players[0];
        console.log(`[GAME STATE] Player found: ${player.id}, ${player.candidate_name}`);

        // Get regional support for current player
        console.log(`[GAME STATE] Fetching regional support for player ${player.id}`);
        const [supports] = await pool.execute(
            `SELECT rs.*, r.name, r.code, r.population 
             FROM regional_support rs
             JOIN regions r ON rs.region_id = r.id
             WHERE rs.game_id = ? AND rs.player_id = ?
             ORDER BY r.name`,
            [gameId, player.id]
        );
        console.log(`[GAME STATE] Found ${supports.length} regions with support data`);
        
        // Get regional support for ALL players (for map coloring)
        const [allPlayersRegionalSupport] = await pool.execute(
            `SELECT rs.player_id, rs.region_id, r.name as region_name, rs.support_percentage
             FROM regional_support rs
             JOIN regions r ON rs.region_id = r.id
             WHERE rs.game_id = ?
             ORDER BY rs.player_id, r.name`,
            [gameId]
        );
        console.log(`[GAME STATE] Found ${allPlayersRegionalSupport.length} total regional support records`);

        // Get active skills
        const [activeSkills] = await pool.execute(
            `SELECT aks.*, a.name as action_name, a.description
             FROM active_skills aks
             JOIN actions a ON aks.action_id = a.id
             WHERE aks.game_id = ? AND aks.player_id = ?`,
            [gameId, player.id]
        );

        // Get used actions (once per game)
        const [usedActions] = await pool.execute(
            `SELECT action_id FROM used_actions WHERE game_id = ? AND player_id = ?`,
            [gameId, player.id]
        );

        // Check if player has completed their turn for the current turn
        const [turnCompletions] = await pool.execute(
            `SELECT COUNT(*) as count FROM turn_completions 
             WHERE game_id = ? AND player_id = ? AND turn_number = ?`,
            [gameId, player.id, game.current_turn]
        );
        const hasCompletedTurn = turnCompletions[0]?.count > 0;
        
        // Get how many players have completed this turn (for progress display)
        const [allTurnCompletions] = await pool.execute(
            `SELECT COUNT(DISTINCT player_id) as count FROM turn_completions 
             WHERE game_id = ? AND turn_number = ?`,
            [gameId, game.current_turn]
        );
        const playersCompletedCount = allTurnCompletions[0]?.count || 0;
        
        // Get total human players count
        const [totalHumanPlayers] = await pool.execute(
            `SELECT COUNT(*) as count FROM game_players WHERE game_id = ? AND (is_ai = FALSE OR is_ai IS NULL) AND user_id IS NOT NULL`,
            [gameId]
        );
        const totalHumanCount = totalHumanPlayers[0]?.count || 1;
        
        // For multiplayer: All players can play simultaneously (not sequential)
        // For single/ai: Same as before
        const isMyTurn = game.game_type === 'single' || 
                         game.game_type === 'ai' ||
                         game.game_type === 'multiplayer'; // In multiplayer, it's always "your turn" until you play
        
        // Can play if game is active, player hasn't completed the turn yet, and game is not completed
        const canPlay = game.status === 'active' && 
                       game.current_turn <= game.max_turns &&
                       isMyTurn && 
                       !hasCompletedTurn;
        
        // Get remaining time for multiplayer games
        let remainingTime = null;
        if (game.game_type === 'multiplayer' && getRemainingTime) {
            remainingTime = getRemainingTime(parseInt(gameId));
        }

        // Refresh player data to get latest budget and charisma
        const [updatedPlayer] = await pool.execute(
            'SELECT * FROM game_players WHERE id = ?',
            [player.id]
        );
        if (updatedPlayer.length > 0) {
            player = updatedPlayer[0];
        }
        
        // Calculate national support (recalculate to ensure it's up to date)
        const nationalSupport = await gameEngine.calculateNationalSupport(gameId, player.id);
        
        console.log(`[GAME STATE] Player ${player.id}: Budget=${player.budget}, Charisma=${player.charisma_points}, Support=${nationalSupport}`);

        // Get all players in the game (including AI) with candidate images
        console.log(`[GAME STATE] Fetching all players for game ${gameId}`);
        const [allPlayers] = await pool.execute(
            `SELECT gp.*, u.username, COALESCE(gp.is_ai, FALSE) as is_ai, c.image_url as candidate_image_url
             FROM game_players gp
             LEFT JOIN users u ON gp.user_id = u.id
             LEFT JOIN candidates c ON gp.candidate_id = c.id
             WHERE gp.game_id = ?
             ORDER BY gp.turn_order`,
            [gameId]
        );
        
        console.log(`[GAME STATE] Found ${allPlayers.length} players`);
        
        // Calculate national support for each player
        const playersWithSupport = [];
        for (const p of allPlayers) {
            try {
                const nationalSupport = await gameEngine.calculateNationalSupport(gameId, p.id);
                playersWithSupport.push({
                    id: p.id,
                    candidate_name: p.candidate_name,
                    username: p.username,
                    ethnicity: p.ethnicity,
                    ideology: p.ideology,
                    budget: p.budget,
                    charisma_points: p.charisma_points,
                    is_ai: p.is_ai === 1 || p.is_ai === true || p.user_id === null,
                    turn_order: p.turn_order,
                    user_id: p.user_id,
                    national_support: nationalSupport,
                    image_url: p.candidate_image_url || null
                });
            } catch (supportError) {
                console.error(`[GAME STATE] Error calculating support for player ${p.id}:`, supportError);
                playersWithSupport.push({
                    id: p.id,
                    candidate_name: p.candidate_name,
                    username: p.username,
                    ethnicity: p.ethnicity,
                    ideology: p.ideology,
                    budget: p.budget,
                    charisma_points: p.charisma_points,
                    is_ai: p.is_ai === 1 || p.is_ai === true || p.user_id === null,
                    turn_order: p.turn_order,
                    user_id: p.user_id,
                    national_support: 0,
                    image_url: p.candidate_image_url || null
                });
            }
        }

        console.log(`[GAME STATE] Preparing response for game ${gameId}`);
        
        const responseData = {
            game: {
                id: game.id,
                status: game.status,
                current_turn: game.current_turn,
                max_turns: game.max_turns,
                max_players: game.max_players,
                game_type: game.game_type,
                join_code: game.join_code,
                can_play: canPlay,
                has_completed_turn: hasCompletedTurn,
                players_completed: playersCompletedCount,
                total_human_players: totalHumanCount,
                remaining_time: remainingTime,
                turn_duration: TURN_DURATION
            },
            player: {
                id: player.id,
                candidate_name: player.candidate_name,
                ethnicity: player.ethnicity,
                ideology: player.ideology,
                budget: parseFloat(player.budget || 0),
                charisma_points: parseInt(player.charisma_points || 0),
                national_support: nationalSupport,
                image_url: player.candidate_image_url || null
            },
            all_players: playersWithSupport.map(p => {
                try {
                    return {
                        id: p.id,
                        candidate_name: p.candidate_name || 'Unknown',
                        username: p.username || (p.is_ai ? 'AI Opponent' : 'Unknown'),
                        ethnicity: p.ethnicity,
                        ideology: p.ideology,
                        budget: parseFloat(p.budget || 0),
                        charisma_points: parseInt(p.charisma_points || 0),
                        national_support: parseFloat(p.national_support || 0),
                        is_ai: p.is_ai === 1 || p.is_ai === true || p.user_id === null,
                        turn_order: parseInt(p.turn_order || 0),
                        image_url: p.image_url || null
                    };
                } catch (mapError) {
                    console.error(`[GAME STATE] Error mapping player ${p.id}:`, mapError);
                    return {
                        id: p.id,
                        candidate_name: 'Error',
                        username: 'Error',
                        ethnicity: 'Unknown',
                        ideology: 'Unknown',
                        budget: 0,
                        charisma_points: 0,
                        national_support: 0,
                        is_ai: false,
                        turn_order: 0
                    };
                }
            }),
            regional_support: supports.map(s => {
                try {
                    return {
                        region_id: s.region_id,
                        region_name: s.name || 'Unknown Region',
                        region_code: s.code || '',
                        population: parseInt(s.population || 0),
                        support_percentage: parseFloat(s.support_percentage || 0.20)
                    };
                } catch (mapError) {
                    console.error(`[GAME STATE] Error mapping region support:`, mapError);
                    return {
                        region_id: s.region_id || 0,
                        region_name: 'Error',
                        region_code: '',
                        population: 0,
                        support_percentage: 0.20
                    };
                }
            }),
            active_skills: (activeSkills || []).map(s => {
                try {
                    let effectData = {};
                    try {
                        effectData = typeof s.effect_data === 'string' ? JSON.parse(s.effect_data || '{}') : (s.effect_data || {});
                    } catch (e) {
                        console.error('Error parsing effect_data:', e);
                        effectData = {};
                    }
                    return {
                        id: s.id || 0,
                        action_id: s.action_id || 0,
                        action_name: s.action_name || 'Unknown',
                        description: s.description || '',
                        turns_remaining: parseInt(s.turns_remaining || 0),
                        effect_data: effectData
                    };
                } catch (mapError) {
                    console.error('[GAME STATE] Error mapping active skill:', mapError);
                    return {
                        id: 0,
                        action_id: 0,
                        action_name: 'Error',
                        description: '',
                        turns_remaining: 0,
                        effect_data: {}
                    };
                }
            }),
            used_action_ids: (usedActions || []).map(u => u.action_id || 0).filter(id => id > 0),
            all_players_regional_support: allPlayersRegionalSupport.map(rs => ({
                player_id: rs.player_id,
                region_id: rs.region_id,
                region_name: rs.region_name,
                support_percentage: parseFloat(rs.support_percentage || 0)
            }))
        };
        
        console.log(`[GAME STATE] Response data prepared, sending...`);
        console.log(`[GAME STATE] Players: ${responseData.all_players.length}, Regions: ${responseData.regional_support.length}, All regional support: ${responseData.all_players_regional_support.length}`);
        
        res.json(responseData);
        
        console.log(`[GAME STATE] Successfully returned game state for game ${gameId}`);
    } catch (error) {
        console.error('[GAME STATE] Error:', error);
        console.error('[GAME STATE] Error stack:', error.stack);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get available actions
router.get('/:gameId/actions', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;

        // Verify player access
        const [players] = await pool.execute(
            `SELECT * FROM game_players WHERE game_id = ? AND user_id = ?`,
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'Player not found in this game' });
        }

        const player = players[0];
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }
        
        const game = games[0];

        // Get all actions
        const [actions] = await pool.execute('SELECT * FROM actions ORDER BY type, name');

        // Helper to safely parse rules (handles both string and object)
        const parseRules = (rawRules) => {
            if (!rawRules) return {};
            if (typeof rawRules === 'object') return rawRules;
            try {
                return JSON.parse(rawRules);
            } catch (e) {
                console.error('Error parsing rules:', e);
                return {};
            }
        };

        // Filter actions based on game state (ultimate ability removed)
        const availableActions = actions.filter(action => {
            if (action.type === 'ultimate') return false;
            const rules = parseRules(action.rules);

            // Check last week only
            if (rules.last_week_only && game.current_turn < game.max_turns - 1) {
                return false;
            }

            return true;
        });

        res.json({
            actions: availableActions.map(a => {
                const rules = parseRules(a.rules);
                
                return {
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    base_cost: parseFloat(a.base_cost || 0),
                    base_support_gain: parseFloat(a.base_support_gain || 0),
                    base_budget_gain: parseFloat(a.base_budget_gain || 0),
                    charisma_cost: a.charisma_cost || 0,
                    description: a.description || '',
                    rules: rules
                };
            })
        });
    } catch (error) {
        console.error('Get actions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Take a turn (execute an action)
router.post('/:gameId/turn', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;
        const { action_id, region_id, region_ids, spending_amount } = req.body;
        const regionIds = Array.isArray(region_ids) ? region_ids : (region_id != null ? [region_id] : []);

        if (!action_id) {
            return res.status(400).json({ error: 'action_id is required' });
        }

        // Verify player access
        const [players] = await pool.execute(
            `SELECT * FROM game_players WHERE game_id = ? AND user_id = ?`,
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'Player not found in this game' });
        }

        const player = players[0];

        // Get game and action
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const game = games[0];

        if (game.status !== 'active') {
            return res.status(400).json({ error: 'Game is not active' });
        }

        // Check if player already completed their turn this round
        const [existingCompletion] = await pool.execute(
            `SELECT COUNT(*) as count FROM turn_completions 
             WHERE game_id = ? AND player_id = ? AND turn_number = ?`,
            [gameId, player.id, game.current_turn]
        );
        
        if (existingCompletion[0].count > 0) {
            return res.status(400).json({ 
                error: 'You have already played this round. Wait for other players or timer to expire.',
                already_played: true
            });
        }

        const [actions] = await pool.execute('SELECT * FROM actions WHERE id = ?', [action_id]);
        if (actions.length === 0) {
            return res.status(404).json({ error: 'Action not found' });
        }

        const action = actions[0];
        let campaignRules = {};
        try {
            campaignRules = typeof action.rules === 'string' ? JSON.parse(action.rules || '{}') : (action.rules || {});
        } catch (e) {
            campaignRules = {};
        }

        // Apply passive shift first and capture the result
        const passiveShiftResult = await gameEngine.applyPassiveShift(gameId, player.id);
        console.log(`[TURN] Passive shift for player ${player.id}: ${passiveShiftResult.changes.length} regions, global change: ${(passiveShiftResult.globalChange * 100).toFixed(2)}%`);

        let result;
        try {
            switch (action.type) {
                case 'campaign':
                    if (campaignRules.scope !== 'global' && (!regionIds || regionIds.length === 0)) {
                        return res.status(400).json({ error: 'Select at least one region for local campaign' });
                    }
                    result = await gameEngine.executeCampaignAction(
                        gameId, player.id, action_id, campaignRules.scope === 'global' ? null : regionIds
                    );
                    break;

                case 'fundraising':
                    result = await gameEngine.executeFundraisingAction(
                        gameId, player.id, action_id
                    );
                    break;

                case 'skill':
                    result = await gameEngine.executeSkillAction(
                        gameId, player.id, action_id
                    );
                    break;

                default:
                    return res.status(400).json({ error: 'Invalid action type' });
            }
        } catch (actionError) {
            return res.status(400).json({ error: actionError.message });
        }

        // Record turn completion
        await pool.execute(
            `INSERT INTO turn_completions (game_id, player_id, turn_number)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
            [gameId, player.id, game.current_turn]
        );

        // Check if all players have completed their turn
        const [allPlayers] = await pool.execute(
            'SELECT id, is_ai, user_id FROM game_players WHERE game_id = ? AND is_active = TRUE',
            [gameId]
        );

        const [completedTurns] = await pool.execute(
            'SELECT DISTINCT player_id FROM turn_completions WHERE game_id = ? AND turn_number = ?',
            [gameId, game.current_turn]
        );

        const completedPlayerIds = completedTurns.map(t => t.player_id);
        const allPlayerIds = allPlayers.map(p => p.id);
        const aiPlayerIds = allPlayers
            .filter(p => p.is_ai || p.user_id === null)
            .map(p => p.id);

        // For AI games: Execute AI moves immediately after human player's turn
        const aiMovesExecuted = [];
        if (game.game_type === 'ai') {
            for (const aiPlayerId of aiPlayerIds) {
                if (!completedPlayerIds.includes(aiPlayerId)) {
                    try {
                        console.log(`[AUTO AI] Executing AI turn for player ${aiPlayerId} in game ${gameId}`);
                        
                        // Apply passive shift for AI
                        await gameEngine.applyPassiveShift(gameId, aiPlayerId);
                        
                        // Execute AI's move
                        const aiResult = await aiEngine.executeAITurn(gameId, aiPlayerId);
                        
                        if (aiResult) {
                            console.log(`[AUTO AI] AI move executed successfully:`, aiResult);
                            aiMovesExecuted.push({ playerId: aiPlayerId, result: aiResult });
                        }
                        
                        // Record AI turn completion
                        await pool.execute(
                            `INSERT INTO turn_completions (game_id, player_id, turn_number)
                             VALUES (?, ?, ?)
                             ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
                            [gameId, aiPlayerId, game.current_turn]
                        );
                    } catch (aiError) {
                        console.error('[AUTO AI] AI turn error:', aiError);
                    }
                }
            }
        } else {
            // For multiplayer: Execute AI moves for AI players that haven't moved
            for (const aiPlayerId of aiPlayerIds) {
                if (!completedPlayerIds.includes(aiPlayerId)) {
                    try {
                        await aiEngine.executeAITurn(gameId, aiPlayerId);
                        await pool.execute(
                            `INSERT INTO turn_completions (game_id, player_id, turn_number)
                             VALUES (?, ?, ?)
                             ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
                            [gameId, aiPlayerId, game.current_turn]
                        );
                    } catch (aiError) {
                        console.error('AI turn error:', aiError);
                    }
                }
            }
        }

        // Refresh completed turns after AI moves
        const [finalCompletedTurns] = await pool.execute(
            'SELECT DISTINCT player_id FROM turn_completions WHERE game_id = ? AND turn_number = ?',
            [gameId, game.current_turn]
        );
        const finalCompletedPlayerIds = finalCompletedTurns.map(t => t.player_id);

        // Recalculate national support after action to ensure it's up to date
        const updatedNationalSupport = await gameEngine.calculateNationalSupport(gameId, player.id);
        
        // Calculate ACTUAL total national support change by comparing before and after
        // passiveShiftResult.nationalSupportBefore is the support BEFORE passive shift
        // updatedNationalSupport is the support AFTER passive shift AND action
        const actualTotalNationalChange = updatedNationalSupport - passiveShiftResult.nationalSupportBefore;
        
        // Calculate action's contribution to national support
        // (This is the difference between after action and after passive shift)
        const actionNationalChange = updatedNationalSupport - passiveShiftResult.nationalSupportAfter;

        // If all players have completed
        if (finalCompletedPlayerIds.length === allPlayerIds.length) {
            // Stop the current timer
            if (stopTurnTimer) {
                stopTurnTimer(parseInt(gameId));
            }

            const completedTurnNum = game.current_turn;

            // Multiplayer with human opponents: wait for both to acknowledge
            // Multiplayer with only AI opponents: advance immediately (same as old AI games)
            const [humanOpponents] = await pool.execute(
                'SELECT 1 FROM game_players WHERE game_id = ? AND user_id IS NOT NULL AND id != ? LIMIT 1',
                [gameId, player.id]
            );
            const hasHumanOpponent = humanOpponents.length > 0;

            if (game.game_type === 'multiplayer' && hasHumanOpponent) {
                const { players: turnSummaryPlayers } = await buildTurnSummaryPlayers(parseInt(gameId, 10), completedTurnNum);
                emitToGame(gameId, 'turn_complete_pending_summary', {
                    gameId,
                    completedTurn: completedTurnNum,
                    turnSummary: { players: turnSummaryPlayers },
                    timestamp: new Date().toISOString()
                });
                res.json({
                    message: 'Turn completed. View summary and click Continue.',
                    action_result: result,
                    passive_shift: { changes: passiveShiftResult.changes, global_change: passiveShiftResult.globalChange },
                    action_national_change: actionNationalChange,
                    total_national_change: actualTotalNationalChange,
                    national_support_before: passiveShiftResult.nationalSupportBefore,
                    turn: completedTurnNum,
                    game_complete: false,
                    turn_ended: false,
                    turn_pending_summary: true,
                    national_support: updatedNationalSupport
                });
                return;
            }

            // Single/AI: advance turn immediately
            const turnResult = await gameEngine.endTurn(gameId);
            const summaryTurnNum = turnResult.newTurn - 1;
            const { players: turnSummaryPlayers } = await buildTurnSummaryPlayers(parseInt(gameId, 10), summaryTurnNum);
            emitToGame(gameId, 'turn_ended', {
                gameId,
                newTurn: turnResult.newTurn,
                gameComplete: turnResult.isComplete,
                turnSummary: { players: turnSummaryPlayers },
                timestamp: new Date().toISOString()
            });

            if (turnResult.isComplete) {
                emitToGame(gameId, 'game_complete', {
                    gameId,
                    finalTurn: turnResult.newTurn,
                    timestamp: new Date().toISOString()
                });
            } else if (game.game_type === 'multiplayer' && hasHumanOpponent) {
                startGameTurnTimer(parseInt(gameId));
            }

            res.json({
                message: 'Turn completed successfully',
                action_result: result,
                passive_shift: { changes: passiveShiftResult.changes, global_change: passiveShiftResult.globalChange },
                action_national_change: actionNationalChange,
                total_national_change: actualTotalNationalChange,
                national_support_before: passiveShiftResult.nationalSupportBefore,
                ai_moves: aiMovesExecuted.length > 0 ? aiMovesExecuted : undefined,
                turn: turnResult.newTurn,
                game_complete: turnResult.isComplete,
                turn_ended: true,
                national_support: updatedNationalSupport
            });
        } else {
            // Emit socket event: player completed turn (waiting for others)
            emitToGame(gameId, 'player_turn_completed', {
                gameId: gameId,
                playerId: player.id,
                candidateName: player.candidate_name,
                playersCompleted: finalCompletedPlayerIds.length,
                totalPlayers: allPlayerIds.length,
                currentTurn: game.current_turn,
                timestamp: new Date().toISOString()
            });

            res.json({
                message: 'Turn action completed, waiting for other players or timer',
                action_result: result,
                passive_shift: {
                    changes: passiveShiftResult.changes,
                    global_change: passiveShiftResult.globalChange
                },
                action_national_change: actionNationalChange,
                total_national_change: actualTotalNationalChange,
                national_support_before: passiveShiftResult.nationalSupportBefore,
                ai_moves: aiMovesExecuted.length > 0 ? aiMovesExecuted : undefined,
                turn: game.current_turn,
                game_complete: false,
                turn_ended: false,
                players_completed: finalCompletedPlayerIds.length,
                total_players: allPlayerIds.length,
                national_support: updatedNationalSupport
            });
        }
    } catch (error) {
        console.error('Take turn error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Acknowledge turn summary (multiplayer: both must click Continue before next turn starts)
router.post('/:gameId/acknowledge-turn-summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;

        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = games[0];
        if (game.game_type !== 'multiplayer') {
            return res.json({ acknowledged: true, turn_advanced: true });
        }

        const [players] = await pool.execute(
            'SELECT id FROM game_players WHERE game_id = ? AND user_id = ? AND is_active = TRUE',
            [gameId, userId]
        );
        if (players.length === 0) return res.status(404).json({ error: 'Not in this game' });
        const playerId = players[0].id;

        const currentTurn = game.current_turn;
        await pool.execute(
            `INSERT IGNORE INTO turn_summary_acknowledgments (game_id, turn_number, player_id)
             VALUES (?, ?, ?)`,
            [gameId, currentTurn, playerId]
        );

        const [humanPlayers] = await pool.execute(
            'SELECT id FROM game_players WHERE game_id = ? AND is_active = TRUE AND is_ai = FALSE',
            [gameId]
        );
        const [acks] = await pool.execute(
            'SELECT COUNT(DISTINCT player_id) as cnt FROM turn_summary_acknowledgments WHERE game_id = ? AND turn_number = ?',
            [gameId, currentTurn]
        );

        if (acks[0].cnt >= humanPlayers.length) {
            const turnResult = await gameEngine.endTurn(gameId);
            const { players: turnSummaryPlayers } = await buildTurnSummaryPlayers(parseInt(gameId, 10), turnResult.newTurn - 1);
            emitToGame(gameId, 'turn_ended', {
                gameId,
                newTurn: turnResult.newTurn,
                gameComplete: turnResult.isComplete,
                turnSummary: { players: turnSummaryPlayers },
                timestamp: new Date().toISOString()
            });
            if (turnResult.isComplete) {
                emitToGame(gameId, 'game_complete', {
                    gameId,
                    finalTurn: turnResult.newTurn,
                    timestamp: new Date().toISOString()
                });
            } else {
                startGameTurnTimer(parseInt(gameId));
            }
            return res.json({ acknowledged: true, turn_advanced: true });
        }
        res.json({ acknowledged: true, turn_advanced: false });
    } catch (error) {
        console.error('Acknowledge turn summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join a game by join code
router.post('/join', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { join_code, candidate_id } = req.body;

        if (!join_code || !candidate_id) {
            return res.status(400).json({ 
                error: 'join_code and candidate_id are required' 
            });
        }

        // Fetch the candidate details
        const [candidates] = await pool.execute(
            'SELECT * FROM candidates WHERE id = ?',
            [candidate_id]
        );

        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const candidate = candidates[0];
        const { name: candidate_name, ethnicity, ideology, home_region_id } = candidate;

        // Find game by join code
        const [games] = await pool.execute(
            'SELECT * FROM games WHERE join_code = ? AND status = ?',
            [join_code, 'waiting']
        );

        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found or not accepting players' });
        }

        const game = games[0];

        // Check if user already in game
        const [existingPlayers] = await pool.execute(
            'SELECT * FROM game_players WHERE game_id = ? AND user_id = ?',
            [game.id, userId]
        );

        if (existingPlayers.length > 0) {
            return res.status(400).json({ error: 'You are already in this game' });
        }

        // Check if game is full
        const [currentPlayers] = await pool.execute(
            'SELECT COUNT(*) as count FROM game_players WHERE game_id = ?',
            [game.id]
        );

        if (currentPlayers[0].count >= game.max_players) {
            return res.status(400).json({ error: 'Game is full' });
        }

        // Check if candidate is already taken in this game
        const [candidateTaken] = await pool.execute(
            'SELECT * FROM game_players WHERE game_id = ? AND candidate_id = ?',
            [game.id, candidate_id]
        );

        if (candidateTaken.length > 0) {
            return res.status(400).json({ error: 'This candidate is already taken. Please choose another.' });
        }

        // Calculate starting budget
        const player = { ethnicity, ideology, home_region_id };
        const startingBudget = await gameEngine.calculateStartingBudget(player);

        // Get next turn order
        const [maxTurnOrder] = await pool.execute(
            'SELECT MAX(turn_order) as max_order FROM game_players WHERE game_id = ?',
            [game.id]
        );
        const nextTurnOrder = (maxTurnOrder[0].max_order || 0) + 1;

        // Create player with candidate reference
        const [playerResult] = await pool.execute(
            `INSERT INTO game_players 
             (game_id, user_id, candidate_id, candidate_name, ethnicity, ideology, home_region_id, budget, charisma_points, turn_order)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [game.id, userId, candidate_id, candidate_name, ethnicity, ideology, home_region_id, startingBudget, nextTurnOrder]
        );

        const playerId = playerResult.insertId;

        // Initialize regional support
        const [regions] = await pool.execute('SELECT id FROM regions');
        for (const region of regions) {
            const initialSupport = await gameEngine.calculateInitialSupport(
                { ethnicity, ideology, home_region_id },
                region.id
            );

            await pool.execute(
                `INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
                 VALUES (?, ?, ?, ?)`,
                [game.id, playerId, region.id, initialSupport]
            );

            await pool.execute(
                `INSERT INTO support_history (game_id, player_id, region_id, turn_number, support_percentage)
                 VALUES (?, ?, ?, 0, ?)
                 ON DUPLICATE KEY UPDATE support_percentage = VALUES(support_percentage)`,
                [game.id, playerId, region.id, initialSupport]
            );
        }

        // Check if game should start (all players joined)
        const [allPlayers] = await pool.execute(
            'SELECT COUNT(*) as count FROM game_players WHERE game_id = ?',
            [game.id]
        );

        let gameStarted = false;
        if (allPlayers[0].count >= game.max_players) {
            await pool.execute(
                'UPDATE games SET status = ?, current_turn = 1, turn_started_at = NOW() WHERE id = ?',
                ['active', game.id]
            );
            await gameEngine.capRegionalSupportAt100(game.id);
            gameStarted = true;
        }

        // Emit socket event: player joined
        emitToGame(game.id, 'player_joined', {
            playerId: playerId,
            candidateName: candidate_name,
            ethnicity: ethnicity,
            ideology: ideology,
            playerCount: allPlayers[0].count,
            maxPlayers: game.max_players,
            gameStarted: gameStarted,
            timestamp: new Date().toISOString()
        });

        // If game started, also emit game_started event and start timer
        if (gameStarted) {
            // Start the turn timer for multiplayer games
            startGameTurnTimer(game.id);
            
            emitToGame(game.id, 'game_started', {
                gameId: game.id,
                currentTurn: 1,
                turnDuration: TURN_DURATION,
                timestamp: new Date().toISOString()
            });
        }

        res.status(201).json({
            message: 'Joined game successfully',
            game: { id: game.id, player_id: playerId }
        });
    } catch (error) {
        console.error('Join game error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add AI opponent to a waiting game (lobby)
router.post('/:gameId/add-ai', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = parseInt(req.params.gameId, 10);
        const { candidate_id } = req.body;

        if (!candidate_id) {
            return res.status(400).json({ error: 'candidate_id is required' });
        }

        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = games[0];

        if (game.status !== 'waiting') {
            return res.status(400).json({ error: 'Can only add AI to a game that is waiting for players' });
        }

        if (game.host_user_id !== userId) {
            return res.status(403).json({ error: 'Only the host can add AI opponents' });
        }

        const [playerCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM game_players WHERE game_id = ?',
            [gameId]
        );
        if (playerCount[0].count >= game.max_players) {
            return res.status(400).json({ error: 'Game is full' });
        }

        const [taken] = await pool.execute(
            'SELECT id FROM game_players WHERE game_id = ? AND candidate_id = ?',
            [gameId, candidate_id]
        );
        if (taken.length > 0) {
            return res.status(400).json({ error: 'This candidate is already in the game' });
        }

        const [maxOrder] = await pool.execute(
            'SELECT MAX(turn_order) as m FROM game_players WHERE game_id = ?',
            [gameId]
        );
        const turnOrder = (maxOrder[0].m || 0) + 1;

        const aiPlayerId = await createSpecificAIOpponent(gameId, candidate_id, turnOrder);
        await gameEngine.capRegionalSupportAt100(gameId);

        emitToGame(gameId, 'player_joined', {
            playerId: aiPlayerId,
            isAI: true,
            playerCount: playerCount[0].count + 1,
            maxPlayers: game.max_players,
            timestamp: new Date().toISOString()
        });

        const [allPlayers] = await pool.execute(
            `SELECT gp.id, gp.candidate_id, gp.candidate_name, gp.ethnicity, gp.ideology, gp.is_ai, c.image_url
             FROM game_players gp
             LEFT JOIN candidates c ON gp.candidate_id = c.id
             WHERE gp.game_id = ? ORDER BY gp.turn_order`,
            [gameId]
        );

        res.json({
            message: 'AI opponent added',
            players: allPlayers.map(p => ({
                id: p.id,
                candidate_id: p.candidate_id,
                candidate_name: p.candidate_name,
                ethnicity: p.ethnicity,
                ideology: p.ideology,
                is_ai: p.is_ai === 1 || p.is_ai === true,
                image_url: p.image_url
            }))
        });
    } catch (error) {
        console.error('Add AI error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Start game (host only, when at least 2 players)
router.post('/:gameId/start', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = parseInt(req.params.gameId, 10);

        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = games[0];

        if (game.status !== 'waiting') {
            return res.status(400).json({ error: 'Game is already started or finished' });
        }

        if (game.host_user_id !== userId) {
            return res.status(403).json({ error: 'Only the host can start the game' });
        }

        const [playerCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM game_players WHERE game_id = ?',
            [gameId]
        );
        if (playerCount[0].count < 2) {
            return res.status(400).json({ error: 'Add at least one opponent (AI or invite a player) before starting' });
        }

        await pool.execute(
            'UPDATE games SET status = ?, turn_started_at = NOW() WHERE id = ?',
            ['active', gameId]
        );

        const [humanOppCheck] = await pool.execute(
            'SELECT 1 FROM game_players WHERE game_id = ? AND user_id IS NOT NULL AND user_id != ? LIMIT 1',
            [gameId, userId]
        );
        if (humanOppCheck.length > 0) {
            startGameTurnTimer(gameId);
        }

        emitToGame(gameId, 'game_started', {
            gameId,
            currentTurn: 1,
            timestamp: new Date().toISOString()
        });

        res.json({
            message: 'Game started',
            game: { id: gameId, status: 'active' }
        });
    } catch (error) {
        console.error('Start game error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get lobby data (lightweight, for waiting games)
router.get('/:gameId/lobby', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = parseInt(req.params.gameId, 10);

        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) return res.status(404).json({ error: 'Game not found' });
        const game = games[0];

        const [userPlayer] = await pool.execute(
            'SELECT id FROM game_players WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );
        if (userPlayer.length === 0) return res.status(403).json({ error: 'You are not in this game' });

        const [allPlayers] = await pool.execute(
            `SELECT gp.id, gp.candidate_id, gp.user_id, gp.candidate_name, gp.ethnicity, gp.ideology, gp.is_ai, c.image_url
             FROM game_players gp
             LEFT JOIN candidates c ON gp.candidate_id = c.id
             WHERE gp.game_id = ? ORDER BY gp.turn_order`,
            [gameId]
        );

        res.json({
            join_code: game.join_code,
            max_players: game.max_players,
            status: game.status,
            players: allPlayers.map(p => ({
                id: p.id,
                candidate_id: p.candidate_id,
                candidate_name: p.candidate_name,
                ethnicity: p.ethnicity,
                ideology: p.ideology,
                is_ai: p.is_ai === 1 || p.is_ai === true,
                image_url: p.image_url,
                is_me: p.user_id === userId
            }))
        });
    } catch (error) {
        console.error('Lobby error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all players in a game
router.get('/:gameId/players', authenticateToken, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const userId = req.user.userId;

        // Verify user is in game
        const [players] = await pool.execute(
            'SELECT * FROM game_players WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'You are not in this game' });
        }

        // Get all players
        const [allPlayersRaw] = await pool.execute(
            `SELECT gp.*, u.username
             FROM game_players gp
             LEFT JOIN users u ON gp.user_id = u.id
             WHERE gp.game_id = ?
             ORDER BY gp.turn_order`,
            [gameId]
        );

        // Calculate population-weighted national support for each player
        const allPlayers = await Promise.all(
            allPlayersRaw.map(async (p) => {
                const nationalSupport = await gameEngine.calculateNationalSupport(gameId, p.id);
                return {
                    ...p,
                    national_support: nationalSupport
                };
            })
        );

        res.json({
            players: allPlayers.map(p => ({
                id: p.id,
                candidate_name: p.candidate_name,
                username: p.username || 'AI Opponent',
                ethnicity: p.ethnicity,
                ideology: p.ideology,
                budget: parseFloat(p.budget),
                charisma_points: p.charisma_points,
                national_support: parseFloat(p.national_support || 0),
                is_ai: p.is_ai,
                turn_order: p.turn_order
            }))
        });
    } catch (error) {
        console.error('Get players error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get spending history for a player
router.get('/:gameId/spending', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;

        // Verify player access
        const [players] = await pool.execute(
            'SELECT * FROM game_players WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'Player not found in this game' });
        }

        const player = players[0];

        // Get spending history
        const [spending] = await pool.execute(
            `SELECT sh.*, a.name as action_name, a.type as action_type
             FROM spending_history sh
             LEFT JOIN actions a ON sh.action_id = a.id
             WHERE sh.game_id = ? AND sh.player_id = ?
             ORDER BY sh.turn_number DESC, sh.created_at DESC`,
            [gameId, player.id]
        );

        res.json({
            spending: spending.map(s => ({
                id: s.id,
                turn_number: s.turn_number,
                action_name: s.action_name || s.description,
                action_type: s.action_type,
                amount: parseFloat(s.amount),
                type: s.type,
                description: s.description,
                created_at: s.created_at
            }))
        });
    } catch (error) {
        console.error('Get spending error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get turn summary/achievements
router.get('/:gameId/turn-summary', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;
        const turnNumber = parseInt(req.query.turn) || null;

        // Verify player access
        const [players] = await pool.execute(
            'SELECT * FROM game_players WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'Player not found in this game' });
        }

        const player = players[0];
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        const game = games[0];

        const targetTurn = turnNumber || game.current_turn;

        async function fetchTurnActions(turnNumber) {
            const [actions] = await pool.execute(
                `SELECT ah.*, a.name as action_name, a.type as action_type, r.name as region_name
                 FROM action_history ah
                 JOIN actions a ON ah.action_id = a.id
                 LEFT JOIN regions r ON ah.region_id = r.id
                 WHERE ah.game_id = ? AND ah.player_id = ? AND ah.turn_number = ?
                 ORDER BY ah.id DESC`,
                [gameId, player.id, turnNumber]
            );
            return actions;
        }

        async function fetchActionSupportChanges(turnNumber) {
            // Get all actions (both local and global)
            const [supportActionRows] = await pool.execute(
                `SELECT ah.region_id, ah.effect_applied, r.name as region_name
                 FROM action_history ah
                 LEFT JOIN regions r ON ah.region_id = r.id
                 WHERE ah.game_id = ? AND ah.player_id = ? AND ah.turn_number = ?
                 ORDER BY ah.id DESC`,
                [gameId, player.id, turnNumber]
            );

            const supportChangeMap = new Map();
            for (const row of supportActionRows) {
                let effect = {};
                try {
                    effect = typeof row.effect_applied === 'string'
                        ? JSON.parse(row.effect_applied || '{}')
                        : (row.effect_applied || {});
                } catch (e) {
                    effect = {};
                }

                // Handle global campaigns (TV, Social Media, Radio)
                if (effect.global === true && effect.regions && Array.isArray(effect.regions)) {
                    // For global campaigns, use the national support change if available
                    // This is the population-weighted change, not the sum of regional changes
                    if (effect.nationalSupportChange !== undefined) {
                        // Use a special key to ensure we only add this once per global campaign
                        // and it represents the actual national support change
                        if (!supportChangeMap.has('GLOBAL_NATIONAL')) {
                            supportChangeMap.set('GLOBAL_NATIONAL', {
                                region_name: 'National Support',
                                previous_support: 0, // Not used for display
                                current_support: 0, // Not used for display
                                change: parseFloat(effect.nationalSupportChange)
                            });
                        }
                    } else {
                        // Fallback: sum regional changes (for older data that doesn't have nationalSupportChange)
                        let totalRegionalChange = 0;
                        for (const regionResult of effect.regions) {
                            if (regionResult.oldSupport !== undefined && regionResult.newSupport !== undefined) {
                                totalRegionalChange += parseFloat(regionResult.newSupport) - parseFloat(regionResult.oldSupport);
                            }
                        }
                        if (totalRegionalChange !== 0 && !supportChangeMap.has('GLOBAL_NATIONAL')) {
                            supportChangeMap.set('GLOBAL_NATIONAL', {
                                region_name: 'National Support',
                                previous_support: 0,
                                current_support: 0,
                                change: totalRegionalChange
                            });
                        }
                    }
                }
                // Handle local campaigns and other actions with region_id
                else if (row.region_id && effect.oldSupport !== undefined && effect.newSupport !== undefined) {
                    if (supportChangeMap.has(row.region_id)) {
                        continue; // Skip if already processed
                    }

                    supportChangeMap.set(row.region_id, {
                        region_name: row.region_name || 'Unknown Region',
                        previous_support: parseFloat(effect.oldSupport),
                        current_support: parseFloat(effect.newSupport),
                        change: parseFloat(effect.newSupport) - parseFloat(effect.oldSupport)
                    });
                }
            }

            return Array.from(supportChangeMap.values());
        }

        async function fetchSnapshotSupportChanges(turnNumber) {
            const [currentRows] = await pool.execute(
                `SELECT sh.region_id, sh.support_percentage, r.name as region_name
                 FROM support_history sh
                 JOIN regions r ON sh.region_id = r.id
                 WHERE sh.game_id = ? AND sh.player_id = ? AND sh.turn_number = ?`,
                [gameId, player.id, turnNumber]
            );

            if (currentRows.length === 0) return [];

            const [previousRows] = await pool.execute(
                `SELECT region_id, support_percentage
                 FROM support_history
                 WHERE game_id = ? AND player_id = ? AND turn_number = ?`,
                [gameId, player.id, Math.max(turnNumber - 1, 0)]
            );

            const previousMap = new Map(
                previousRows.map(r => [r.region_id, parseFloat(r.support_percentage)])
            );

            return currentRows.map(row => {
                const currentSupport = parseFloat(row.support_percentage);
                const previousSupport = previousMap.has(row.region_id)
                    ? previousMap.get(row.region_id)
                    : currentSupport;
                return {
                    region_name: row.region_name || 'Unknown Region',
                    previous_support: previousSupport,
                    current_support: currentSupport,
                    change: currentSupport - previousSupport
                };
            });
        }

        let resolvedTurn = targetTurn;
        let actions = await fetchTurnActions(resolvedTurn);
        
        // Prioritize action-based changes (more accurate) over snapshot-based changes
        let supportChanges = await fetchActionSupportChanges(resolvedTurn);
        let supportChangesNote = supportChanges.length > 0
            ? 'Support changes from actions.'
            : '';

        // If no action-based changes, fall back to snapshot-based changes
        if (supportChanges.length === 0) {
            supportChanges = await fetchSnapshotSupportChanges(resolvedTurn);
            supportChangesNote = supportChanges.length > 0
                ? 'Support changes include passive shifts and actions.'
                : '';
        }

        // Handle 1-based UI vs 0-based stored turns
        if (actions.length === 0 && supportChanges.length === 0 && targetTurn > 0) {
            const fallbackTurn = targetTurn - 1;
            const fallbackActions = await fetchTurnActions(fallbackTurn);
            if (fallbackActions.length > 0) {
                resolvedTurn = fallbackTurn;
                actions = fallbackActions;
                
                // Try action-based first, then snapshot-based
                supportChanges = await fetchActionSupportChanges(fallbackTurn);
                if (supportChanges.length === 0) {
                    supportChanges = await fetchSnapshotSupportChanges(fallbackTurn);
                }
                supportChangesNote = supportChanges.length > 0
                    ? (supportChanges.length > 0 && supportChanges[0].region_name === 'National Support' 
                        ? 'Support changes from actions.' 
                        : 'Support changes include passive shifts and actions.')
                    : '';
            }
        }

        res.json({
            turn: targetTurn,
            resolved_turn: resolvedTurn,
            actions: actions.map(a => {
                const effect = typeof a.effect_applied === 'string' ? JSON.parse(a.effect_applied || '{}') : (a.effect_applied || {});
                return {
                    action_name: a.action_name,
                    action_type: a.action_type,
                    region_name: effect.global ? 'All regions' : (a.region_name || 'N/A'),
                    spending_amount: parseFloat(a.spending_amount || 0),
                    effect_applied: effect
                };
            }),
            support_changes: supportChanges,
            support_changes_note: supportChangesNote
        });
    } catch (error) {
        console.error('Get turn summary error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get dashboard data (all players' states)
router.get('/:gameId/dashboard', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;

        // Verify player access
        const [players] = await pool.execute(
            'SELECT * FROM game_players WHERE game_id = ? AND user_id = ?',
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'Player not found in this game' });
        }

        // Get game info
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        const game = games[0];

        // Get all players
        const [allPlayersRaw] = await pool.execute(
            `SELECT gp.*, u.username,
             COALESCE(gp.is_ai, FALSE) as is_ai
             FROM game_players gp
             LEFT JOIN users u ON gp.user_id = u.id
             WHERE gp.game_id = ?
             ORDER BY gp.turn_order`,
            [gameId]
        );

        // Calculate population-weighted national support for each player
        const allPlayers = await Promise.all(
            allPlayersRaw.map(async (p) => {
                const nationalSupport = await gameEngine.calculateNationalSupport(gameId, p.id);
                return {
                    ...p,
                    national_support: nationalSupport
                };
            })
        );

        console.log(`Dashboard: Found ${allPlayers.length} players for game ${gameId}`);
        allPlayers.forEach(p => {
            console.log(`  - Player ${p.id}: ${p.candidate_name}, is_ai: ${p.is_ai}, user_id: ${p.user_id}`);
        });

        // Get spending totals per player
        const [spendingTotals] = await pool.execute(
            `SELECT player_id, 
             SUM(CASE WHEN type = 'spent' THEN amount ELSE 0 END) as total_spent,
             SUM(CASE WHEN type = 'earned' THEN amount ELSE 0 END) as total_earned
             FROM spending_history
             WHERE game_id = ?
             GROUP BY player_id`,
            [gameId]
        );

        const spendingMap = {};
        for (const s of spendingTotals) {
            spendingMap[s.player_id] = {
                total_spent: parseFloat(s.total_spent || 0),
                total_earned: parseFloat(s.total_earned || 0)
            };
        }

        res.json({
            game: {
                id: game.id,
                status: game.status,
                current_turn: game.current_turn,
                max_turns: game.max_turns,
                game_type: game.game_type,
                join_code: game.join_code
            },
            players: allPlayers.map(p => ({
                id: p.id,
                candidate_name: p.candidate_name,
                username: p.username || (p.is_ai ? 'AI Opponent' : 'Unknown'),
                ethnicity: p.ethnicity,
                ideology: p.ideology,
                budget: parseFloat(p.budget),
                charisma_points: p.charisma_points,
                national_support: parseFloat(p.national_support || 0),
                is_ai: p.is_ai === 1 || p.is_ai === true || p.user_id === null,
                turn_order: p.turn_order,
                spending: spendingMap[p.id] || { total_spent: 0, total_earned: 0 }
            }))
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a game
router.delete('/:gameId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const gameId = req.params.gameId;

        // Verify user is the host
        const [games] = await pool.execute(
            'SELECT * FROM games WHERE id = ? AND host_user_id = ?',
            [gameId, userId]
        );

        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found or you are not the host' });
        }

        // Emit to game room before delete so connected clients get real-time update
        if (typeof emitToGame === 'function') {
            emitToGame(gameId, 'game_deleted', { gameId, message: 'Game was deleted' });
        }
        // Broadcast to all so GamesList can refresh (clients may not be in game room)
        if (io) {
            io.emit('game_deleted', { gameId });
        }

        // Delete game (cascade will handle related records)
        await pool.execute('DELETE FROM games WHERE id = ?', [gameId]);

        res.json({ success: true, message: 'Game deleted successfully' });
    } catch (error) {
        console.error('Delete game error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get regions
router.get('/regions/all', authenticateToken, async (req, res) => {
    try {
        const [regions] = await pool.execute('SELECT * FROM regions ORDER BY name');
        
        res.json({
            regions: regions.map(r => ({
                id: r.id,
                name: r.name,
                code: r.code,
                population: r.population,
                bosniak_pop: r.bosniak_pop,
                croat_pop: r.croat_pop,
                serb_pop: r.serb_pop,
                other_pop: r.other_pop,
                conservative_share: parseFloat(r.conservative_share),
                liberal_share: parseFloat(r.liberal_share),
                socialist_share: parseFloat(r.socialist_share),
                administrative_importance: r.administrative_importance
            }))
        });
    } catch (error) {
        console.error('Get regions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get election results for a completed game
router.get('/:gameId/election', authenticateToken, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const userId = req.user.userId;

        // Check if user is part of this game
        const [players] = await pool.execute(
            `SELECT * FROM game_players WHERE game_id = ? AND user_id = ?`,
            [gameId, userId]
        );

        if (players.length === 0) {
            return res.status(404).json({ error: 'Game not found or access denied' });
        }

        // Get game status and election data
        let games;
        try {
            [games] = await pool.execute(
                'SELECT status, voter_turnout, total_voters FROM games WHERE id = ?', 
                [gameId]
            );
        } catch (colError) {
            // Columns might not exist, try without them
            console.log(`[ELECTION GET] voter_turnout/total_voters columns may not exist, trying without them`);
            [games] = await pool.execute('SELECT status FROM games WHERE id = ?', [gameId]);
        }
        
        if (games.length === 0) {
            return res.status(404).json({ error: 'Game not found' });
        }

        const game = games[0];
        if (game.status !== 'completed') {
            return res.status(400).json({ error: 'Game is not completed yet' });
        }

        // Get election results
        let results = [];
        try {
            const [resultsQuery] = await pool.execute(
                `SELECT er.*, gp.ethnicity, gp.ideology, gp.is_ai
                 FROM election_results er
                 JOIN game_players gp ON er.player_id = gp.id
                 WHERE er.game_id = ?
                 ORDER BY er.votes DESC`,
                [gameId]
            );
            results = resultsQuery;
            console.log(`[ELECTION GET] Found ${results.length} existing election results`);
        } catch (tableError) {
            console.log(`[ELECTION GET] election_results table doesn't exist yet:`, tableError.message);
            // Table doesn't exist, will create it during calculation
            results = [];
        }

        if (results.length === 0) {
            console.log(`[ELECTION GET] No results found, calculating election...`);
            // Calculate election if not already calculated
            const electionData = await gameEngine.calculatePresidentialElection(gameId);
            
            if (!electionData) {
                console.error(`[ELECTION GET] Election calculation returned null/undefined`);
                return res.status(500).json({ error: 'Failed to calculate election results' });
            }
            
            try {
                const [newResults] = await pool.execute(
                    `SELECT er.*, gp.ethnicity, gp.ideology, gp.is_ai
                     FROM election_results er
                     JOIN game_players gp ON er.player_id = gp.id
                     WHERE er.game_id = ?
                     ORDER BY er.votes DESC`,
                    [gameId]
                );
                console.log(`[ELECTION GET] Retrieved ${newResults.length} results after calculation`);
                return res.json({
                    results: newResults.map(r => ({
                        player_id: r.player_id,
                        candidate_name: r.candidate_name,
                        ethnicity: r.ethnicity,
                        ideology: r.ideology,
                        is_ai: r.is_ai,
                        votes: r.votes,
                        vote_percentage: parseFloat(r.vote_percentage),
                        support_percentage: parseFloat(r.support_percentage),
                        is_winner: r.is_winner === 1
                    })),
                    total_voters: electionData.total_voters,
                    voter_turnout: electionData.voter_turnout,
                    winner: newResults.find(r => r.is_winner === 1)
                });
            } catch (queryError) {
                console.error(`[ELECTION GET] Error querying results after calculation:`, queryError);
                throw queryError;
            }
        }

        // Get total voters and voter turnout from game or calculate from results
        const totalVoters = game.total_voters || results.reduce((sum, r) => sum + r.votes, 0);
        const voterTurnout = game.voter_turnout || (totalVoters > 0 ? 
            (totalVoters / (totalVoters / (results[0].vote_percentage / 100))) : 0);

        res.json({
            results: results.map(r => ({
                player_id: r.player_id,
                candidate_name: r.candidate_name,
                ethnicity: r.ethnicity,
                ideology: r.ideology,
                is_ai: r.is_ai,
                votes: r.votes,
                vote_percentage: parseFloat(r.vote_percentage),
                support_percentage: parseFloat(r.support_percentage),
                is_winner: r.is_winner === 1
            })),
            total_voters: totalVoters,
            voter_turnout: voterTurnout,
            winner: results.find(r => r.is_winner === 1)
        });
    } catch (error) {
        console.error('[ELECTION GET] Error getting election results:');
        console.error('[ELECTION GET] Error message:', error.message);
        console.error('[ELECTION GET] Error stack:', error.stack);
        console.error('[ELECTION GET] Error details:', {
            name: error.name,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });
        res.status(500).json({ 
            error: error.sqlMessage || error.message || 'Internal server error',
            message: error.message,
            sqlError: error.sqlMessage,
            code: error.code
        });
    }
});

// Initialize/Calculate election results manually
router.post('/:gameId/election/initialize', authenticateToken, async (req, res) => {
    try {
        const gameId = req.params.gameId;
        const userId = req.user.userId;

        console.log(`[ELECTION INIT] Starting election initialization for game ${gameId}, user ${userId}`);

        // Check if user is part of this game
        const [players] = await pool.execute(
            `SELECT * FROM game_players WHERE game_id = ? AND user_id = ?`,
            [gameId, userId]
        );

        if (players.length === 0) {
            console.log(`[ELECTION INIT] User ${userId} not found in game ${gameId}`);
            return res.status(404).json({ error: 'Game not found or access denied' });
        }

        console.log(`[ELECTION INIT] User ${userId} found in game ${gameId}`);

        // Get game status
        const [games] = await pool.execute('SELECT status, current_turn, max_turns FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) {
            console.log(`[ELECTION INIT] Game ${gameId} not found`);
            return res.status(404).json({ error: 'Game not found' });
        }

        const game = games[0];
        console.log(`[ELECTION INIT] Game ${gameId}: status=${game.status}, current_turn=${game.current_turn}, max_turns=${game.max_turns}`);
        
        // Only allow if game is completed or at max turns
        if (game.status !== 'completed' && game.current_turn < game.max_turns) {
            console.log(`[ELECTION INIT] Game ${gameId} not ready for election: status=${game.status}, turn=${game.current_turn}/${game.max_turns}`);
            return res.status(400).json({ error: 'Game must be completed or at max turns to initialize election' });
        }

        console.log(`[ELECTION INIT] Calculating election for game ${gameId}...`);
        
        // Calculate election results
        const electionData = await gameEngine.calculatePresidentialElection(gameId);
        
        console.log(`[ELECTION INIT] Election calculated successfully:`, {
            total_voters: electionData?.total_voters,
            voter_turnout: electionData?.voter_turnout,
            results_count: electionData?.results?.length,
            winner: electionData?.winner?.candidate_name
        });
        
        // Get updated results
        const [results] = await pool.execute(
            `SELECT er.*, gp.ethnicity, gp.ideology, gp.is_ai
             FROM election_results er
             JOIN game_players gp ON er.player_id = gp.id
             WHERE er.game_id = ?
             ORDER BY er.votes DESC`,
            [gameId]
        );

        console.log(`[ELECTION INIT] Retrieved ${results.length} election results from database`);

        const responseData = {
            message: 'Election results calculated successfully',
            election: {
                results: results.map(r => ({
                    player_id: r.player_id,
                    candidate_name: r.candidate_name,
                    ethnicity: r.ethnicity,
                    ideology: r.ideology,
                    is_ai: r.is_ai,
                    votes: r.votes,
                    vote_percentage: parseFloat(r.vote_percentage),
                    support_percentage: parseFloat(r.support_percentage),
                    is_winner: r.is_winner === 1
                })),
                total_voters: electionData?.total_voters || 0,
                voter_turnout: electionData?.voter_turnout || 0,
                winner: results.find(r => r.is_winner === 1)
            }
        };

        console.log(`[ELECTION INIT] Sending response with ${responseData.election.results.length} results`);
        res.json(responseData);
    } catch (error) {
        console.error('[ELECTION INIT] Error initializing election:');
        console.error('[ELECTION INIT] Error message:', error.message);
        console.error('[ELECTION INIT] Error stack:', error.stack);
        console.error('[ELECTION INIT] Error details:', {
            name: error.name,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            errno: error.errno
        });
        
        const errorMessage = error.sqlMessage || error.message || 'Internal server error';
        res.status(500).json({ 
            error: errorMessage,
            message: error.message,
            sqlError: error.sqlMessage,
            code: error.code,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Function to handle timer expiration (called from server.js)
export async function handleTimerExpiration(gameId) {
    try {
        console.log(`[TIMER EXPIRED] Processing turn end for game ${gameId}`);
        
        // Get game info
        const [games] = await pool.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) {
            console.log(`[TIMER EXPIRED] Game ${gameId} not found`);
            return;
        }
        
        const game = games[0];
        
        if (game.status !== 'active') {
            console.log(`[TIMER EXPIRED] Game ${gameId} is not active, skipping`);
            return;
        }
        
        // Get all active players
        const [allPlayers] = await pool.execute(
            'SELECT id, is_ai, user_id, candidate_name FROM game_players WHERE game_id = ? AND is_active = TRUE',
            [gameId]
        );
        
        // Apply passive shift for players who didn't move
        const [completedTurns] = await pool.execute(
            'SELECT DISTINCT player_id FROM turn_completions WHERE game_id = ? AND turn_number = ?',
            [gameId, game.current_turn]
        );
        const completedPlayerIds = completedTurns.map(t => t.player_id);
        
        // Mark turn as completed for players who didn't move (they get passive shift only)
        for (const player of allPlayers) {
            if (!completedPlayerIds.includes(player.id)) {
                console.log(`[TIMER EXPIRED] Player ${player.id} (${player.candidate_name}) didn't move, applying passive shift only`);
                
                // Apply passive shift for this player
                await gameEngine.applyPassiveShift(gameId, player.id);
                
                // Record turn completion
                await pool.execute(
                    `INSERT INTO turn_completions (game_id, player_id, turn_number)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP`,
                    [gameId, player.id, game.current_turn]
                );
            }
        }
        
        const completedTurnNum = game.current_turn;

        if (game.game_type === 'multiplayer') {
            const { players: turnSummaryPlayers } = await buildTurnSummaryPlayers(parseInt(gameId, 10), completedTurnNum);
            emitToGame(gameId, 'turn_complete_pending_summary', {
                gameId,
                completedTurn: completedTurnNum,
                turnSummary: { players: turnSummaryPlayers },
                reason: 'timer_expired',
                timestamp: new Date().toISOString()
            });
            return;
        }

        const turnResult = await gameEngine.endTurn(gameId);
        const summaryTurnNum = turnResult.newTurn - 1;
        const { players: turnSummaryPlayers } = await buildTurnSummaryPlayers(parseInt(gameId, 10), summaryTurnNum);
        emitToGame(gameId, 'turn_ended', {
            gameId,
            newTurn: turnResult.newTurn,
            gameComplete: turnResult.isComplete,
            reason: 'timer_expired',
            turnSummary: { players: turnSummaryPlayers },
            timestamp: new Date().toISOString()
        });
        if (turnResult.isComplete) {
            emitToGame(gameId, 'game_complete', {
                gameId,
                finalTurn: turnResult.newTurn,
                timestamp: new Date().toISOString()
            });
        } else {
            startGameTurnTimer(parseInt(gameId));
        }
        
    } catch (error) {
        console.error(`[TIMER EXPIRED] Error handling timer expiration for game ${gameId}:`, error);
    }
}

// Shared: build turn-summary players array for a game and turn (used by API and by turn_ended socket)
async function buildTurnSummaryPlayers(gameIdInt, turnNumber) {
    const [players] = await pool.execute(
        `SELECT gp.id, gp.candidate_id, gp.candidate_name, gp.budget, c.ethnicity
         FROM game_players gp
         LEFT JOIN candidates c ON gp.candidate_id = c.id
         WHERE gp.game_id = ? AND gp.is_active = TRUE`,
        [gameIdInt]
    );
    let [actions] = await pool.execute(
        `SELECT ah.player_id, ah.action_id, ah.region_id, ah.spending_amount, ah.effect_applied,
                a.name as action_name, a.type as action_type, r.name as region_name, r.code as region_code
         FROM action_history ah
         JOIN actions a ON ah.action_id = a.id
         LEFT JOIN regions r ON ah.region_id = r.id
         WHERE ah.game_id = ? AND ah.turn_number = ?
         ORDER BY ah.player_id, ah.id`,
        [gameIdInt, turnNumber]
    );
    let turnUsed = turnNumber;
    if (actions.length === 0 && turnNumber > 1) {
        const [actionsPrev] = await pool.execute(
            `SELECT ah.player_id, ah.action_id, ah.region_id, ah.spending_amount, ah.effect_applied,
                    a.name as action_name, a.type as action_type, r.name as region_name, r.code as region_code
             FROM action_history ah JOIN actions a ON ah.action_id = a.id
             LEFT JOIN regions r ON ah.region_id = r.id
             WHERE ah.game_id = ? AND ah.turn_number = ? ORDER BY ah.player_id, ah.id`,
            [gameIdInt, turnNumber - 1]
        );
        if (actionsPrev.length > 0) {
            actions = actionsPrev;
            turnUsed = turnNumber - 1;
        }
    }
    const playerActions = {};
    for (const player of players) {
        const pid = Number(player.id);
        playerActions[pid] = {
            player_id: pid,
            candidate_name: player.candidate_name,
            ethnicity: player.ethnicity,
            actions: [],
            totalSpent: 0,
            totalEarned: 0,
            regionActions: {}
        };
    }
    for (const action of actions) {
        const pid = action.player_id != null ? Number(action.player_id) : null;
        if (pid == null || !playerActions[pid]) continue;
        const pa = playerActions[pid];
        let effect = {};
        try {
            effect = typeof action.effect_applied === 'string'
                ? JSON.parse(action.effect_applied || '{}') : (action.effect_applied || {});
        } catch (e) {}
        const actionInfo = {
            action_id: action.action_id,
            action_name: action.action_name,
            action_type: action.action_type,
            region_id: action.region_id,
            region_name: action.region_name,
            region_code: action.region_code,
            spending: action.spending_amount || 0,
            earned: effect.moneyEarned || 0,
            support_change: effect.supportChange || effect.nationalSupportChange || 0,
            effect: effect
        };
        pa.actions.push(actionInfo);
        if (action.action_type === 'fundraising' && effect.moneyEarned) pa.totalEarned += effect.moneyEarned;
        else if (action.spending_amount) pa.totalSpent += parseFloat(action.spending_amount);
        if (action.region_id != null) {
            const rid = Number(action.region_id);
            pa.regionActions[rid] = actionInfo;
            pa.regionActions[String(rid)] = actionInfo;
        } else if (effect.global && effect.regions) {
            for (const regionEffect of effect.regions) {
                const rawId = regionEffect.region_id || regionEffect.regionId;
                if (rawId != null) {
                    const rid = Number(rawId);
                    const info = { ...actionInfo, support_change: regionEffect.supportChange || regionEffect.actualGain || 0 };
                    pa.regionActions[rid] = info;
                    pa.regionActions[String(rid)] = info;
                }
            }
        }
    }
    return { players: Object.values(playerActions), turnUsed };
}

// Get turn summary with all player actions for a specific turn
router.get('/:id/turn-summary/:turnNumber', authenticateToken, async (req, res) => {
    try {
        const gameIdInt = parseInt(String(req.params.id), 10);
        const turnNumber = parseInt(req.params.turnNumber, 10);
        if (isNaN(gameIdInt) || gameIdInt < 1 || isNaN(turnNumber) || turnNumber < 1) {
            return res.status(400).json({ error: 'Invalid game id or turn number' });
        }
        const { players, turnUsed } = await buildTurnSummaryPlayers(gameIdInt, turnNumber);
        res.json({ turn: turnUsed, players });
    } catch (error) {
        console.error('Error fetching turn summary:', error);
        res.status(500).json({ error: 'Failed to fetch turn summary' });
    }
});

export default router;
