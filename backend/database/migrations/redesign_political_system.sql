-- Migration: Redesign Political System
-- Adds new 5-ideology x 4-ethnicity (20 groups) per-region model
-- Creates admin-tunable tables for coefficients and campaign reach

USE outvoted;

-- ============================================================
-- STEP 1: Update ideology enum for game_players table
-- ============================================================

-- First, create a temporary column with the new enum
ALTER TABLE game_players ADD COLUMN ideology_new ENUM(
    'Socialist Nationalist', 
    'Liberal Reformist', 
    'Nationalist Conservative', 
    'Civic Unitary', 
    'Populist Anti-System'
) NULL;

-- Migrate existing data to new ideology values
UPDATE game_players SET ideology_new = CASE 
    WHEN ideology = 'Conservative' THEN 'Nationalist Conservative'
    WHEN ideology = 'Liberal' THEN 'Liberal Reformist'
    WHEN ideology = 'Socialist' THEN 'Socialist Nationalist'
    ELSE 'Nationalist Conservative'
END;

-- Drop the old column and rename the new one
ALTER TABLE game_players DROP COLUMN ideology;
ALTER TABLE game_players CHANGE COLUMN ideology_new ideology ENUM(
    'Socialist Nationalist', 
    'Liberal Reformist', 
    'Nationalist Conservative', 
    'Civic Unitary', 
    'Populist Anti-System'
) NOT NULL DEFAULT 'Nationalist Conservative';

-- ============================================================
-- STEP 2: Update ideology enum for candidates table
-- ============================================================

ALTER TABLE candidates ADD COLUMN ideology_new ENUM(
    'Socialist Nationalist', 
    'Liberal Reformist', 
    'Nationalist Conservative', 
    'Civic Unitary', 
    'Populist Anti-System'
) NULL;

UPDATE candidates SET ideology_new = CASE 
    WHEN ideology = 'Conservative' THEN 'Nationalist Conservative'
    WHEN ideology = 'Liberal' THEN 'Liberal Reformist'
    WHEN ideology = 'Socialist' THEN 'Socialist Nationalist'
    ELSE 'Nationalist Conservative'
END;

ALTER TABLE candidates DROP COLUMN ideology;
ALTER TABLE candidates CHANGE COLUMN ideology_new ideology ENUM(
    'Socialist Nationalist', 
    'Liberal Reformist', 
    'Nationalist Conservative', 
    'Civic Unitary', 
    'Populist Anti-System'
) NOT NULL DEFAULT 'Nationalist Conservative';

-- ============================================================
-- STEP 3: Create region_demographics table
-- Stores 20 population segments per region (5 ideologies x 4 ethnicities)
-- ============================================================

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

-- ============================================================
-- STEP 4: Create candidate_region_coefficients table
-- Stores candidate effectiveness per region (admin-tunable)
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_region_coefficients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    region_id INT NOT NULL,
    coefficient DECIMAL(4,3) NOT NULL DEFAULT 0.500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_candidate_region (candidate_id, region_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (region_id) REFERENCES regions(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_id),
    INDEX idx_region (region_id)
);

-- ============================================================
-- STEP 5: Create demographic_support table
-- Tracks support per demographic group per player per game
-- ============================================================

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

-- ============================================================
-- STEP 6: Create turn_region_activity table
-- Tracks campaign activity per region per turn for conflict detection
-- ============================================================

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
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    INDEX idx_game_turn_region (game_id, turn_number, region_id),
    INDEX idx_player (player_id)
);

-- ============================================================
-- STEP 7: Add reach_coefficient to actions table
-- ============================================================

ALTER TABLE actions ADD COLUMN reach_coefficient DECIMAL(4,3) DEFAULT 0.100;

-- Update existing actions with appropriate reach coefficients
UPDATE actions SET reach_coefficient = CASE name
    WHEN 'TV' THEN 0.300
    WHEN 'Social Media' THEN 0.250
    WHEN 'Radio' THEN 0.200
    WHEN 'Rally' THEN 0.150
    WHEN 'Small Meeting' THEN 0.080
    WHEN 'Door to Door' THEN 0.100
    WHEN 'Billboards' THEN 0.120
    WHEN 'Big Rally' THEN 0.200
    ELSE 0.100
END
WHERE type = 'campaign';

-- ============================================================
-- STEP 8: Add charisma_cost column for actions if not exists
-- (all actions can now consume charisma)
-- ============================================================

-- charisma_cost already exists from original schema

-- ============================================================
-- STEP 9: Create admin_users table for admin authentication
-- ============================================================

CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_admin_user (user_id)
);

-- ============================================================
-- STEP 10: Create demographic_support_history for tracking changes
-- ============================================================

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

-- ============================================================
-- DONE
-- ============================================================
