-- Fix existing AI players (set is_ai = TRUE for players with NULL user_id)
USE outvoted;

-- Update players with NULL user_id to have is_ai = TRUE
UPDATE game_players 
SET is_ai = TRUE 
WHERE user_id IS NULL AND (is_ai IS NULL OR is_ai = FALSE);

-- Show updated players
SELECT id, game_id, candidate_name, is_ai, user_id 
FROM game_players 
WHERE is_ai = TRUE OR user_id IS NULL
ORDER BY id DESC
LIMIT 10;
