-- Migration: Fix Coefficient Structure
-- Coefficients are per candidate × demographic group type (20 combinations)
-- NOT per candidate × region

USE outvoted;

-- ============================================================
-- Drop the old candidate_region_coefficients table
-- ============================================================
DROP TABLE IF EXISTS candidate_region_coefficients;

-- ============================================================
-- Create new candidate_demographic_coefficients table
-- Each candidate has a coefficient for each of the 20 ethno-ideological groups
-- ============================================================

CREATE TABLE IF NOT EXISTS candidate_demographic_coefficients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_id INT NOT NULL,
    ideology ENUM(
        'Socialist Nationalist', 
        'Liberal Reformist', 
        'Nationalist Conservative', 
        'Civic Unitary', 
        'Populist Anti-System'
    ) NOT NULL,
    ethnicity ENUM('Bosniak', 'Serb', 'Croat', 'Other') NOT NULL,
    coefficient DECIMAL(4,3) NOT NULL DEFAULT 0.010,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_candidate_demo (candidate_id, ideology, ethnicity),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    INDEX idx_candidate (candidate_id)
);

-- ============================================================
-- DONE
-- ============================================================
