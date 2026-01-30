-- Safe Migration: Add multiplayer and AI support (only adds missing columns)
USE outvoted;

-- Add game_type column if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'games';
SET @columnname = 'game_type';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column game_type already exists" AS message',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' ENUM(\'single\', \'multiplayer\', \'ai\') DEFAULT \'single\' AFTER status')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add join_code column if it doesn't exist
SET @columnname = 'join_code';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column join_code already exists" AS message',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(10) UNIQUE AFTER game_type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add max_players column if it doesn't exist
SET @columnname = 'max_players';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column max_players already exists" AS message',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT 2 AFTER join_code')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add current_player_turn column if it doesn't exist
SET @columnname = 'current_player_turn';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column current_player_turn already exists" AS message',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT NULL AFTER current_turn')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add is_ai column to game_players if it doesn't exist
SET @tablename = 'game_players';
SET @columnname = 'is_ai';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT "Column is_ai already exists" AS message',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' BOOLEAN DEFAULT FALSE AFTER is_active')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create turn_completions table if it doesn't exist
CREATE TABLE IF NOT EXISTS turn_completions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    turn_number INT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_turn (game_id, player_id, turn_number),
    INDEX idx_game_turn (game_id, turn_number)
);

-- Create spending_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS spending_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    turn_number INT NOT NULL,
    action_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    type ENUM('spent', 'earned') NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id),
    INDEX idx_game_player (game_id, player_id),
    INDEX idx_turn (game_id, turn_number)
);

-- Generate join codes for existing games that don't have one
UPDATE games SET join_code = LPAD(id, 6, '0') WHERE join_code IS NULL;
