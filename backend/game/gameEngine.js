// Game Engine - Core game logic for turn-based political campaign
// Updated for 5-ideology x 4-ethnicity (20 groups) per region system

export class GameEngine {
    constructor(db) {
        this.db = db;
    }

    // ============================================================
    // INITIAL SUPPORT CALCULATION
    // ============================================================

    // Calculate initial support for a player in a region
    // All candidates start with 0% support - they must earn it through campaigns
    async calculateInitialSupport(player, regionId, candidateId = null) {
        // All candidates start with 0% support in all regions
        return 0;
    }

    // Calculate starting budget based on ethnic population share
    async calculateStartingBudget(player) {
        const [regions] = await this.db.execute('SELECT * FROM regions');
        let totalPop = 0;
        let ethnicPop = 0;

        regions.forEach(region => {
            totalPop += region.population;
            if (player.ethnicity === 'Bosniak') ethnicPop += region.bosniak_pop;
            else if (player.ethnicity === 'Croat') ethnicPop += region.croat_pop;
            else if (player.ethnicity === 'Serb') ethnicPop += region.serb_pop;
            else ethnicPop += region.other_pop;
        });

        const rawWeight = totalPop > 0 ? ethnicPop / totalPop : 0.2;
        const ethnicWeight = Math.max(0.1, Math.min(1.0, rawWeight));

        const baseBudget = 1_000_000; // 1,000,000 KM
        const startingBudget = baseBudget * (0.7 + ethnicWeight);

        return Math.round(startingBudget);
    }

    // ============================================================
    // DEMOGRAPHIC SUPPORT SYSTEM
    // ============================================================

    // Initialize demographic support for a player in all regions
    // All candidates start with 0 support - they must earn it through campaigns
    async initializeDemographicSupport(gameId, playerId, candidateId) {
        // Get all regions with demographics
        const [regions] = await this.db.execute('SELECT * FROM regions');
        
        for (const region of regions) {
            // Get demographics for this region
            const [demographics] = await this.db.execute(
                `SELECT * FROM region_demographics WHERE region_id = ?`,
                [region.id]
            );
            
            for (const demo of demographics) {
                // All candidates start with 0 support
                await this.db.execute(
                    `INSERT INTO demographic_support 
                     (game_id, player_id, region_id, ideology, ethnicity, support_count)
                     VALUES (?, ?, ?, ?, ?, 0)
                     ON DUPLICATE KEY UPDATE support_count = VALUES(support_count)`,
                    [gameId, playerId, region.id, demo.ideology, demo.ethnicity]
                );
            }
        }
    }

    // Get candidate coefficient for a specific demographic group (ideology + ethnicity)
    async getCandidateDemographicCoefficient(candidateId, ideology, ethnicity) {
        const [rows] = await this.db.execute(
            `SELECT coefficient FROM candidate_demographic_coefficients 
             WHERE candidate_id = ? AND ideology = ? AND ethnicity = ?`,
            [candidateId, ideology, ethnicity]
        );
        return rows.length > 0 ? parseFloat(rows[0].coefficient) : 0.01;
    }

    // Get all coefficients for a candidate (20 values)
    async getCandidateAllCoefficients(candidateId) {
        const [rows] = await this.db.execute(
            `SELECT ideology, ethnicity, coefficient FROM candidate_demographic_coefficients 
             WHERE candidate_id = ?`,
            [candidateId]
        );
        const coefficients = {};
        for (const row of rows) {
            const key = `${row.ideology}|${row.ethnicity}`;
            coefficients[key] = parseFloat(row.coefficient);
        }
        return coefficients;
    }

    // Get all demographic coefficients for an action (20 values; default 1.0 if missing)
    async getActionAllCoefficients(actionId) {
        const [rows] = await this.db.execute(
            `SELECT ideology, ethnicity, coefficient FROM action_demographic_coefficients 
             WHERE action_id = ?`,
            [actionId]
        );
        const coefficients = {};
        for (const row of rows) {
            const key = `${row.ideology}|${row.ethnicity}`;
            coefficients[key] = parseFloat(row.coefficient);
        }
        return coefficients;
    }

    // Get player's candidate_id
    async getPlayerCandidateId(playerId) {
        const [player] = await this.db.execute(
            'SELECT candidate_id FROM game_players WHERE id = ?',
            [playerId]
        );
        return player.length > 0 ? player[0].candidate_id : null;
    }

