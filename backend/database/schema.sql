-- Outvoted Database Schema
-- Political Campaign Strategy Game
-- Updated for 5-ideology x 4-ethnicity system

CREATE DATABASE IF NOT EXISTS outvoted;
USE outvoted;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_user (user_id)
);

-- Games table
CREATE TABLE IF NOT EXISTS games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    host_user_id INT NOT NULL,
    status ENUM('waiting', 'active', 'completed', 'abandoned') DEFAULT 'waiting',
    current_turn INT DEFAULT 0,
    max_turns INT DEFAULT 30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (host_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_host (host_user_id)
);

-- Game players (for multiplayer support)
-- Updated with new 5-ideology system
CREATE TABLE IF NOT EXISTS game_players (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    user_id INT NOT NULL,
    candidate_name VARCHAR(100),
    ethnicity ENUM('Bosniak', 'Croat', 'Serb', 'Other') NOT NULL,
    ideology ENUM(
        'Socialist Nationalist', 
        'Liberal Reformist', 
        'Nationalist Conservative', 
        'Civic Unitary', 
        'Populist Anti-System'
    ) NOT NULL,
    home_region_id INT NOT NULL,
    budget DECIMAL(10, 2) DEFAULT 0,
    charisma_points INT DEFAULT 0,
    turn_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_game_user (game_id, user_id),
    INDEX idx_game (game_id),
    INDEX idx_user (user_id)
);

-- Regions table (Bosnia and Herzegovina regions - 18 regions)
CREATE TABLE IF NOT EXISTS regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    population INT NOT NULL,
    bosniak_pop INT NOT NULL,
    croat_pop INT NOT NULL,
    serb_pop INT NOT NULL,
    other_pop INT NOT NULL,
    administrative_importance VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Region demographics table (20 groups per region: 5 ideologies x 4 ethnicities)
CREATE TABLE IF NOT EXISTS region_demographics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    region_id INT NOT NULL,
    ideology ENUM(
        'Socialist Nationalist', 
        'Liberal Reformist', 
        'Nationalist Conservative', 
        'Civic Unitary', 
        'Populist Anti-System'
    ) NOT NULL,
    ethnicity ENUM('Bosniak', 'Serb', 'Croat', 'Other') NOT NULL,
    population INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_region_demo (region_id, ideology, ethnicity),
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    INDEX idx_region (region_id),
    INDEX idx_ideology (ideology),
    INDEX idx_ethnicity (ethnicity)
);

-- Regional support tracking per player per game (legacy - kept for backward compatibility)
CREATE TABLE IF NOT EXISTS regional_support (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    region_id INT NOT NULL,
    support_percentage DECIMAL(5, 4) NOT NULL DEFAULT 0.20,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_player_region (game_id, player_id, region_id),
    INDEX idx_game_player (game_id, player_id),
    INDEX idx_region (region_id)
);

-- Demographic support tracking (new system - per ideology/ethnicity group)
CREATE TABLE IF NOT EXISTS demographic_support (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    region_id INT NOT NULL,
    ideology ENUM(
        'Socialist Nationalist', 
        'Liberal Reformist', 
        'Nationalist Conservative', 
        'Civic Unitary', 
        'Populist Anti-System'
    ) NOT NULL,
    ethnicity ENUM('Bosniak', 'Serb', 'Croat', 'Other') NOT NULL,
    support_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_demo_support (game_id, player_id, region_id, ideology, ethnicity),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    INDEX idx_game_player (game_id, player_id),
    INDEX idx_region (region_id)
);

-- Support history snapshots per turn (for change tracking)
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

-- Demographic support history (new system)
CREATE TABLE IF NOT EXISTS demographic_support_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    region_id INT NOT NULL,
    ideology ENUM(
        'Socialist Nationalist', 
        'Liberal Reformist', 
        'Nationalist Conservative', 
        'Civic Unitary', 
        'Populist Anti-System'
    ) NOT NULL,
    ethnicity ENUM('Bosniak', 'Serb', 'Croat', 'Other') NOT NULL,
    turn_number INT NOT NULL,
    support_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_demo_history (game_id, player_id, region_id, ideology, ethnicity, turn_number),
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    INDEX idx_game_player_turn (game_id, player_id, turn_number)
);

-- Candidate region coefficients (admin-tunable)
CREATE TABLE IF NOT EXISTS candidate_region_coefficients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    region_id INT NOT NULL,
    coefficient DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_candidate_region (candidate_id, region_id),
    INDEX idx_candidate (candidate_id),
    INDEX idx_region (region_id)
);

-- Turn region activity (for conflict detection)
CREATE TABLE IF NOT EXISTS turn_region_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    turn_number INT NOT NULL,
    region_id INT NOT NULL,
    player_id INT NOT NULL,
    action_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    INDEX idx_game_turn_region (game_id, turn_number, region_id),
    INDEX idx_player (player_id)
);

-- Actions table (campaign actions, fundraising, skills)
CREATE TABLE IF NOT EXISTS actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('campaign', 'fundraising', 'skill', 'ultimate') NOT NULL,
    base_cost DECIMAL(10, 2) NOT NULL,
    base_support_gain DECIMAL(5, 4) DEFAULT 0,
    base_budget_gain DECIMAL(10, 2) DEFAULT 0,
    charisma_cost INT DEFAULT 0,
    reach_coefficient DECIMAL(4,3) DEFAULT 0.100,
    description TEXT,
    rules JSON,
    -- rules can contain: tv_eligible, door_discount, last_week_only, once_per_game, scope, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Action demographic coefficients (per campaign type × ethno-ideological group, like candidates)
CREATE TABLE IF NOT EXISTS action_demographic_coefficients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action_id INT NOT NULL,
    ideology ENUM(
        'Socialist Nationalist',
        'Liberal Reformist',
        'Nationalist Conservative',
        'Civic Unitary',
        'Populist Anti-System'
    ) NOT NULL,
    ethnicity ENUM('Bosniak', 'Serb', 'Croat', 'Other') NOT NULL,
    coefficient DECIMAL(4,3) NOT NULL DEFAULT 1.000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_action_demo (action_id, ideology, ethnicity),
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    INDEX idx_action (action_id)
);

-- Player action history (fatigue tracking)
CREATE TABLE IF NOT EXISTS action_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    turn_number INT NOT NULL,
    action_id INT NOT NULL,
    region_id INT NULL,
    spending_amount DECIMAL(10, 2) DEFAULT 0,
    effect_applied JSON,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id),
    FOREIGN KEY (region_id) REFERENCES regions(id),
    INDEX idx_game_player_turn (game_id, player_id, turn_number),
    INDEX idx_action (action_id)
);

-- Active skill effects per player
CREATE TABLE IF NOT EXISTS active_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    action_id INT NOT NULL,
    turns_remaining INT NOT NULL,
    effect_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id),
    INDEX idx_game_player (game_id, player_id)
);

-- One-time usage flags (e.g., diaspora gala)
CREATE TABLE IF NOT EXISTS used_actions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    player_id INT NOT NULL,
    action_id INT NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id),
    UNIQUE KEY unique_player_action (game_id, player_id, action_id),
    INDEX idx_game_player (game_id, player_id)
);
