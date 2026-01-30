-- Fix: Make user_id nullable for AI players
USE outvoted;

-- Check current column definition
SHOW COLUMNS FROM game_players LIKE 'user_id';

-- Drop the foreign key constraint first (if it exists)
SET @constraint_name = (
    SELECT CONSTRAINT_NAME 
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'outvoted' 
    AND TABLE_NAME = 'game_players' 
    AND COLUMN_NAME = 'user_id' 
    AND REFERENCED_TABLE_NAME IS NOT NULL
    LIMIT 1
);

SET @sql = IF(@constraint_name IS NOT NULL, 
    CONCAT('ALTER TABLE game_players DROP FOREIGN KEY ', @constraint_name),
    'SELECT "No foreign key found"'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop the unique constraint that includes user_id (check if exists first)
SET @index_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'outvoted' 
    AND TABLE_NAME = 'game_players' 
    AND INDEX_NAME = 'unique_game_user'
);

SET @sql2 = IF(@index_exists > 0,
    'ALTER TABLE game_players DROP INDEX unique_game_user',
    'SELECT "Index does not exist"'
);

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Make user_id nullable (AI players have NULL user_id)
ALTER TABLE game_players MODIFY COLUMN user_id INT NULL;

-- Re-add the foreign key constraint (only for non-null user_id)
ALTER TABLE game_players 
ADD CONSTRAINT fk_game_players_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Re-add unique constraint (allows multiple NULLs for AI players)
ALTER TABLE game_players 
ADD UNIQUE KEY unique_game_user (game_id, user_id);

-- Verify the change
SHOW COLUMNS FROM game_players LIKE 'user_id';