    // Calculate average coefficient for a candidate in a region (weighted by population)
    async getAverageRegionCoefficient(candidateId, regionId) {
        const coefficients = await this.getCandidateAllCoefficients(candidateId);
        const [demographics] = await this.db.execute(
            'SELECT ideology, ethnicity, population FROM region_demographics WHERE region_id = ?',
            [regionId]
        );
        
        let totalWeighted = 0;
        let totalPop = 0;
        for (const demo of demographics) {
            const key = `${demo.ideology}|${demo.ethnicity}`;
            const coef = coefficients[key] || 0.01;
            totalWeighted += coef * demo.population;
            totalPop += demo.population;
        }
        
        return totalPop > 0 ? totalWeighted / totalPop : 0.01;
    }

    // ============================================================
    // PASSIVE SHIFT SYSTEM
    // ============================================================

    // Apply passive shift based on candidate coefficient
    // +2% for high alignment (coeff >= 0.9)
    // -2% for low alignment (coeff <= 0.2)
    async applyPassiveShift(gameId, playerId) {
        try {
            const [players] = await this.db.execute('SELECT * FROM game_players WHERE id = ?', [playerId]);
            if (players.length === 0) return { changes: [], globalChange: 0 };
            const player = players[0];
            
            // Get total player count for scaling
            const [allPlayers] = await this.db.execute(
                'SELECT COUNT(*) as count FROM game_players WHERE game_id = ? AND is_active = TRUE',
                [player.game_id]
            );
            const playerCount = allPlayers[0].count || 2;
            const minSupport = Math.max(0.02, 0.05 - (playerCount - 2) * 0.005);

            const [regions] = await this.db.execute('SELECT * FROM regions ORDER BY id');
            
            const nationalSupportBefore = await this.calculateNationalSupport(gameId, playerId);
            const changes = [];

            // Get candidate's coefficients for passive shift calculation
            const candidateId = await this.getPlayerCandidateId(playerId);
            
            for (const region of regions) {
                // Get average coefficient for this region (weighted by demographic population)
                const coefficient = await this.getAverageRegionCoefficient(candidateId, region.id);
                
                // Determine passive shift based on average coefficient
                let shiftRate = 0;
                if (coefficient >= 0.8) {
                    shiftRate = 0.02; // +2% organic growth for high alignment
                } else if (coefficient <= 0.15) {
                    shiftRate = -0.02; // -2% decay for very low alignment
                } else if (coefficient >= 0.5) {
                    shiftRate = 0.01; // +1% for good alignment (0.5 <= coeff < 0.8)
                } else if (coefficient <= 0.25) {
                    shiftRate = -0.01; // -1% for poor alignment (0.15 < coeff <= 0.25)
                }
                
                if (shiftRate === 0) continue;
                
                // Scale shift rate by player count
                shiftRate = shiftRate / Math.sqrt(playerCount / 2);

                // Get current support percentage
                const [currentSupport] = await this.db.execute(
                    `SELECT support_percentage FROM regional_support 
                     WHERE game_id = ? AND player_id = ? AND region_id = ?`,
                    [gameId, playerId, region.id]
                );
                
                if (currentSupport.length === 0) continue;
                const oldSupport = parseFloat(currentSupport[0].support_percentage);
                
                // Apply shift
                let newSupport = oldSupport + shiftRate;
                newSupport = Math.max(minSupport, Math.min(0.95, newSupport));
                
                // Update regional support
                await this.db.execute(
                    `UPDATE regional_support SET support_percentage = ? 
                     WHERE game_id = ? AND player_id = ? AND region_id = ?`,
                    [newSupport, gameId, playerId, region.id]
                );
                
                changes.push({
                    region_id: region.id,
                    region_name: region.name,
                    oldSupport,
                    newSupport,
                    change: shiftRate,
                    coefficient
                });
            }

            const nationalSupportAfter = await this.calculateNationalSupport(gameId, playerId);
            const globalChange = nationalSupportAfter - nationalSupportBefore;

            if (changes.length > 0) {
                console.log(`[PASSIVE SHIFT] Player ${playerId}: ${changes.length} regions adjusted, global change: ${(globalChange * 100).toFixed(2)}%`);
            }

            return {
                changes,
                globalChange,
                nationalSupportBefore,
                nationalSupportAfter
            };
        } catch (error) {
            console.error(`[PASSIVE SHIFT] Error for player ${playerId}:`, error);
            return { changes: [], globalChange: 0 };
        }
    }

    // ============================================================
    // CONFLICT DETECTION
    // ============================================================

    // Check if there's a conflict (multiple candidates in same region same turn)
    async checkConflict(gameId, turnNumber, regionId, playerId) {
        const [activities] = await this.db.execute(
            `SELECT COUNT(*) as count FROM turn_region_activity 
             WHERE game_id = ? AND turn_number = ? AND region_id = ? AND player_id != ?`,
            [gameId, turnNumber, regionId, playerId]
        );
        return activities[0].count > 0;
    }

