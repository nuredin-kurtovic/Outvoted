# AI Candidate Not Showing - Troubleshooting

## Most Likely Issue: Database Migration Not Run

The `is_ai` column might not exist in your database. Run this:

```bash
mysql -u root -p outvoted < backend/database/migrations/add_multiplayer.sql
```

If that fails or you get "column already exists" errors, run this instead:

```bash
mysql -u root -p outvoted < backend/database/fix_ai_column.sql
```

## Check Backend Console

When you create an AI game, check your backend console for:
- "Creating AI opponent for game X"
- "AI candidate: [name], [ethnicity], [ideology]"
- "AI player created with ID: X"
- Any error messages

## Verify AI Was Created

Check the database directly:

```bash
mysql -u root -p outvoted -e "SELECT id, candidate_name, is_ai, ethnicity, ideology FROM game_players WHERE is_ai = TRUE ORDER BY id DESC LIMIT 5;"
```

## If AI Still Not Showing

1. **Check game state endpoint**: The game state should include `all_players` array
2. **Check frontend**: Look in browser console for errors
3. **Verify game type**: Make sure you selected "VS AI" when creating the game

## Quick Fix

If the migration fails, you can manually add the column:

```sql
ALTER TABLE game_players ADD COLUMN is_ai BOOLEAN DEFAULT FALSE AFTER is_active;
```
