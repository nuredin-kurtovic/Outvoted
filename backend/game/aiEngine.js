// AI Engine - Strategic planning and reasoning for AI opponents

export class AIEngine {
    constructor(db, gameEngine) {
        this.db = db;
        this.gameEngine = gameEngine;
    }

    parseRules(rawRules) {
        if (!rawRules) return {};
        if (typeof rawRules === 'object') return rawRules;
        try {
            return JSON.parse(rawRules);
        } catch (error) {
            console.error('[AI ENGINE] Error parsing action rules:', error);
            return {};
        }
    }

    /**
     * Load full game context for strategic planning
     */
    async loadGameContext(gameId, playerId) {
        const [games] = await this.db.execute('SELECT * FROM games WHERE id = ?', [gameId]);
        if (games.length === 0) return null;
        const game = games[0];

        const [players] = await this.db.execute(
            `SELECT gp.*, c.ethnicity, c.ideology 
             FROM game_players gp 
             LEFT JOIN candidates c ON gp.candidate_id = c.id 
             WHERE gp.game_id = ? AND gp.is_active = TRUE`,
            [gameId]
        );
        if (players.length === 0) return null;

        const [regions] = await this.db.execute(
            `SELECT id, name, population FROM regions ORDER BY population DESC`
        );

        // Regional support for ALL players (for swing/competition analysis)
        const [allRegional] = await this.db.execute(
            `SELECT rs.player_id, rs.region_id, rs.support_percentage, r.population
             FROM regional_support rs
             JOIN regions r ON rs.region_id = r.id
             WHERE rs.game_id = ?`,
            [gameId]
        );

        // Region totals (for full-region check)
        const [regionSums] = await this.db.execute(
            `SELECT region_id, SUM(support_percentage) as total FROM regional_support 
             WHERE game_id = ? GROUP BY region_id`,
            [gameId]
        );
        const fullRegionIds = new Set(
            (regionSums || []).filter(r => parseFloat(r.total || 0) >= 0.9999).map(r => r.region_id)
        );

        // Per-region: who leads, margin, my support
        const regionData = {};
        for (const r of regions) {
            const playerSupports = allRegional
                .filter(x => x.region_id === r.id)
                .map(x => ({ playerId: x.player_id, support: parseFloat(x.support_percentage || 0) }))
                .sort((a, b) => b.support - a.support);
            const leader = playerSupports[0];
            const myEntry = playerSupports.find(x => x.playerId === playerId);
            const mySupport = myEntry ? myEntry.support : 0;
            const leaderSupport = leader ? leader.support : 0;
            const margin = leader ? leaderSupport - mySupport : 0;
            const isLeading = leader && leader.playerId === playerId;
            regionData[r.id] = {
                id: r.id,
                name: r.name,
                population: parseFloat(r.population || 0),
                playerSupports,
                leaderId: leader?.playerId,
                mySupport,
                leaderSupport,
                margin,
                isLeading,
                isFull: fullRegionIds.has(r.id),
                isSwing: !isLeading && margin < 0.20 && margin > 0.02, // Close race, winnable
                isWeak: !isLeading && mySupport < 0.25, // Far behind
            };
        }

        // National support for all players
        const nationalByPlayer = {};
        for (const p of players) {
            nationalByPlayer[p.id] = await this.gameEngine.calculateNationalSupport(gameId, p.id);
        }
        const sortedByNational = [...players].sort(
            (a, b) => (nationalByPlayer[b.id] || 0) - (nationalByPlayer[a.id] || 0)
        );
        const nationalLeader = sortedByNational[0];
        const myNational = nationalByPlayer[playerId] || 0;
        const nationalGap = nationalLeader ? (nationalByPlayer[nationalLeader.id] || 0) - myNational : 0;
        const isNationalLeader = nationalLeader && nationalLeader.id === playerId;
        const rank = sortedByNational.findIndex(p => p.id === playerId) + 1;

        const player = players.find(p => p.id === playerId);
        const mySupports = allRegional
            .filter(x => x.player_id === playerId)
            .map(x => ({ regionId: x.region_id, support: parseFloat(x.support_percentage || 0) }))
            .sort((a, b) => a.support - b.support);

        return {
            game,
            player,
            players,
            regions,
            regionData,
            fullRegionIds,
            nationalByPlayer,
            myNational,
            nationalGap,
            isNationalLeader,
            rank,
            mySupports,
            turnsLeft: Math.max(0, (game.max_turns || 30) - (game.current_turn || 1)),
            currentTurn: game.current_turn,
            maxTurns: game.max_turns,
        };
    }