    // Record campaign activity for conflict tracking
    async recordActivity(gameId, turnNumber, regionId, playerId, actionId) {
        await this.db.execute(
            `INSERT INTO turn_region_activity (game_id, turn_number, region_id, player_id, action_id)
             VALUES (?, ?, ?, ?, ?)`,
            [gameId, turnNumber, regionId, playerId, actionId]
        );
    }

    // ============================================================
    // FATIGUE SYSTEM
    // ============================================================

    async getFatigueMultiplier(gameId, playerId, actionId) {
        const [history] = await this.db.execute(
            `SELECT id, turn_number FROM action_history 
             WHERE game_id = ? AND player_id = ? AND action_id = ?
             ORDER BY turn_number DESC, id DESC LIMIT 3`,
            [gameId, playerId, actionId]
        );

        const repeatCount = history.length;
        if (repeatCount < 2) return 1.0;
        
        const penalty = Math.pow(0.7, repeatCount - 2);
        return Math.max(0.3, penalty);
    }

    getCharismaModifier(charismaPoints) {
        return 1.0 + (charismaPoints / 100);
    }

    // ============================================================
    // CAMPAIGN EXECUTION - NEW SYSTEM
    // ============================================================

    // Execute a campaign action using new calculation:
    // Support Gain = Reached Population × Candidate Coefficient × Modifiers
    async executeCampaignAction(gameId, playerId, actionId, regionIds) {
        const [actions] = await this.db.execute('SELECT * FROM actions WHERE id = ?', [actionId]);
        if (actions.length === 0) throw new Error('Action not found');
        
        const action = actions[0];
        const [players] = await this.db.execute('SELECT * FROM game_players WHERE id = ?', [playerId]);
        if (players.length === 0) throw new Error('Player not found');
        
        const player = players[0];
        const [games] = await this.db.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) throw new Error('Game not found');
        
        const game = games[0];

        let rules = {};
        try {
            rules = typeof action.rules === 'string' ? JSON.parse(action.rules || '{}') : (action.rules || {});
        } catch (e) {
            rules = {};
        }

        if (rules.last_week_only && game.current_turn < game.max_turns - 1) {
            throw new Error('This action is only available in the final turn');
        }

        const isGlobal = rules.scope === 'global';
        const regionIdList = Array.isArray(regionIds) ? regionIds : (regionIds != null ? [regionIds] : []);
        if (!isGlobal && regionIdList.length === 0) {
            throw new Error('Select at least one region for local campaign');
        }

        // Local: validate no region is at 100%, and de-dupe
        const uniqueRegionIds = [...new Set(regionIdList.map(id => parseInt(id, 10)).filter(Boolean))];
        if (!isGlobal) {
            for (const rid of uniqueRegionIds) {
                const [regionSupportRows] = await this.db.execute(
                    `SELECT support_percentage FROM regional_support 
                     WHERE game_id = ? AND region_id = ?`,
                    [gameId, rid]
                );
                const regionSum = regionSupportRows.reduce((s, r) => s + parseFloat(r.support_percentage || 0), 0);
                if (regionSum >= 0.9999) {
                    throw new Error(`Region is already at 100% support; cannot run campaign there.`);
                }
            }
        }

        const baseCost = parseFloat(action.base_cost);
        const regionCount = isGlobal ? 1 : uniqueRegionIds.length;
        const totalCost = baseCost * regionCount;
        if (player.budget < totalCost) {
            throw new Error(`Insufficient budget. Need ${totalCost} for ${regionCount} region(s).`);
        }

        // Check charisma cost
        const charismaCost = parseInt(action.charisma_cost) || 0;
        if (charismaCost > 0 && player.charisma_points < charismaCost) {
            throw new Error(`Insufficient charisma points. Need ${charismaCost}, have ${player.charisma_points}`);
        }

        // Get reach coefficient from action
        const reachCoefficient = parseFloat(action.reach_coefficient) || 0.1;
        
        // Get player count for scaling
        const [allPlayersCount] = await this.db.execute(
            'SELECT COUNT(*) as count FROM game_players WHERE game_id = ? AND is_active = TRUE',
            [gameId]
        );
        const playerCount = allPlayersCount[0].count || 2;
        const minSupport = Math.max(0.02, 0.05 - (playerCount - 2) * 0.005);

        // Apply skill discounts (per-region cost)
        let perRegionCost = baseCost;
        const [activeSkills] = await this.db.execute(
            `SELECT * FROM active_skills WHERE game_id = ? AND player_id = ?`,
            [gameId, playerId]
        );
        
