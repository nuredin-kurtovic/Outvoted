-- Add support history snapshots per turn
CREATE TABLE IF NOT EXISTS support_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    region_id INT NOT NULL,
    turn_number INT NOT NULL,
    support_percentage DECIMAL(5, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_support_snapshot (game_id, player_id, region_id, turn_number),
    INDEX idx_game_player_turn (game_id, player_id, turn_number),
    INDEX idx_region_turn (region_id, turn_number)
);