    /**
     * Strategic phase: early / mid / late game
     */
    getPhase(ctx) {
        const pct = ctx.currentTurn / ctx.maxTurns;
        if (pct < 0.35) return 'early';
        if (pct < 0.7) return 'mid';
        return 'late';
    }

    /**
     * Determine overall strategy: campaign, fundraising, or skill (with per-AI variance)
     */
    determineStrategy(ctx, actions, usedActionIds) {
        const { player, nationalGap, isNationalLeader, turnsLeft } = ctx;
        const budget = parseFloat(player.budget || 0);
        const phase = this.getPhase(ctx);
        const personality = this.getPersonality(player.id);

        const campaignCosts = actions
            .filter(a => a.type === 'campaign')
            .map(a => parseFloat(a.base_cost) || 0);
        const minCampaignCost = campaignCosts.length ? Math.min(...campaignCosts) : 50000;
        const avgCampaignCost = campaignCosts.length
            ? campaignCosts.reduce((a, b) => a + b, 0) / campaignCosts.length
            : 50000;

        if (budget < minCampaignCost * 0.8) {
            return { type: 'fundraising', reason: 'budget_critical' };
        }

        const fundraiseThreshold = 80000 + (personality.aggressiveness < 0.5 ? 30000 : 0);
        if (phase === 'early' && budget < fundraiseThreshold && turnsLeft > 10) {
            return { type: 'fundraising', reason: 'early_build' };
        }

        if (phase === 'late' && !isNationalLeader && nationalGap > 0.05) {
            return { type: 'campaign', reason: 'late_push' };
        }

        const runway = budget / avgCampaignCost;
        const runwayThreshold = personality.aggressiveness > 0.7 ? 1.5 : 2;
        if (runway < runwayThreshold && turnsLeft > 3 && phase !== 'late') {
            return { type: 'fundraising', reason: 'runway_low' };
        }

        return { type: 'campaign', reason: 'default' };
    }

    /**
     * Rank campaignable regions by strategic value (with per-AI variance)
     */
    rankTargetRegions(ctx) {
        const { regionData, player } = ctx;
        const campaignable = Object.values(regionData).filter(r => !r.isFull);
        const personality = this.getPersonality(player.id);

        return campaignable
            .map((r, idx) => {
                let score = 0;
                if (r.isSwing) score += 40;
                if (r.isWeak) score += 25;
                score += Math.min(15, (r.population / 500000) * 2);
                if (r.isLeading) score -= 20;
                score += Math.max(-15, (0.20 - r.margin) * 50);
                // Per-AI variance: some prefer population, some prefer swing, etc.
                const regionBias = ((player.id * 7 + idx) % 100) / 50 - 1;
                score += regionBias * 12;
                return { ...r, targetScore: score };
            })
            .sort((a, b) => b.targetScore - a.targetScore);
    }

    /**
     * Per-player "personality" - deterministic from playerId so each AI behaves differently
     */
    getPersonality(playerId) {
        const h = (playerId * 2654435761) >>> 0; // simple hash
        return {
            preferLocal: (h % 100) < 45,      // 45% lean local, 55% global
            aggressiveness: 0.3 + ((h >> 8) % 70) / 100,   // 0.3–1.0
            riskTolerance: ((h >> 16) % 100) / 100,        // 0–1
            actionBias: (h >> 24) % 5,                     // 0–4, shifts preferred action tier
        };
    }