        let tvBonus = 1.0;
        for (const skill of activeSkills) {
            let skillData = {};
            try {
                skillData = typeof skill.effect_data === 'string' ? JSON.parse(skill.effect_data || '{}') : (skill.effect_data || {});
            } catch (e) {}
            if (skillData.effect === 'door_discount' && rules.door_discount) {
                perRegionCost = baseCost * (1 - skillData.discount);
            }
            if (skillData.effect === 'tv_bonus' && rules.tv_eligible) {
                tvBonus = 1.0 + skillData.bonus;
            }
        }
        const finalCost = isGlobal ? perRegionCost : perRegionCost * uniqueRegionIds.length;

        await this.db.execute(
            `UPDATE game_players SET budget = budget - ? WHERE id = ?`,
            [finalCost, playerId]
        );
        
        if (charismaCost > 0) {
            await this.db.execute(
                `UPDATE game_players SET charisma_points = charisma_points - ? WHERE id = ?`,
                [charismaCost, playerId]
            );
        }

        await this.db.execute(
            `INSERT INTO spending_history (game_id, player_id, turn_number, action_id, amount, type, description)
             VALUES (?, ?, ?, ?, ?, 'spent', ?)`,
            [gameId, playerId, game.current_turn, actionId, finalCost, action.name]
        );

        // Get fatigue and charisma modifiers
        const fatigue = await this.getFatigueMultiplier(gameId, playerId, actionId);
        const charismaMod = this.getCharismaModifier(player.charisma_points);

        // Random factor: ±1% of obtained support
        const randomFactor = 1 + (Math.random() * 0.02 - 0.01);

        const nationalSupportBefore = await this.calculateNationalSupport(gameId, playerId);

        const candidateId = await this.getPlayerCandidateId(playerId);
        const coefficients = await this.getCandidateAllCoefficients(candidateId);
        const actionCoefficients = await this.getActionAllCoefficients(actionId);

        if (isGlobal) {
            // Global campaign: apply to all regions. Scale down reach so total effect is balanced
            // (otherwise global would dominate - full effect in 18 regions crushes local campaigns)
            const [regions] = await this.db.execute('SELECT * FROM regions ORDER BY id');
            const globalReachScale = regions.length > 0 ? Math.sqrt(regions.length) : 1;
            const effectiveReach = reachCoefficient / globalReachScale;

            const [regionSumsRows] = await this.db.execute(
                `SELECT region_id, SUM(support_percentage) as total FROM regional_support 
                 WHERE game_id = ? GROUP BY region_id`,
                [gameId]
            );
            const regionSumById = {};
            for (const r of regionSumsRows || []) {
                regionSumById[r.region_id] = parseFloat(r.total || 0);
            }
            const regionResults = [];

            for (const region of regions) {
                const sum = regionSumById[region.id] || 0;
                if (sum >= 0.9999) {
                    // Region at 100%: no campaign effect
                    const [cur] = await this.db.execute(
                        `SELECT support_percentage FROM regional_support 
                         WHERE game_id = ? AND player_id = ? AND region_id = ?`,
                        [gameId, playerId, region.id]
                    );
                    const oldSupport = cur.length > 0 ? parseFloat(cur[0].support_percentage) : 0;
                    regionResults.push({
                        region_id: region.id,
                        region_name: region.name,
                        actualGain: 0,
                        oldSupport,
                        newSupport: oldSupport,
                        skippedFull: true
                    });
                    continue;
                }
                const result = await this.applyDemographicCampaign(
                    gameId, playerId, region.id, coefficients, effectiveReach,
                    fatigue, charismaMod, tvBonus, randomFactor, 1.0, minSupport, actionCoefficients
                );
                regionResults.push({
                    region_id: region.id,
                    region_name: region.name,
                    ...result
                });
            }

            const nationalSupportAfter = await this.calculateNationalSupport(gameId, playerId);
            const nationalSupportChange = nationalSupportAfter - nationalSupportBefore;

            await this.db.execute(
                `INSERT INTO action_history (game_id, player_id, turn_number, action_id, region_id, spending_amount, effect_applied)
                 VALUES (?, ?, ?, ?, NULL, ?, ?)`,
                [gameId, playerId, game.current_turn, actionId, finalCost, JSON.stringify({ 
                    global: true, 
                    regions: regionResults, 
                    nationalSupportChange 
                })]
            );

            console.log(`[CAMPAIGN GLOBAL] Player ${playerId}: national change +${(nationalSupportChange * 100).toFixed(2)}%`);
            return { 
                supportGain: nationalSupportChange, 
                cost: finalCost, 
                global: true, 
                regions: regionResults 
            };
        }

