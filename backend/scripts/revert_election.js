import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function revertElection(gameId) {
    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'outvoted'
        });

        console.log(`[REVERT] Connecting to database...`);
        console.log(`[REVERT] Reverting election for game ${gameId}...`);

        // Check if election results exist
        const [existingResults] = await connection.execute(
            'SELECT COUNT(*) as count FROM election_results WHERE game_id = ?',
            [gameId]
        );

        console.log(`[REVERT] Found ${existingResults[0].count} election results for game ${gameId}`);

        // Delete election results
        const [deleteResult] = await connection.execute(
            'DELETE FROM election_results WHERE game_id = ?',
            [gameId]
        );

        console.log(`[REVERT] Deleted ${deleteResult.affectedRows} election result(s)`);

        // Reset voter_turnout and total_voters in games table
        const [updateResult] = await connection.execute(
            'UPDATE games SET voter_turnout = NULL, total_voters = NULL WHERE id = ?',
            [gameId]
        );

        console.log(`[REVERT] Reset voter_turnout and total_voters for game ${gameId} (${updateResult.affectedRows} row(s) affected)`);

        // Check game status - if it's completed, we might want to keep it completed
        // but the user can manually change it if needed
        const [gameStatus] = await connection.execute(
            'SELECT status, current_turn, max_turns FROM games WHERE id = ?',
            [gameId]
        );

        if (gameStatus.length > 0) {
            const game = gameStatus[0];
            console.log(`[REVERT] Game ${gameId} status: ${game.status}, turn: ${game.current_turn}/${game.max_turns}`);
        }

        console.log(`[REVERT] Successfully reverted election for game ${gameId}!`);
        console.log(`[REVERT] You can now initialize the election again.`);

    } catch (error) {
        console.error('[REVERT] Error reverting election:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('[REVERT] Database connection closed');
        }
    }
}

// Get game ID from command line argument
const gameId = process.argv[2];

if (!gameId) {
    console.error('Usage: node revert_election.js <gameId>');
    process.exit(1);
}

revertElection(parseInt(gameId))
    .then(() => {
        console.log('[REVERT] Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('[REVERT] Failed:', error);
        process.exit(1);
    });