    /**
     * Choose best campaign action with planning (varied per AI player)
     */
    chooseCampaignAction(ctx, campaignActions, rankedRegions) {
        const { player, nationalGap, isNationalLeader, phase } = ctx;
        const budget = parseFloat(player.budget || 0);
        const personality = this.getPersonality(player.id);

        const globalCampaigns = campaignActions.filter(a => {
            const rules = this.parseRules(a.rules);
            return rules.scope === 'global';
        });
        const localCampaigns = campaignActions.filter(a => {
            const rules = this.parseRules(a.rules);
            return rules.scope !== 'global';
        });

        // Cost-efficiency score
        const scoreAction = (a) => {
            const cost = Math.max(1000, parseFloat(a.base_cost) || 10000);
            const gain = parseFloat(a.base_support_gain) || 0;
            return gain / (cost / 10000);
        };

        const affordableGlobal = globalCampaigns.filter(a => parseFloat(a.base_cost) <= budget);
        const affordableLocal = localCampaigns.filter(a => parseFloat(a.base_cost) <= budget);

        // Strategic bias + personality (each AI has different preferences)
        const basePreferLocal = phase === 'late' || (!isNationalLeader && nationalGap > 0.03);
        const basePreferGlobal = phase === 'early' || (isNationalLeader && nationalGap < 0.05);
        const preferLocal = personality.preferLocal ? basePreferLocal || true : basePreferLocal;
        const preferGlobal = !personality.preferLocal ? basePreferGlobal || true : basePreferGlobal;

        const allAffordable = [
            ...affordableGlobal.map((a, idx) => ({
                a,
                scope: 'global',
                baseScore: scoreAction(a) * (preferGlobal ? 1.3 : 1),
                idx,
            })),
            ...affordableLocal.map((a, idx) => ({
                a,
                scope: 'local',
                baseScore: scoreAction(a) * (preferLocal ? 1.4 : 1),
                idx: idx + affordableGlobal.length,
            })),
        ];

        // Add per-player variance: shuffle order by personality + small random
        const variance = 0.15 * personality.riskTolerance + 0.1 * (Math.random() - 0.5);
        allAffordable.forEach((c, i) => {
            c.score = c.baseScore * (1 + variance + (personality.actionBias === i % 5 ? 0.2 : 0));
        });
        allAffordable.sort((x, y) => y.score - x.score);

        if (allAffordable.length === 0) return null;

        // Pick from top 5 with stronger randomness so different AIs spread out
        const topN = Math.min(5, allAffordable.length);
        const topCandidates = allAffordable.slice(0, topN);
        const weights = topCandidates.map((_, i) => Math.pow(topN - i, 1.5));
        const totalWeight = weights.reduce((s, w) => s + w, 0);
        let r = Math.random() * totalWeight;
        for (let i = 0; i < topCandidates.length; i++) {
            r -= weights[i];
            if (r <= 0) return topCandidates[i];
        }
        return topCandidates[0];
    }

    /**
     * Select region(s) for local campaign – single or multi-region (varied per AI)
     */
    selectRegionTargets(ctx, chosen, rankedRegions) {
        const { player } = ctx;
        const phase = this.getPhase(ctx);
        const budget = parseFloat(player.budget || 0);
        const baseCost = parseFloat(chosen.a.base_cost) || 15000;
        const personality = this.getPersonality(player.id);

        let maxRegions = 1;
        for (let n = 2; n <= 5; n++) {
            if (budget >= baseCost * n) maxRegions = n;
        }

        const preferredMax = phase === 'late' ? 2 : 3;
        let targetCount = Math.min(maxRegions, Math.min(preferredMax, rankedRegions.length));

        if (maxRegions >= 2 && targetCount >= 2) {
            if (personality.aggressiveness < 0.5) targetCount = 1;
            else if (personality.aggressiveness > 0.8 && maxRegions >= 3) targetCount = Math.min(3, targetCount);
        }

        const available = rankedRegions.slice(0, 8);
        if (available.length === 0) return [];
        return available.slice(0, Math.max(1, targetCount)).map(r => r.id);
    }

