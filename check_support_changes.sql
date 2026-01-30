-- Check if support is actually changing in the database
USE outvoted;

-- Show recent action history
SELECT 
    ah.id,
    ah.turn_number,
    gp.candidate_name,
    a.name as action_name,
    r.name as region_name,
    ah.effect_applied,
    rs.support_percentage as current_support
FROM action_history ah
JOIN game_players gp ON ah.player_id = gp.id
JOIN actions a ON ah.action_id = a.id
LEFT JOIN regions r ON ah.region_id = r.id
LEFT JOIN regional_support rs ON rs.game_id = ah.game_id AND rs.player_id = ah.player_id AND rs.region_id = ah.region_id
WHERE ah.game_id = 9
ORDER BY ah.id DESC
LIMIT 10;
