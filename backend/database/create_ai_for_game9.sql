-- Manually create AI opponent for game 9
USE outvoted;

-- Get game info
SELECT id, game_type, status FROM games WHERE id = 9;

-- First, check if user_id column allows NULL
-- If not, we need to make it nullable or use a workaround

-- Create AI player for game 9
SET @home_region = (SELECT id FROM regions ORDER BY RAND() LIMIT 1);

INSERT INTO game_players 
(game_id, user_id, candidate_name, ethnicity, ideology, home_region_id, budget, charisma_points, turn_order, is_ai)
VALUES (
    9,
    NULL,  -- AI players have NULL user_id
    'Dr. Marko Petrovic',
    'Croat',
    'Liberal',
    @home_region,
    500000,
    0,
    2,
    TRUE
);

-- Get the AI player ID
SET @ai_player_id = LAST_INSERT_ID();

-- Initialize regional support for AI
INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
SELECT 
    9 as game_id,
    @ai_player_id as player_id,
    r.id as region_id,
    0.20 as support_percentage
FROM regions r;

-- Verify AI was created
SELECT id, candidate_name, is_ai, user_id, ethnicity, ideology 
FROM game_players 
WHERE game_id = 9;