    // Get AI's next move with full planning
    async getAIMove(gameId, playerId) {
        try {
            const ctx = await this.loadGameContext(gameId, playerId);
            if (!ctx) return null;

            const { game, player, fullRegionIds } = ctx;
            const phase = this.getPhase(ctx);

            // Actions and used
            const [actions] = await this.db.execute('SELECT * FROM actions ORDER BY type, name');
            const [usedActions] = await this.db.execute(
                'SELECT action_id FROM used_actions WHERE game_id = ? AND player_id = ?',
                [gameId, playerId]
            );
            const usedActionIds = usedActions.map(u => u.action_id);

            const strategy = this.determineStrategy(ctx, actions, usedActionIds);

            // --- FUNDRAISING ---
            if (strategy.type === 'fundraising') {
                const fundraisingActions = actions.filter(
                    (a) =>
                        a.type === 'fundraising' &&
                        !usedActionIds.includes(a.id) &&
                        (() => {
                            const rules = this.parseRules(a.rules);
                            return !rules.once_per_game || !usedActionIds.includes(a.id);
                        })()
                );

                if (fundraisingActions.length > 0) {
                    const personality = this.getPersonality(player.id);
                    const sorted = [...fundraisingActions].sort(
                        (a, b) => parseFloat(b.base_budget_gain) - parseFloat(a.base_budget_gain)
                    );
                    const topCount = Math.min(3, sorted.length);
                    const idx = (personality.actionBias % topCount + Math.floor(Math.random() * topCount)) % topCount;
                    const pick = sorted[idx] ?? sorted[0];
                    return {
                        action_id: pick.id,
                        region_id: null,
                        region_ids: null,
                        spending_amount: 0,
                    };
                }
            }

            // --- CAMPAIGN ---
            const rankedRegions = this.rankTargetRegions(ctx);

            const campaignActions = actions.filter((a) => {
                if (a.type !== 'campaign') return false;
                const cost = parseFloat(a.base_cost) || 0;
                if (cost > player.budget) return false;
                const rules = this.parseRules(a.rules);
                if (rules.last_week_only && game.current_turn < game.max_turns - 1)
                    return false;
                return true;
            });

            if (campaignActions.length > 0) {
                const chosen = this.chooseCampaignAction(ctx, campaignActions, rankedRegions);
                if (!chosen) return null;

                const rules = this.parseRules(chosen.a.rules);
                const isGlobal = rules.scope === 'global';

                if (isGlobal) {
                    return {
                        action_id: chosen.a.id,
                        region_id: null,
                        region_ids: null,
                        spending_amount: 0,
                    };
                }

                // Local: select region(s)
                const regionIds = this.selectRegionTargets(ctx, chosen, rankedRegions);
                if (regionIds.length === 0) {
                    // Fallback to global if no valid local target
                    const affordableGlobal = campaignActions.filter(
                        (a) => this.parseRules(a.rules).scope === 'global' && parseFloat(a.base_cost) <= player.budget
                    );
                    if (affordableGlobal.length > 0) {
                        const pick = affordableGlobal[Math.floor(Math.random() * Math.min(3, affordableGlobal.length))];
                        return {
                            action_id: pick.id,
                            region_id: null,
                            region_ids: null,
                            spending_amount: 0,
                        };
                    }
                    return null;
                }

                return {
                    action_id: chosen.a.id,
                    region_id: regionIds[0], // backward compat
                    region_ids: regionIds,
                    spending_amount: 0,
                };
            }

            // --- SKILL FALLBACK ---
            const skillActions = actions.filter((a) => a.type === 'skill');
            if (skillActions.length > 0) {
                return {
                    action_id: skillActions[0].id,
                    region_id: null,
                    region_ids: null,
                    spending_amount: 0,
                };
            }

            return null;
        } catch (error) {
            console.error('[AI ENGINE] getAIMove error:', error);
            return null;
        }
    }

    // Execute AI's turn
    async executeAITurn(gameId, playerId) {
        console.log(`[AI ENGINE] Getting move for AI player ${playerId} in game ${gameId}`);
        const move = await this.getAIMove(gameId, playerId);
        if (!move) {
            console.error('[AI ENGINE] AI could not determine move');
            return null;
        }

        const regionDisplay = move.region_ids?.length
            ? move.region_ids.join(',')
            : move.region_id || 'global';
        console.log(`[AI ENGINE] AI chose action ${move.action_id}, region(s): ${regionDisplay}`);

        try {
            const [actions] = await this.db.execute('SELECT * FROM actions WHERE id = ?', [
                move.action_id,
            ]);
            if (actions.length === 0) {
                console.error(`[AI ENGINE] Action ${move.action_id} not found`);
                return null;
            }
            const action = actions[0];

            console.log(`[AI ENGINE] Executing ${action.type} action: ${action.name}`);

            let result;
            switch (action.type) {
                case 'campaign': {
                    const regionIds = Array.isArray(move.region_ids)
                        ? move.region_ids
                        : move.region_id != null
                          ? [move.region_id]
                          : [];
                    result = await this.gameEngine.executeCampaignAction(
                        gameId,
                        playerId,
                        move.action_id,
                        regionIds
                    );
                    console.log(`[AI ENGINE] Campaign result:`, result);
                    break;
                }
                case 'fundraising':
                    result = await this.gameEngine.executeFundraisingAction(
                        gameId,
                        playerId,
                        move.action_id
                    );
                    console.log(`[AI ENGINE] Fundraising result:`, result);
                    break;
                case 'skill':
                    result = await this.gameEngine.executeSkillAction(
                        gameId,
                        playerId,
                        move.action_id
                    );
                    console.log(`[AI ENGINE] Skill result:`, result);
                    break;
                default:
                    console.error(`[AI ENGINE] Unknown action type: ${action.type}`);
                    return null;
            }

            return result;
        } catch (error) {
            console.error('[AI ENGINE] Error executing AI turn:', error);
            console.error(`[AI ENGINE] Error stack:`, error.stack);
            return null;
        }
    }
}
