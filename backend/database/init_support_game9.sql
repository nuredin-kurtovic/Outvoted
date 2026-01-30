-- Initialize regional support for game 9 players
USE outvoted;

-- Check game exists
SELECT id, status FROM games WHERE id = 9;

-- Get player info
SELECT id, candidate_name, ethnicity, ideology, home_region_id FROM game_players WHERE game_id = 9;

-- Initialize for player 9 (Bake)
SET @player9_id = 9;
SET @player9_home = (SELECT home_region_id FROM game_players WHERE id = @player9_id);

INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
SELECT 
    9,
    @player9_id,
    r.id,
    IF(r.id = @player9_home, 0.23, 0.20)
FROM regions r;

-- Initialize for player 10 (AI)
SET @player10_id = 10;
SET @player10_home = (SELECT home_region_id FROM game_players WHERE id = @player10_id);

INSERT INTO regional_support (game_id, player_id, region_id, support_percentage)
SELECT 
    9,
    @player10_id,
    r.id,
    IF(r.id = @player10_home, 0.23, 0.20)
FROM regions r;

-- Verify
SELECT 
    rs.player_id,
    gp.candidate_name,
    COUNT(*) as regions_initialized
FROM regional_support rs
JOIN game_players gp ON rs.player_id = gp.id
WHERE rs.game_id = 9
GROUP BY rs.player_id;
