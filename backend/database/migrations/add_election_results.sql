-- Add election results table for presidential election
CREATE TABLE IF NOT EXISTS election_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    candidate_name VARCHAR(100) NOT NULL,
    votes INT NOT NULL DEFAULT 0,
    vote_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    support_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_player (game_id, player_id),
    INDEX idx_game (game_id),
    INDEX idx_winner (is_winner)
);
