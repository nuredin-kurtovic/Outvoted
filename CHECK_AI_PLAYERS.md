# Check AI Players - Quick Guide

## Simple Query (Shows Recent Games)

```bash
mysql -u root -p outvoted -e "SELECT g.id as game_id, g.game_type, gp.candidate_name, gp.is_ai, gp.user_id FROM games g LEFT JOIN game_players gp ON g.id = gp.game_id ORDER BY g.id DESC LIMIT 10;"
```

This will show:
- Game ID
- Game type (single/multiplayer/ai)
- Player candidate names
- is_ai flag (1 = AI, 0 or NULL = human)
- user_id (NULL for AI players)

## Check Specific Game

First, find your game ID from the query above, then:

```bash
mysql -u root -p outvoted -e "SELECT id, candidate_name, is_ai, user_id, ethnicity, ideology FROM game_players WHERE game_id = 1;"
```

Replace `1` with your actual game ID.

## Check All AI Players

```bash
mysql -u root -p outvoted -e "SELECT gp.id, gp.game_id, gp.candidate_name, gp.is_ai, gp.user_id, g.game_type FROM game_players gp JOIN games g ON gp.game_id = g.id WHERE gp.is_ai = TRUE OR gp.user_id IS NULL ORDER BY gp.id DESC;"
```

## What to Look For

- **is_ai = 1** or **user_id = NULL** → AI player
- **is_ai = 0** or **user_id = number** → Human player
- **is_ai = NULL** → Needs to be fixed (run fix script)

## If AI Players Are Missing

1. Check if AI was created when you made the game (look for game_type = 'ai')
2. Check backend console logs when creating game
3. Run the fix script: `mysql -u root -p outvoted < backend/database/fix_existing_ai_players.sql`
