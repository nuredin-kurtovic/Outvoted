import pool from '../config/database.js';

// Helper to safely add column if it doesn't exist
async function addColumnIfNotExists(table, column, definition) {
    try {
        const [rows] = await pool.execute(`
            SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
        `, [table, column]);
        
        if (rows[0].count === 0) {
            await pool.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            console.log(`[MIGRATIONS] Added column ${column} to ${table}`);
        }
    } catch (err) {
        if (!err.message.includes('Duplicate column')) {
            console.log(`[MIGRATIONS] Note for ${table}.${column}:`, err.message);
        }
    }
}

// Run migrations on startup
export async function runMigrations() {
    try {
        console.log('[MIGRATIONS] Running database migrations...');
        
        // Add columns to games table
        await addColumnIfNotExists('games', 'turn_started_at', 'TIMESTAMP NULL');
        await addColumnIfNotExists('games', 'turn_duration', 'INT DEFAULT 60');
        await addColumnIfNotExists('games', 'game_type', "VARCHAR(20) DEFAULT 'single'");
        await addColumnIfNotExists('games', 'join_code', 'VARCHAR(10) NULL');
        await addColumnIfNotExists('games', 'max_players', 'INT DEFAULT 2');
        await addColumnIfNotExists('games', 'current_player_turn', 'INT DEFAULT 1');

        // Add is_ai column to game_players
        await addColumnIfNotExists('game_players', 'is_ai', 'BOOLEAN DEFAULT FALSE');
        
        // Add candidate_id column to game_players (links to predefined candidates)
        await addColumnIfNotExists('game_players', 'candidate_id', 'INT NULL');
        // Ensure candidate_name exists (gameEngine and election logic need it)
        await addColumnIfNotExists('game_players', 'candidate_name', 'VARCHAR(100) NULL');

        // Make user_id nullable for AI players (AI opponents have user_id = NULL)
        try {
            const [colRows] = await pool.execute(`
                SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'game_players' AND COLUMN_NAME = 'user_id'
            `);
            if (colRows.length > 0 && colRows[0].IS_NULLABLE === 'NO') {
                // Drop FK and unique constraint, then modify column
                const [fkRows] = await pool.execute(`
                    SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'game_players' AND COLUMN_NAME = 'user_id' AND REFERENCED_TABLE_NAME IS NOT NULL
                `);
                if (fkRows.length > 0) {
                    await pool.execute(`ALTER TABLE game_players DROP FOREIGN KEY ${fkRows[0].CONSTRAINT_NAME}`);
                }
                try { await pool.execute('ALTER TABLE game_players DROP INDEX unique_game_user'); } catch (e) { /* ignore */ }
                await pool.execute('ALTER TABLE game_players MODIFY COLUMN user_id INT NULL');
                await pool.execute('ALTER TABLE game_players ADD CONSTRAINT fk_game_players_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
                await pool.execute('ALTER TABLE game_players ADD UNIQUE KEY unique_game_user (game_id, user_id)');
                console.log('[MIGRATIONS] game_players.user_id made nullable for AI opponents');
            }
        } catch (err) {
            console.log('[MIGRATIONS] Note (user_id nullable):', err.message);
        }

        // Create candidates table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS candidates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                ethnicity ENUM('Bosniak', 'Croat', 'Serb', 'Other') NOT NULL,
                ideology ENUM('Conservative', 'Liberal', 'Socialist') NOT NULL,
                home_region_id INT NOT NULL,
                description TEXT,
                image_url VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Add image_url column if it doesn't exist
        await addColumnIfNotExists('candidates', 'image_url', 'VARCHAR(500) NULL');
        
        // Check if candidates table is empty and seed it
        const [candidateCount] = await pool.execute('SELECT COUNT(*) as count FROM candidates');
        if (candidateCount[0].count === 0) {
            console.log('[MIGRATIONS] Seeding candidates table...');
            await pool.execute(`
                INSERT INTO candidates (name, ethnicity, ideology, home_region_id, description, image_url) VALUES
                ('Bakir Izetbegović', 'Bosniak', 'Conservative', 15, 'Former chairman of the Presidency of BiH, leader of SDA.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Bakir_Izetbegovic_2015.jpg/220px-Bakir_Izetbegovic_2015.jpg'),
                ('Denis Bećirović', 'Bosniak', 'Socialist', 9, 'Current Bosniak member of the Presidency. Social democrat from Tuzla.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Denis_Be%C4%87irovi%C4%87_%282022%29.jpg/220px-Denis_Be%C4%87irovi%C4%87_%282022%29.jpg'),
                ('Ramo Isak', 'Bosniak', 'Liberal', 15, 'Minister of Security of BiH. Focused on EU integration.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Ramo_Isak.jpg/220px-Ramo_Isak.jpg'),
                ('Halid Genjac', 'Bosniak', 'Conservative', 10, 'Veteran SDA politician from Central Bosnia.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Halid_Genjac.jpg/220px-Halid_Genjac.jpg'),
                ('Milorad Dodik', 'Serb', 'Conservative', 17, 'President of Republika Srpska, SNSD leader.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Milorad_Dodik_2022.jpg/220px-Milorad_Dodik_2022.jpg'),
                ('Željka Cvijanović', 'Serb', 'Conservative', 17, 'Former President of RS, SNSD establishment.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/%C5%BDeljka_Cvijanovi%C4%87_%282019%29.jpg/220px-%C5%BDeljka_Cvijanovi%C4%87_%282019%29.jpg'),
                ('Staša Košarac', 'Serb', 'Conservative', 18, 'SNSD politician from Eastern RS.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sta%C5%A1a_Ko%C5%A1arac.jpg/220px-Sta%C5%A1a_Ko%C5%A1arac.jpg'),
                ('Draško Stanivuković', 'Serb', 'Liberal', 17, 'Young Mayor of Banja Luka, reformist from PDP.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Drasko_Stanivukovic_2020.jpg/220px-Drasko_Stanivukovic_2020.jpg'),
                ('Dragan Čović', 'Croat', 'Conservative', 16, 'HDZ BiH leader, advocates for Croat interests.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Dragan_%C4%8Covi%C4%87_%282013%29.jpg/220px-Dragan_%C4%8Covi%C4%87_%282013%29.jpg'),
                ('Željko Komšić', 'Croat', 'Liberal', 15, 'Current Croat member of Presidency, civic-oriented.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/%C5%BDeljko_Kom%C5%A1i%C4%87_2019.jpg/220px-%C5%BDeljko_Kom%C5%A1i%C4%87_2019.jpg'),
                ('Martin Raguž', 'Croat', 'Conservative', 13, 'HDZ politician from Herzegovina-Neretva.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Martin_Ragu%C5%BE.jpg/220px-Martin_Ragu%C5%BE.jpg'),
                ('Dijana Zelenika', 'Croat', 'Conservative', 14, 'HDZ 1990 politician from West Herzegovina.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Dijana_Zelenika.jpg/220px-Dijana_Zelenika.jpg')
            `);
            console.log('[MIGRATIONS] Candidates seeded successfully');
        } else {
            // Update existing candidates with images if they don't have them
            console.log('[MIGRATIONS] Updating candidate images...');
            const candidateImages = [
                { name: 'Bakir Izetbegović', image: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Izetbegovi%C4%87%2C_Bakir.jpg' },
                { name: 'Denis Bećirović', image: 'https://ui-avatars.com/api/?name=Denis+Be%C4%87irovi%C4%87&size=400&background=22c55e&color=fff&bold=true&format=png' },
                { name: 'Ramo Isak', image: 'https://ui-avatars.com/api/?name=Ramo+Isak&size=400&background=22c55e&color=fff&bold=true&format=png' },
                { name: 'Halid Genjac', image: 'https://ui-avatars.com/api/?name=Halid+Genjac&size=400&background=22c55e&color=fff&bold=true&format=png' },
                { name: 'Milorad Dodik', image: 'https://ui-avatars.com/api/?name=Milorad+Dodik&size=400&background=3b82f6&color=fff&bold=true&format=png' },
                { name: 'Željka Cvijanović', image: 'https://ui-avatars.com/api/?name=%C5%BDeljka+Cvijanovi%C4%87&size=400&background=3b82f6&color=fff&bold=true&format=png' },
                { name: 'Staša Košarac', image: 'https://ui-avatars.com/api/?name=Sta%C5%A1a+Ko%C5%A1arac&size=400&background=3b82f6&color=fff&bold=true&format=png' },
                { name: 'Draško Stanivuković', image: 'https://ui-avatars.com/api/?name=Dra%C5%A1ko+Stanivukovi%C4%87&size=400&background=3b82f6&color=fff&bold=true&format=png' },
                { name: 'Dragan Čović', image: 'https://ui-avatars.com/api/?name=Dragan+%C4%8Covi%C4%87&size=400&background=ef4444&color=fff&bold=true&format=png' },
                { name: 'Željko Komšić', image: 'https://ui-avatars.com/api/?name=%C5%BDeljko+Kom%C5%A1i%C4%87&size=400&background=ef4444&color=fff&bold=true&format=png' },
                { name: 'Martin Raguž', image: 'https://ui-avatars.com/api/?name=Martin+Ragu%C5%BE&size=400&background=ef4444&color=fff&bold=true&format=png' },
                { name: 'Dijana Zelenika', image: 'https://ui-avatars.com/api/?name=Dijana+Zelenika&size=400&background=ef4444&color=fff&bold=true&format=png' }
            ];
            for (const c of candidateImages) {
                // Force update all candidates with images (even if they already have one)
                await pool.execute('UPDATE candidates SET image_url = ? WHERE name = ?', [c.image, c.name]);
            }
        }

        // Create spending_history table if not exists
        await pool.execute(`
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
            )
        `);

        // Turn summary acknowledgments: multiplayer games wait for both players to click Continue
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS turn_summary_acknowledgments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                game_id INT NOT NULL,
                turn_number INT NOT NULL,
                player_id INT NOT NULL,
                acknowledged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY unique_game_turn_player (game_id, turn_number, player_id),
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE
            )
        `);

        // Create turn_completions table if not exists
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS turn_completions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                game_id INT NOT NULL,
                player_id INT NOT NULL,
                turn_number INT NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
                UNIQUE KEY unique_turn_completion (game_id, player_id, turn_number),
                INDEX idx_game_turn (game_id, turn_number)
            )
        `);

        // Create election_results table (national totals per candidate - matches gameEngine.calculatePresidentialElection)
        // Handle old schema (region_id) vs new schema (candidate_name, support_percentage, is_winner)
        try {
            const [cols] = await pool.execute(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'election_results'
            `);
            const hasCandidateName = cols.some(c => c.COLUMN_NAME === 'candidate_name');
            const hasRegionId = cols.some(c => c.COLUMN_NAME === 'region_id');
            if (cols.length > 0 && (!hasCandidateName || hasRegionId)) {
                await pool.execute('DROP TABLE IF EXISTS election_results');
                console.log('[MIGRATIONS] Dropped old election_results schema, recreating');
            }
        } catch (e) { /* table may not exist */ }
        await pool.execute(`
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
                UNIQUE KEY unique_game_player (game_id, player_id),
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
                FOREIGN KEY (player_id) REFERENCES game_players(id) ON DELETE CASCADE,
                INDEX idx_game (game_id)
            )
        `);

        // Update actions table with balanced costs and charisma requirements
        console.log('[MIGRATIONS] Updating action costs and charisma requirements...');
        
        // Add charisma_cost column to actions if not exists
        await addColumnIfNotExists('actions', 'charisma_cost', 'INT DEFAULT 0');
        
        // Update campaign actions with new balanced values (+2% gains)
        const actionUpdates = [
            // Global campaigns
            { name: 'TV', base_cost: 100000, base_support_gain: 0.045, charisma_cost: 5 },
            { name: 'Social Media', base_cost: 40000, base_support_gain: 0.035, charisma_cost: 0 },
            { name: 'Radio', base_cost: 60000, base_support_gain: 0.04, charisma_cost: 0 },
            // Local campaigns
            { name: 'Billboards', base_cost: 15000, base_support_gain: 0.04, charisma_cost: 0 },
            { name: 'Small Meeting', base_cost: 10000, base_support_gain: 0.045, charisma_cost: 0 },
            { name: 'Rally', base_cost: 35000, base_support_gain: 0.07, charisma_cost: 0 },
            { name: 'Door to Door', base_cost: 25000, base_support_gain: 0.065, charisma_cost: 0 },
            { name: 'Big Rally', base_cost: 50000, base_support_gain: 0.10, charisma_cost: 0 },
            // Fundraising
            { name: 'Local Fundraiser', base_cost: 0, base_budget_gain: 30000, charisma_cost: 0 },
            { name: 'Diaspora Gala', base_cost: 0, base_budget_gain: 75000, charisma_cost: 0 },
            { name: 'Corporate Donations', base_cost: 0, base_budget_gain: 45000, charisma_cost: 0 },
            { name: 'Online Crowdfunding', base_cost: 0, base_budget_gain: 20000, charisma_cost: 0 },
            // Skills (now cost charisma)
            { name: 'TV Media Bonus', base_cost: 0, charisma_cost: 15 },
            { name: 'Door-to-Door Discount', base_cost: 0, charisma_cost: 10 },
            { name: 'Foreign Aid', base_cost: 0, charisma_cost: 12 },
        ];
        
        for (const update of actionUpdates) {
            try {
                if (update.base_support_gain !== undefined) {
                    await pool.execute(
                        `UPDATE actions SET base_cost = ?, base_support_gain = ?, charisma_cost = ? WHERE name = ?`,
                        [update.base_cost, update.base_support_gain, update.charisma_cost, update.name]
                    );
                } else if (update.base_budget_gain !== undefined) {
                    await pool.execute(
                        `UPDATE actions SET base_cost = ?, base_budget_gain = ?, charisma_cost = ? WHERE name = ?`,
                        [update.base_cost, update.base_budget_gain, update.charisma_cost, update.name]
                    );
                } else {
                    await pool.execute(
                        `UPDATE actions SET base_cost = ?, charisma_cost = ? WHERE name = ?`,
                        [update.base_cost, update.charisma_cost, update.name]
                    );
                }
            } catch (err) {
                console.log(`[MIGRATIONS] Note updating ${update.name}:`, err.message);
            }
        }

        // Create action_demographic_coefficients (per campaign type × ethno-ideological group, like candidates)
        try {
            await pool.execute(`
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
                )
            `);
            const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
            const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
            const [campaignActions] = await pool.execute("SELECT id FROM actions WHERE type = 'campaign'");
            for (const a of campaignActions) {
                for (const eth of ethnicities) {
                    for (const ideo of ideologies) {
                        await pool.execute(
                            `INSERT IGNORE INTO action_demographic_coefficients (action_id, ideology, ethnicity, coefficient)
                             VALUES (?, ?, ?, 1.000)`,
                            [a.id, ideo, eth]
                        );
                    }
                }
            }
            console.log('[MIGRATIONS] action_demographic_coefficients created and seeded');
        } catch (err) {
            console.log('[MIGRATIONS] Note (action_demographic_coefficients):', err.message);
        }

        // Create candidate_demographic_coefficients and seed for existing candidates
        try {
            await pool.execute(`
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
                )
            `);
            // Seed coefficients for candidates that don't have any
            const [candidates] = await pool.execute('SELECT id, ethnicity, ideology FROM candidates');
            const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
            const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
            const ideologyMap = { 'Conservative': 'Nationalist Conservative', 'Liberal': 'Liberal Reformist', 'Socialist': 'Socialist Nationalist' };
            for (const c of candidates) {
                const [existing] = await pool.execute('SELECT COUNT(*) as cnt FROM candidate_demographic_coefficients WHERE candidate_id = ?', [c.id]);
                if (existing[0].cnt > 0) continue;
                const candIdeology = ideologyMap[c.ideology] || c.ideology || 'Nationalist Conservative';
                for (const demoEth of ethnicities) {
                    for (const demoIdeo of ideologies) {
                        let coef = 0.01;
                        if (c.ethnicity === demoEth) {
                            coef = 0.50;
                            if (candIdeology === demoIdeo) coef = 0.90;
                        }
                        await pool.execute(
                            `INSERT IGNORE INTO candidate_demographic_coefficients (candidate_id, ideology, ethnicity, coefficient) VALUES (?, ?, ?, ?)`,
                            [c.id, demoIdeo, demoEth, coef.toFixed(3)]
                        );
                    }
                }
            }
            console.log('[MIGRATIONS] candidate_demographic_coefficients created and seeded');
        } catch (err) {
            console.log('[MIGRATIONS] Note (candidate_demographic_coefficients):', err.message);
        }

        // Fix West Herzegovina: was croat 0 / serb 72000; should be croat 72000 / serb 0
        try {
            const [res] = await pool.execute(
                `UPDATE regions SET croat_pop = 72000, serb_pop = 0 WHERE code = 'WEST_HERZEGOVINA_CAN'`
            );
            if (res?.affectedRows > 0) {
                console.log('[MIGRATIONS] Fixed West Herzegovina Canton demographics (Croat/Serb swapped)');
            }
        } catch (err) {
            console.log('[MIGRATIONS] Note (West Herzegovina fix):', err.message);
        }

        // Rename Semberija to Bijeljina (region name and code)
        try {
            const [res] = await pool.execute(
                `UPDATE regions SET name = 'Bijeljina', code = 'BIJELJINA' WHERE code = 'SEMBERIJA'`
            );
            if (res?.affectedRows > 0) {
                console.log('[MIGRATIONS] Renamed region Semberija to Bijeljina');
            }
        } catch (err) {
            console.log('[MIGRATIONS] Note (Semberija→Bijeljina):', err.message);
        }

        console.log('[MIGRATIONS] Database migrations completed successfully');
    } catch (error) {
        console.error('[MIGRATIONS] Error running migrations:', error.message);
        // Don't throw - allow server to start even if migrations have issues
    }
}