        // Local campaign: apply to each selected region, charge per region
        const regionResults = [];
        let totalSupportGain = 0;
        for (const rid of uniqueRegionIds) {
            const hasConflict = await this.checkConflict(gameId, game.current_turn, rid, playerId);
            const conflictMultiplier = hasConflict ? 0.5 : 1.0;
            await this.recordActivity(gameId, game.current_turn, rid, playerId, actionId);
            
            const result = await this.applyDemographicCampaign(
                gameId, playerId, rid, coefficients, reachCoefficient,
                fatigue, charismaMod, tvBonus, randomFactor, conflictMultiplier, minSupport, actionCoefficients
            );

            const [regionInfo] = await this.db.execute('SELECT name FROM regions WHERE id = ?', [rid]);
            const regionName = regionInfo[0]?.name || 'Unknown';

            await this.db.execute(
                `INSERT INTO action_history (game_id, player_id, turn_number, action_id, region_id, spending_amount, effect_applied)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [gameId, playerId, game.current_turn, actionId, rid, perRegionCost, JSON.stringify({ 
                    ...result, 
                    hasConflict,
                    regionName 
                })]
            );

            regionResults.push({ region_id: rid, region_name: regionName, ...result });
            totalSupportGain += result.actualGain || 0;
            console.log(`[CAMPAIGN LOCAL] Player ${playerId}, Region ${regionName}: ${(result.oldSupport * 100).toFixed(1)}% → ${(result.newSupport * 100).toFixed(1)}% (${hasConflict ? 'CONFLICT -50%' : ''})`);
        }
        
        return { 
            supportGain: totalSupportGain, 
            cost: finalCost, 
            global: false,
            regions: regionResults 
        };
    }

    // Apply campaign to all 20 demographic groups in a region
    // coefficients = candidate demographic coefficients; actionCoefficients = campaign-type factors per group (default 1.0)
    async applyDemographicCampaign(gameId, playerId, regionId, coefficients, reach, fatigue, charismaMod, tvBonus, randomFactor, conflictMultiplier, minSupport, actionCoefficients = {}) {
        const [demographics] = await this.db.execute(
            'SELECT ideology, ethnicity, population FROM region_demographics WHERE region_id = ?',
            [regionId]
        );
        const [regionData] = await this.db.execute(
            'SELECT population FROM regions WHERE id = ?',
            [regionId]
        );
        const totalPop = regionData[0]?.population || 1;
        let totalReached = 0;
        let totalSupport = 0;

        for (const demo of demographics) {
            const key = `${demo.ideology}|${demo.ethnicity}`;
            const coef = coefficients[key] || 0.01;
            const actionFactor = actionCoefficients[key] != null ? actionCoefficients[key] : 1.0;
            const reached = demo.population * reach * conflictMultiplier;
            const support = reached * coef * actionFactor * fatigue * charismaMod * tvBonus * randomFactor;
            totalReached += reached;
            totalSupport += support;
        }
        
        // Convert to percentage of region population
        const supportGainPercent = totalPop > 0 ? totalSupport / totalPop : 0;
        
        // Apply to regional_support table
        const result = await this.applyRegionalSupportGain(gameId, playerId, regionId, supportGainPercent, minSupport);
        
        return {
            ...result,
            reached: Math.round(totalReached),
            avgCoefficient: totalReached > 0 ? (totalSupport / totalReached) : 0
        };
    }

    // Apply support gain to a region (no zero-sum - each player's support is independent)
    async applyRegionalSupportGain(gameId, playerId, regionId, supportGain, minSupport) {
        const [cur] = await this.db.execute(
            `SELECT support_percentage FROM regional_support 
             WHERE game_id = ? AND player_id = ? AND region_id = ?`,
            [gameId, playerId, regionId]
        );
        
        if (cur.length === 0) return { actualGain: 0, oldSupport: 0, newSupport: 0 };
        
        const oldSupport = parseFloat(cur[0].support_percentage);
        
        // Limit gain to max 95%
        const actualGain = Math.min(supportGain, 0.95 - oldSupport);
        const newSupport = Math.max(minSupport, Math.min(0.95, oldSupport + actualGain));
        
        // Update player's support
        await this.db.execute(
            `UPDATE regional_support SET support_percentage = ? 
             WHERE game_id = ? AND player_id = ? AND region_id = ?`,
            [newSupport, gameId, playerId, regionId]
        );
        
        return { actualGain, oldSupport, newSupport };
    }

    // ============================================================
    // FUNDRAISING
    // ============================================================

    async executeFundraisingAction(gameId, playerId, actionId) {
        const [actions] = await this.db.execute('SELECT * FROM actions WHERE id = ?', [actionId]);
        if (actions.length === 0) throw new Error('Action not found');
        
        const action = actions[0];
        const [players] = await this.db.execute('SELECT * FROM game_players WHERE id = ?', [playerId]);
        if (players.length === 0) throw new Error('Player not found');
        
        const [games] = await this.db.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) throw new Error('Game not found');

        let rules = {};
        try {
            rules = typeof action.rules === 'string' ? JSON.parse(action.rules || '{}') : (action.rules || {});
        } catch (e) {
            rules = {};
        }
        
        // Check once per game
        if (rules.once_per_game) {
            const [used] = await this.db.execute(
                `SELECT * FROM used_actions WHERE game_id = ? AND player_id = ? AND action_id = ?`,
                [gameId, playerId, actionId]
            );
            if (used.length > 0) {
                throw new Error('This action can only be used once per game');
            }
        }

        let budgetGain = parseFloat(action.base_budget_gain);
        const fatigue = await this.getFatigueMultiplier(gameId, playerId, actionId);
        
        // Foreign aid bonus
        const [activeSkills] = await this.db.execute(
            `SELECT * FROM active_skills WHERE game_id = ? AND player_id = ?`,
            [gameId, playerId]
        );
        
        for (const skill of activeSkills) {
            let skillData = {};
            try {
                skillData = typeof skill.effect_data === 'string' ? JSON.parse(skill.effect_data || '{}') : (skill.effect_data || {});
            } catch (e) {}
            if (skillData.effect === 'foreign_aid') {
                budgetGain = budgetGain * (1 + skillData.bonus);
            }
        }

        budgetGain = budgetGain * fatigue;
        
        // Random factor: ±10%
        const randomFactor = 1.0 + (Math.random() * 0.2 - 0.1);
        budgetGain = budgetGain * randomFactor;

        await this.db.execute(
            `UPDATE game_players SET budget = budget + ? WHERE id = ?`,
            [budgetGain, playerId]
        );

        await this.db.execute(
            `INSERT INTO spending_history (game_id, player_id, turn_number, action_id, amount, type, description)
             VALUES (?, ?, ?, ?, ?, 'earned', ?)`,
            [gameId, playerId, games[0].current_turn, actionId, budgetGain, action.name]
        );

        if (rules.once_per_game) {
            await this.db.execute(
                `INSERT INTO used_actions (game_id, player_id, action_id) VALUES (?, ?, ?)`,
                [gameId, playerId, actionId]
            );
        }

        await this.db.execute(
            `INSERT INTO action_history (game_id, player_id, turn_number, action_id, spending_amount, effect_applied)
             VALUES (?, ?, ?, ?, 0, ?)`,
            [gameId, playerId, games[0].current_turn, actionId, JSON.stringify({ budgetGain })]
        );

        return { budgetGain };
    }

    // ============================================================
    // SKILLS
    // ============================================================

    async executeSkillAction(gameId, playerId, actionId) {
        const [actions] = await this.db.execute('SELECT * FROM actions WHERE id = ?', [actionId]);
        if (actions.length === 0) throw new Error('Action not found');
        
        const action = actions[0];
        let rules = {};
        try {
            rules = typeof action.rules === 'string' ? JSON.parse(action.rules || '{}') : (action.rules || {});
        } catch (e) {
            rules = {};
        }
        
        const [games] = await this.db.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) throw new Error('Game not found');
        
        const [players] = await this.db.execute('SELECT * FROM game_players WHERE id = ?', [playerId]);
        if (players.length === 0) throw new Error('Player not found');
        const player = players[0];
        
        const charismaCost = parseInt(action.charisma_cost) || 0;
        if (charismaCost > 0 && player.charisma_points < charismaCost) {
            throw new Error(`Insufficient charisma points. Need ${charismaCost}, have ${player.charisma_points}`);
        }

        const duration = rules.duration || 3;

        if (charismaCost > 0) {
            await this.db.execute(
                `UPDATE game_players SET charisma_points = charisma_points - ? WHERE id = ?`,
                [charismaCost, playerId]
            );
        }

        await this.db.execute(
            `INSERT INTO active_skills (game_id, player_id, action_id, turns_remaining, effect_data)
             VALUES (?, ?, ?, ?, ?)`,
            [gameId, playerId, actionId, duration, action.rules]
        );

        await this.db.execute(
            `INSERT INTO action_history (game_id, player_id, turn_number, action_id, effect_applied)
             VALUES (?, ?, ?, ?, ?)`,
            [gameId, playerId, games[0].current_turn, actionId, JSON.stringify({ skillActivated: true, charismaCost })]
        );

        return { skillActivated: true, duration, charismaCost };
    }

    // ============================================================
    // SUPPORT CALCULATIONS
    // ============================================================

    // Calculate support as simple average of regional support (no population weighting)
    async calculateNationalSupport(gameId, playerId) {
        try {
            const [supports] = await this.db.execute(
                `SELECT support_percentage FROM regional_support 
                 WHERE game_id = ? AND player_id = ?`,
                [gameId, playerId]
            );

            if (supports.length === 0) {
                console.warn(`[CALC SUPPORT] No regional support found for player ${playerId}`);
                return 0.20;
            }

            let sum = 0;
            for (const row of supports) {
                sum += parseFloat(row.support_percentage);
            }
            return sum / supports.length;
        } catch (error) {
            console.error(`[CALC SUPPORT] Error for player ${playerId}:`, error);
            return 0.20;
        }
    }

    // Cap regional support at 100%
    async capRegionalSupportAt100(gameId) {
        const [regions] = await this.db.execute('SELECT id FROM regions');
        for (const { id: regionId } of regions) {
            const [rows] = await this.db.execute(
                `SELECT player_id, support_percentage FROM regional_support 
                 WHERE game_id = ? AND region_id = ?`,
                [gameId, regionId]
            );
            if (rows.length === 0) continue;
            const sum = rows.reduce((s, r) => s + parseFloat(r.support_percentage || 0), 0);
            if (sum <= 1.0) continue;
            const scale = 1.0 / sum;
            for (const r of rows) {
                const capped = parseFloat(r.support_percentage) * scale;
                await this.db.execute(
                    `UPDATE regional_support SET support_percentage = ? 
                     WHERE game_id = ? AND player_id = ? AND region_id = ?`,
                    [capped, gameId, r.player_id, regionId]
                );
            }
        }
    }

    // Regions at 100%: next turn each candidate loses 5% of their share (proportional decay)
    async applyFullRegionDecay(gameId) {
        const [regions] = await this.db.execute('SELECT id FROM regions');
        const minSupport = 0.02;
        for (const { id: regionId } of regions) {
            const [rows] = await this.db.execute(
                `SELECT player_id, support_percentage FROM regional_support 
                 WHERE game_id = ? AND region_id = ?`,
                [gameId, regionId]
            );
            if (rows.length === 0) continue;
            const sum = rows.reduce((s, r) => s + parseFloat(r.support_percentage || 0), 0);
            if (sum < 0.9999) continue;
            for (const r of rows) {
                const current = parseFloat(r.support_percentage || 0);
                const decayed = Math.max(minSupport, current * 0.95);
                await this.db.execute(
                    `UPDATE regional_support SET support_percentage = ? 
                     WHERE game_id = ? AND player_id = ? AND region_id = ?`,
                    [decayed, gameId, r.player_id, regionId]
                );
            }
        }
    }

    // ============================================================
    // TURN MANAGEMENT
    // ============================================================

    async endTurn(gameId) {
        const [games] = await this.db.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) throw new Error('Game not found');
        
        const game = games[0];

        // Regions at 100%: each candidate loses 5% of their share at the start of next turn
        await this.applyFullRegionDecay(gameId);

        // Update active skills
        await this.db.execute(
            `UPDATE active_skills SET turns_remaining = turns_remaining - 1 
             WHERE game_id = ? AND turns_remaining > 0`,
            [gameId]
        );

        await this.db.execute(
            `DELETE FROM active_skills WHERE game_id = ? AND turns_remaining <= 0`,
            [gameId]
        );

        // Add charisma
        await this.db.execute(
            `UPDATE game_players SET charisma_points = charisma_points + 5 
             WHERE game_id = ? AND is_active = TRUE`,
            [gameId]
        );

        // Increment turn (cap at max_turns to avoid "31/30" display when game completes)
        const newTurn = game.current_turn + 1;
        const displayTurn = newTurn > game.max_turns ? game.max_turns : newTurn;
        await this.db.execute(
            `UPDATE games SET current_turn = ?, current_player_turn = 1 WHERE id = ?`,
            [displayTurn, gameId]
        );

        // Snapshot support history
        await this.db.execute(
            `INSERT INTO support_history (game_id, player_id, region_id, turn_number, support_percentage)
             SELECT game_id, player_id, region_id, ?, support_percentage
             FROM regional_support
             WHERE game_id = ?
             ON DUPLICATE KEY UPDATE support_percentage = VALUES(support_percentage)`,
            [newTurn, gameId]
        );

        // Clear turn completions
        await this.db.execute(
            `DELETE FROM turn_completions WHERE game_id = ? AND turn_number = ?`,
            [gameId, newTurn]
        );

        // Clear turn region activity for new turn
        // (Keep old turns for history)

        // Check if game complete
        if (newTurn > game.max_turns) {
            await this.db.execute(
                `UPDATE games SET status = 'completed' WHERE id = ?`,
                [gameId]
            );
            await this.calculatePresidentialElection(gameId);
        }

        return { newTurn, isComplete: newTurn > game.max_turns };
    }

    // ============================================================
    // ELECTION CALCULATION
    // ============================================================

    async calculatePresidentialElection(gameId) {
        try {
            console.log(`[ELECTION] Starting calculation for game ${gameId}`);
            
            const [playersRaw] = await this.db.execute(
                `SELECT gp.id, COALESCE(gp.candidate_name, c.name) AS candidate_name, gp.ethnicity, gp.ideology, gp.is_ai
                 FROM game_players gp
                 LEFT JOIN candidates c ON gp.candidate_id = c.id
                 WHERE gp.game_id = ? AND gp.is_active = TRUE`,
                [gameId]
            );

            if (playersRaw.length === 0) {
                throw new Error(`No players found for game ${gameId}`);
            }
            
            const players = [];
            for (const p of playersRaw) {
                const nationalSupport = await this.calculateNationalSupport(gameId, p.id);
                players.push({ ...p, national_support: nationalSupport });
            }

            const [regions] = await this.db.execute(
                `SELECT SUM(population) as total_population FROM regions`
            );
            const totalPopulation = regions[0]?.total_population || 0;

            if (totalPopulation === 0) {
                throw new Error('Total population is 0');
            }

            // Voter turnout: 50-60%
            const voterTurnout = 0.50 + (Math.random() * 0.10);
            const totalVoters = Math.floor(totalPopulation * voterTurnout);

            // Calculate votes
            const candidateSupports = players.map(player => {
                const baseSupport = parseFloat(player.national_support) || 0;
                const randomFactor = (Math.random() * 0.04) - 0.02;
                const adjustedSupport = Math.max(0.01, baseSupport + randomFactor);
                return { player, baseSupport, adjustedSupport };
            });
            
            const totalAdjustedSupport = candidateSupports.reduce((sum, c) => sum + c.adjustedSupport, 0);
            
            const electionResults = candidateSupports.map(({ player, baseSupport, adjustedSupport }) => {
                const normalizedSupport = totalAdjustedSupport > 0 
                    ? adjustedSupport / totalAdjustedSupport 
                    : 1 / players.length;
                const votes = Math.floor(totalVoters * normalizedSupport);
                
                return {
                    player_id: player.id,
                    candidate_name: player.candidate_name,
                    ethnicity: player.ethnicity,
                    ideology: player.ideology,
                    is_ai: player.is_ai,
                    support_percentage: baseSupport,
                    adjusted_support: normalizedSupport,
                    votes: votes,
                    vote_percentage: normalizedSupport * 100
                };
            });

            // Fix rounding
            const totalVotes = electionResults.reduce((sum, r) => sum + r.votes, 0);
            const difference = totalVoters - totalVotes;
            if (difference !== 0 && electionResults.length > 0) {
                const winner = electionResults.reduce((max, r) => r.votes > max.votes ? r : max);
                winner.votes += difference;
                winner.vote_percentage = (winner.votes / totalVoters) * 100;
            }

            electionResults.sort((a, b) => b.votes - a.votes);
            const winner = electionResults[0];

            // Create election_results table if needed
            try {
                await this.db.execute(`SELECT 1 FROM election_results LIMIT 1`);
            } catch {
                await this.db.execute(`
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
                        UNIQUE KEY unique_game_player (game_id, player_id)
                    )
                `);
            }
            
            for (const result of electionResults) {
                await this.db.execute(
                    `INSERT INTO election_results 
                     (game_id, player_id, candidate_name, votes, vote_percentage, support_percentage, is_winner)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                     votes = VALUES(votes),
                     vote_percentage = VALUES(vote_percentage),
                     support_percentage = VALUES(support_percentage),
                     is_winner = VALUES(is_winner)`,
                    [gameId, result.player_id, result.candidate_name, result.votes, 
                     result.vote_percentage, result.support_percentage, 
                     result.player_id === winner.player_id ? 1 : 0]
                );
            }

            // Store voter turnout
            try {
                await this.db.execute(
                    `UPDATE games SET voter_turnout = ?, total_voters = ? WHERE id = ?`,
                    [voterTurnout, totalVoters, gameId]
                );
            } catch (e) {
                console.warn(`[ELECTION] Could not update voter turnout:`, e.message);
            }

            console.log(`[ELECTION] Winner: ${winner.candidate_name} with ${winner.votes} votes`);

            return {
                total_voters: totalVoters,
                voter_turnout: voterTurnout,
                results: electionResults,
                winner: winner
            };
        } catch (error) {
            console.error('[ELECTION] Error:', error);
            throw error;
        }
    }
}
