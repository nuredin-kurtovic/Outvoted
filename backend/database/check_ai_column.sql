-- Check if is_ai column exists
USE outvoted;

-- This will show an error if column doesn't exist
SELECT is_ai FROM game_players LIMIT 1;
