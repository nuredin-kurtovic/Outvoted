-- Check all games and their players
USE outvoted;

-- Show all games with their players
SELECT 
    g.id as game_id,
    g.game_type,
    g.status,
    g.current_turn,
    gp.id as player_id,
    gp.candidate_name,
    gp.is_ai,
    gp.user_id,
    u.username
FROM games g
LEFT JOIN game_players gp ON g.id = gp.game_id
LEFT JOIN users u ON gp.user_id = u.id
ORDER BY g.id DESC, gp.turn_order
LIMIT 20;
