-- Migration: Add multiplayer and AI support
USE outvoted;

-- Add new columns to games table
ALTER TABLE games 
ADD COLUMN game_type ENUM('single', 'multiplayer', 'ai') DEFAULT 'single' AFTER status,
ADD COLUMN join_code VARCHAR(10) UNIQUE AFTER game_type,
ADD COLUMN max_players INT DEFAULT 2 AFTER join_code,
ADD COLUMN current_player_turn INT DEFAULT NULL AFTER current_turn;

-- Add is_ai flag to game_players
ALTER TABLE game_players
ADD COLUMN is_ai BOOLEAN DEFAULT FALSE AFTER is_active;

-- Create turn tracking table (who has completed their turn)
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

-- Create spending history table for budget tracking
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

-- Generate join codes for existing games
UPDATE games SET join_code = LPAD(id, 6, '0') WHERE join_code IS NULL;
