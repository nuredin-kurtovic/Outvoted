import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for candidate image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/uploads/candidates');
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'candidate-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only image files are allowed'));
    }
});

// ============================================================
// MIDDLEWARE: Check if user is admin
// ============================================================

async function requireAdmin(req, res, next) {
    try {
        const userId = req.user.userId;
        const [admins] = await pool.execute(
            'SELECT * FROM admin_users WHERE user_id = ? AND is_admin = TRUE',
            [userId]
        );
        
        if (admins.length === 0) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        next();
    } catch (error) {
        console.error('[ADMIN] Auth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// ============================================================
// CHECK ADMIN STATUS (public - no admin required)
// ============================================================

router.get('/check', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const [admins] = await pool.execute(
            'SELECT * FROM admin_users WHERE user_id = ? AND is_admin = TRUE',
            [userId]
        );
        res.json({ isAdmin: admins.length > 0 });
    } catch (error) {
        console.error('[ADMIN] Check error:', error);
        res.json({ isAdmin: false });
    }
});

// ============================================================
// REGIONS CRUD
// ============================================================

// Get all regions with summary data
router.get('/regions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [regions] = await pool.execute(`
            SELECT r.*,
                (SELECT COUNT(*) FROM region_demographics WHERE region_id = r.id) as demographic_groups
            FROM regions r
            ORDER BY r.id
        `);
        
        res.json({
            regions: regions.map(r => ({
                id: r.id,
                name: r.name,
                code: r.code,
                population: r.population,
                bosniak_pop: r.bosniak_pop,
                croat_pop: r.croat_pop,
                serb_pop: r.serb_pop,
                other_pop: r.other_pop,
                administrative_importance: r.administrative_importance,
                demographic_groups: r.demographic_groups
            }))
        });
    } catch (error) {
        console.error('[ADMIN] Get regions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single region
router.get('/regions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [regions] = await pool.execute('SELECT * FROM regions WHERE id = ?', [id]);
        
        if (regions.length === 0) {
            return res.status(404).json({ error: 'Region not found' });
        }
        
        res.json({ region: regions[0] });
    } catch (error) {
        console.error('[ADMIN] Get region error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update region
router.put('/regions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, code, population, bosniak_pop, croat_pop, serb_pop, other_pop, administrative_importance } = req.body;
        
        await pool.execute(
            `UPDATE regions SET 
                name = COALESCE(?, name),
                code = COALESCE(?, code),
                population = COALESCE(?, population),
                bosniak_pop = COALESCE(?, bosniak_pop),
                croat_pop = COALESCE(?, croat_pop),
                serb_pop = COALESCE(?, serb_pop),
                other_pop = COALESCE(?, other_pop),
                administrative_importance = COALESCE(?, administrative_importance)
            WHERE id = ?`,
            [name, code, population, bosniak_pop, croat_pop, serb_pop, other_pop, administrative_importance, id]
        );
        
        const [updated] = await pool.execute('SELECT * FROM regions WHERE id = ?', [id]);
        res.json({ region: updated[0], message: 'Region updated successfully' });
    } catch (error) {
        console.error('[ADMIN] Update region error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create region
router.post('/regions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, code, population, bosniak_pop, croat_pop, serb_pop, other_pop, administrative_importance } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO regions (name, code, population, bosniak_pop, croat_pop, serb_pop, other_pop, administrative_importance)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, code, population || 0, bosniak_pop || 0, croat_pop || 0, serb_pop || 0, other_pop || 0, administrative_importance || 'FBiH']
        );
        
        const [newRegion] = await pool.execute('SELECT * FROM regions WHERE id = ?', [result.insertId]);
        res.status(201).json({ region: newRegion[0], message: 'Region created successfully' });
    } catch (error) {
        console.error('[ADMIN] Create region error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete region
router.delete('/regions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM regions WHERE id = ?', [id]);
        res.json({ message: 'Region deleted successfully' });
    } catch (error) {
        console.error('[ADMIN] Delete region error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// DEMOGRAPHICS CRUD
// ============================================================

// Get all demographics for a region
router.get('/demographics/:regionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { regionId } = req.params;
        
        const [region] = await pool.execute('SELECT name FROM regions WHERE id = ?', [regionId]);
        if (region.length === 0) {
            return res.status(404).json({ error: 'Region not found' });
        }
        
        const [demographics] = await pool.execute(
            `SELECT * FROM region_demographics WHERE region_id = ? ORDER BY ethnicity, ideology`,
            [regionId]
        );
        
        // Calculate totals
        const totalPopulation = demographics.reduce((sum, d) => sum + d.population, 0);
        const byEthnicity = {};
        const byIdeology = {};
        
        for (const d of demographics) {
            byEthnicity[d.ethnicity] = (byEthnicity[d.ethnicity] || 0) + d.population;
            byIdeology[d.ideology] = (byIdeology[d.ideology] || 0) + d.population;
        }
        
        res.json({
            region_id: parseInt(regionId),
            region_name: region[0].name,
            demographics: demographics.map(d => ({
                id: d.id,
                ideology: d.ideology,
                ethnicity: d.ethnicity,
                population: d.population
            })),
            totals: {
                total: totalPopulation,
                by_ethnicity: byEthnicity,
                by_ideology: byIdeology
            }
        });
    } catch (error) {
        console.error('[ADMIN] Get demographics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update demographic group
router.put('/demographics/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { population } = req.body;
        
        await pool.execute(
            'UPDATE region_demographics SET population = ? WHERE id = ?',
            [population, id]
        );
        
        const [updated] = await pool.execute('SELECT * FROM region_demographics WHERE id = ?', [id]);
        res.json({ demographic: updated[0], message: 'Demographic updated successfully' });
    } catch (error) {
        console.error('[ADMIN] Update demographic error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk update demographics for a region
router.put('/demographics/region/:regionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { regionId } = req.params;
        const { demographics } = req.body; // Array of { ideology, ethnicity, population }
        
        if (!Array.isArray(demographics)) {
            return res.status(400).json({ error: 'demographics must be an array' });
        }
        
        for (const d of demographics) {
            await pool.execute(
                `INSERT INTO region_demographics (region_id, ideology, ethnicity, population)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE population = VALUES(population)`,
                [regionId, d.ideology, d.ethnicity, d.population]
            );
        }
        
        const [updated] = await pool.execute(
            'SELECT * FROM region_demographics WHERE region_id = ?',
            [regionId]
        );
        
        res.json({ demographics: updated, message: 'Demographics updated successfully' });
    } catch (error) {
        console.error('[ADMIN] Bulk update demographics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Generate default demographics for a region based on ethnic populations
router.post('/demographics/generate/:regionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { regionId } = req.params;
        
        const [regions] = await pool.execute('SELECT * FROM regions WHERE id = ?', [regionId]);
        if (regions.length === 0) {
            return res.status(404).json({ error: 'Region not found' });
        }
        
        const region = regions[0];
        const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
        const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
        
        // Default ideology distribution
        const ideologyDist = {
            'Socialist Nationalist': 0.20,
            'Liberal Reformist': 0.15,
            'Nationalist Conservative': 0.35,
            'Civic Unitary': 0.15,
            'Populist Anti-System': 0.15
        };
        
        const ethnicPops = {
            'Bosniak': region.bosniak_pop,
            'Serb': region.serb_pop,
            'Croat': region.croat_pop,
            'Other': region.other_pop
        };
        
        // Delete existing demographics
        await pool.execute('DELETE FROM region_demographics WHERE region_id = ?', [regionId]);
        
        // Generate new demographics
        for (const ethnicity of ethnicities) {
            const ethnicPop = ethnicPops[ethnicity] || 0;
            for (const ideology of ideologies) {
                const pop = Math.round(ethnicPop * ideologyDist[ideology]);
                await pool.execute(
                    `INSERT INTO region_demographics (region_id, ideology, ethnicity, population)
                     VALUES (?, ?, ?, ?)`,
                    [regionId, ideology, ethnicity, pop]
                );
            }
        }
        
        const [newDemographics] = await pool.execute(
            'SELECT * FROM region_demographics WHERE region_id = ?',
            [regionId]
        );
        
        res.json({ 
            demographics: newDemographics, 
            message: 'Demographics generated successfully' 
        });
    } catch (error) {
        console.error('[ADMIN] Generate demographics error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// CANDIDATE IMAGE UPLOAD
// ============================================================

// Upload candidate image
router.post('/candidates/:id/image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }
        
        // Get the old image to delete it
        const [oldCandidate] = await pool.execute('SELECT image_url FROM candidates WHERE id = ?', [id]);
        
        // Build the URL path for the uploaded image
        const imageUrl = `/uploads/candidates/${req.file.filename}`;
        
        // Update candidate with new image URL
        await pool.execute('UPDATE candidates SET image_url = ? WHERE id = ?', [imageUrl, id]);
        
        // Delete old image file if it exists and is a local upload
        if (oldCandidate.length > 0 && oldCandidate[0].image_url && oldCandidate[0].image_url.startsWith('/uploads/')) {
            const oldPath = path.join(__dirname, '../public', oldCandidate[0].image_url);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }
        
        res.json({ 
            message: 'Image uploaded successfully',
            image_url: imageUrl
        });
    } catch (error) {
        console.error('[ADMIN] Upload candidate image error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// ============================================================
// CANDIDATES CRUD
// ============================================================

// Get all candidates with coefficients summary
router.get('/candidates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [candidates] = await pool.execute(`
            SELECT c.*, r.name as home_region_name
            FROM candidates c
            LEFT JOIN regions r ON c.home_region_id = r.id
            ORDER BY c.ethnicity, c.name
        `);
        
        res.json({
            candidates: candidates.map(c => ({
                id: c.id,
                name: c.name,
                ethnicity: c.ethnicity,
                ideology: c.ideology,
                home_region_id: c.home_region_id,
                home_region_name: c.home_region_name,
                description: c.description,
                image_url: c.image_url
            }))
        });
    } catch (error) {
        console.error('[ADMIN] Get candidates error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single candidate with all demographic coefficients
router.get('/candidates/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [candidates] = await pool.execute(
            `SELECT c.*, r.name as home_region_name
             FROM candidates c
             LEFT JOIN regions r ON c.home_region_id = r.id
             WHERE c.id = ?`,
            [id]
        );
        
        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        
        const [coefficients] = await pool.execute(
            `SELECT * FROM candidate_demographic_coefficients
             WHERE candidate_id = ?
             ORDER BY ethnicity, ideology`,
            [id]
        );
        
        res.json({
            candidate: candidates[0],
            coefficients: coefficients.map(c => ({
                id: c.id,
                ideology: c.ideology,
                ethnicity: c.ethnicity,
                coefficient: parseFloat(c.coefficient)
            }))
        });
    } catch (error) {
        console.error('[ADMIN] Get candidate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update candidate
router.put('/candidates/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ethnicity, ideology, home_region_id, description, image_url } = req.body;
        
        await pool.execute(
            `UPDATE candidates SET 
                name = COALESCE(?, name),
                ethnicity = COALESCE(?, ethnicity),
                ideology = COALESCE(?, ideology),
                home_region_id = COALESCE(?, home_region_id),
                description = COALESCE(?, description),
                image_url = COALESCE(?, image_url)
            WHERE id = ?`,
            [name, ethnicity, ideology, home_region_id, description, image_url, id]
        );
        
        const [updated] = await pool.execute('SELECT * FROM candidates WHERE id = ?', [id]);
        res.json({ candidate: updated[0], message: 'Candidate updated successfully' });
    } catch (error) {
        console.error('[ADMIN] Update candidate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create candidate
router.post('/candidates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, ethnicity, ideology, home_region_id, description, image_url } = req.body;
        
        const [result] = await pool.execute(
            `INSERT INTO candidates (name, ethnicity, ideology, home_region_id, description, image_url)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, ethnicity, ideology, home_region_id, description, image_url]
        );
        
        // Generate default demographic coefficients for new candidate
        const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
        const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
        
        for (const demoEthnicity of ethnicities) {
            for (const demoIdeology of ideologies) {
                let coefficient = 0.01; // Base coefficient
                
                // Higher coefficient for matching ethnicity
                if (ethnicity === demoEthnicity) {
                    coefficient = 0.50;
                    // Even higher for matching ideology
                    if (ideology === demoIdeology) {
                        coefficient = 0.90;
                    }
                }
                
                await pool.execute(
                    `INSERT INTO candidate_demographic_coefficients (candidate_id, ideology, ethnicity, coefficient)
                     VALUES (?, ?, ?, ?)`,
                    [result.insertId, demoIdeology, demoEthnicity, coefficient.toFixed(3)]
                );
            }
        }
        
        const [newCandidate] = await pool.execute('SELECT * FROM candidates WHERE id = ?', [result.insertId]);
        res.status(201).json({ id: result.insertId, candidate: newCandidate[0], message: 'Candidate created successfully' });
    } catch (error) {
        console.error('[ADMIN] Create candidate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete candidate
router.delete('/candidates/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.execute('DELETE FROM candidate_demographic_coefficients WHERE candidate_id = ?', [id]);
        await pool.execute('DELETE FROM candidates WHERE id = ?', [id]);
        res.json({ message: 'Candidate deleted successfully' });
    } catch (error) {
        console.error('[ADMIN] Delete candidate error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// COEFFICIENTS CRUD - Demographic-based (Candidate × Ethno-Ideological Group)
// ============================================================

// Get coefficient matrix (all candidates x all 20 demographic groups)
router.get('/coefficients', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [candidates] = await pool.execute('SELECT id, name, ethnicity, ideology FROM candidates ORDER BY ethnicity, name');
        const [coefficients] = await pool.execute('SELECT * FROM candidate_demographic_coefficients');
        
        const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
        const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
        
        // Build demographic groups list (20 combinations)
        const demographicGroups = [];
        for (const eth of ethnicities) {
            for (const ideo of ideologies) {
                demographicGroups.push({
                    key: `${eth}|${ideo}`,
                    ethnicity: eth,
                    ideology: ideo,
                    shortCode: `${eth.charAt(0)}-${ideo.split(' ').map(w => w.charAt(0)).join('')}`
                });
            }
        }
        
        // Build matrix: candidate_id -> { "ethnicity|ideology" -> coefficient }
        const matrix = {};
        for (const c of coefficients) {
            if (!matrix[c.candidate_id]) matrix[c.candidate_id] = {};
            const key = `${c.ethnicity}|${c.ideology}`;
            matrix[c.candidate_id][key] = parseFloat(c.coefficient);
        }
        
        res.json({
            candidates: candidates.map(c => ({ 
                id: c.id, 
                name: c.name, 
                ethnicity: c.ethnicity,
                ideology: c.ideology
            })),
            demographicGroups,
            ideologies,
            ethnicities,
            matrix
        });
    } catch (error) {
        console.error('[ADMIN] Get coefficients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update single demographic coefficient
router.put('/coefficients/:candidateId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { ideology, ethnicity, coefficient } = req.body;
        
        // Validate coefficient range
        const coef = Math.min(1.0, Math.max(0.01, parseFloat(coefficient)));
        
        await pool.execute(
            `INSERT INTO candidate_demographic_coefficients (candidate_id, ideology, ethnicity, coefficient)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE coefficient = VALUES(coefficient)`,
            [candidateId, ideology, ethnicity, coef.toFixed(3)]
        );
        
        res.json({ 
            candidate_id: parseInt(candidateId),
            ideology,
            ethnicity,
            coefficient: coef,
            message: 'Coefficient updated successfully' 
        });
    } catch (error) {
        console.error('[ADMIN] Update coefficient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk update all coefficients for a candidate (20 values)
router.put('/coefficients/candidate/:candidateId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { candidateId } = req.params;
        const { coefficients } = req.body; // Array of { ideology, ethnicity, coefficient }
        
        if (!Array.isArray(coefficients)) {
            return res.status(400).json({ error: 'coefficients must be an array' });
        }
        
        for (const c of coefficients) {
            const coef = Math.min(1.0, Math.max(0.01, parseFloat(c.coefficient)));
            await pool.execute(
                `INSERT INTO candidate_demographic_coefficients (candidate_id, ideology, ethnicity, coefficient)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE coefficient = VALUES(coefficient)`,
                [candidateId, c.ideology, c.ethnicity, coef.toFixed(3)]
            );
        }
        
        res.json({ message: 'Coefficients updated successfully' });
    } catch (error) {
        console.error('[ADMIN] Bulk update coefficients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Regenerate default coefficients for a candidate based on ethnic/ideological alignment
router.post('/coefficients/regenerate/:candidateId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { candidateId } = req.params;
        
        const [candidates] = await pool.execute(
            'SELECT ethnicity, ideology FROM candidates WHERE id = ?',
            [candidateId]
        );
        
        if (candidates.length === 0) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        
        const { ethnicity: candEthnicity, ideology: candIdeology } = candidates[0];
        const ideologies = ['Socialist Nationalist', 'Liberal Reformist', 'Nationalist Conservative', 'Civic Unitary', 'Populist Anti-System'];
        const ethnicities = ['Bosniak', 'Serb', 'Croat', 'Other'];
        
        for (const demoEthnicity of ethnicities) {
            for (const demoIdeology of ideologies) {
                let coefficient = 0.01; // Base coefficient
                
                // Higher coefficient for matching ethnicity
                if (candEthnicity === demoEthnicity) {
                    coefficient = 0.40;
                    // Even higher for matching ideology too
                    if (candIdeology === demoIdeology) {
                        coefficient = 0.90;
                    }
                } else if (candIdeology === demoIdeology) {
                    // Some cross-ethnic appeal for same ideology
                    coefficient = 0.15;
                }
                
                await pool.execute(
                    `INSERT INTO candidate_demographic_coefficients (candidate_id, ideology, ethnicity, coefficient)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE coefficient = VALUES(coefficient)`,
                    [candidateId, demoIdeology, demoEthnicity, coefficient.toFixed(3)]
                );
            }
        }
        
        res.json({ message: 'Coefficients regenerated successfully' });
    } catch (error) {
        console.error('[ADMIN] Regenerate coefficients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// ACTIONS / CAMPAIGNS CRUD
// ============================================================

// Get all actions
router.get('/actions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [actions] = await pool.execute('SELECT * FROM actions ORDER BY type, name');
        
        res.json({
            actions: actions.map(a => {
                let rules = {};
                try {
                    rules = typeof a.rules === 'string' ? JSON.parse(a.rules || '{}') : (a.rules || {});
                } catch (e) {}
                
                return {
                    id: a.id,
                    name: a.name,
                    type: a.type,
                    base_cost: parseFloat(a.base_cost),
                    base_support_gain: parseFloat(a.base_support_gain || 0),
                    base_budget_gain: parseFloat(a.base_budget_gain || 0),
                    charisma_cost: a.charisma_cost || 0,
                    reach_coefficient: parseFloat(a.reach_coefficient || 0.1),
                    description: a.description,
                    rules
                };
            })
        });
    } catch (error) {
        console.error('[ADMIN] Get actions error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single action
router.get('/actions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const [actions] = await pool.execute('SELECT * FROM actions WHERE id = ?', [id]);
        
        if (actions.length === 0) {
            return res.status(404).json({ error: 'Action not found' });
        }
        
        const a = actions[0];
        let rules = {};
        try {
            rules = typeof a.rules === 'string' ? JSON.parse(a.rules || '{}') : (a.rules || {});
        } catch (e) {}
        
        res.json({
            action: {
                id: a.id,
                name: a.name,
                type: a.type,
                base_cost: parseFloat(a.base_cost),
                base_support_gain: parseFloat(a.base_support_gain || 0),
                base_budget_gain: parseFloat(a.base_budget_gain || 0),
                charisma_cost: a.charisma_cost || 0,
                reach_coefficient: parseFloat(a.reach_coefficient || 0.1),
                description: a.description,
                rules
            }
        });
    } catch (error) {
        console.error('[ADMIN] Get action error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update action
router.put('/actions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, type, base_cost, base_support_gain, base_budget_gain, 
            charisma_cost, reach_coefficient, description, rules 
        } = req.body;
        
        const rulesJson = rules ? JSON.stringify(rules) : null;
        
        await pool.execute(
            `UPDATE actions SET 
                name = COALESCE(?, name),
                type = COALESCE(?, type),
                base_cost = COALESCE(?, base_cost),
                base_support_gain = COALESCE(?, base_support_gain),
                base_budget_gain = COALESCE(?, base_budget_gain),
                charisma_cost = COALESCE(?, charisma_cost),
                reach_coefficient = COALESCE(?, reach_coefficient),
                description = COALESCE(?, description),
                rules = COALESCE(?, rules)
            WHERE id = ?`,
            [name, type, base_cost, base_support_gain, base_budget_gain, 
             charisma_cost, reach_coefficient, description, rulesJson, id]
        );
        
        const [updated] = await pool.execute('SELECT * FROM actions WHERE id = ?', [id]);
        res.json({ action: updated[0], message: 'Action updated successfully' });
    } catch (error) {
        console.error('[ADMIN] Update action error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get action demographic coefficients (20 ethno-ideological groups)
router.get('/actions/:actionId/coefficients', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { actionId } = req.params;
        const [actions] = await pool.execute('SELECT * FROM actions WHERE id = ?', [actionId]);
        if (actions.length === 0) {
            return res.status(404).json({ error: 'Action not found' });
        }
        const [coefficients] = await pool.execute(
            `SELECT * FROM action_demographic_coefficients WHERE action_id = ? ORDER BY ethnicity, ideology`,
            [actionId]
        );
        res.json({
            action: actions[0],
            coefficients: coefficients.map(c => ({
                id: c.id,
                ideology: c.ideology,
                ethnicity: c.ethnicity,
                coefficient: parseFloat(c.coefficient)
            }))
        });
    } catch (error) {
        console.error('[ADMIN] Get action coefficients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bulk update action demographic coefficients
router.put('/coefficients/action/:actionId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { actionId } = req.params;
        const { coefficients } = req.body;
        if (!Array.isArray(coefficients)) {
            return res.status(400).json({ error: 'coefficients must be an array' });
        }
        for (const c of coefficients) {
            const coef = Math.min(1.0, Math.max(0.01, parseFloat(c.coefficient) || 1.0));
            await pool.execute(
                `INSERT INTO action_demographic_coefficients (action_id, ideology, ethnicity, coefficient)
                 VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE coefficient = VALUES(coefficient)`,
                [actionId, c.ideology, c.ethnicity, coef]
            );
        }
        const [updated] = await pool.execute(
            'SELECT * FROM action_demographic_coefficients WHERE action_id = ? ORDER BY ethnicity, ideology',
            [actionId]
        );
        res.json({ coefficients: updated.map(c => ({ ...c, coefficient: parseFloat(c.coefficient) })), message: 'Coefficients updated' });
    } catch (error) {
        console.error('[ADMIN] Update action coefficients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// STATISTICS / OVERVIEW
// ============================================================

// Get admin dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [regionCount] = await pool.execute('SELECT COUNT(*) as count FROM regions');
        const [candidateCount] = await pool.execute('SELECT COUNT(*) as count FROM candidates');
        const [actionCount] = await pool.execute('SELECT COUNT(*) as count FROM actions');
        const [gameCount] = await pool.execute('SELECT COUNT(*) as count FROM games');
        const [activeGameCount] = await pool.execute("SELECT COUNT(*) as count FROM games WHERE status IN ('waiting', 'active')");
        const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
        
        const [totalPopulation] = await pool.execute('SELECT SUM(population) as total FROM regions');
        const [coefficientCount] = await pool.execute('SELECT COUNT(*) as count FROM candidate_demographic_coefficients');
        const [demographicCount] = await pool.execute('SELECT COUNT(*) as count FROM region_demographics');
        
        res.json({
            stats: {
                regions: regionCount[0].count,
                candidates: candidateCount[0].count,
                actions: actionCount[0].count,
                games: gameCount[0].count,
                active_games: activeGameCount[0].count,
                users: userCount[0].count,
                total_population: totalPopulation[0].total || 0,
                coefficients: coefficientCount[0].count,
                demographic_groups: demographicCount[0].count
            }
        });
    } catch (error) {
        console.error('[ADMIN] Get stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// IDEOLOGIES
// ============================================================

// Get list of valid ideologies
router.get('/ideologies', authenticateToken, requireAdmin, async (req, res) => {
    res.json({
        ideologies: [
            'Socialist Nationalist',
            'Liberal Reformist',
            'Nationalist Conservative',
            'Civic Unitary',
            'Populist Anti-System'
        ]
    });
});

// Get list of valid ethnicities
router.get('/ethnicities', authenticateToken, requireAdmin, async (req, res) => {
    res.json({
        ethnicities: ['Bosniak', 'Serb', 'Croat', 'Other']
    });
});

// ============================================================
// USERS MANAGEMENT
// ============================================================

// Get all users
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await pool.execute(`
            SELECT u.id, u.username, u.email, u.created_at,
                (SELECT COUNT(*) FROM game_players WHERE user_id = u.id) as games_played,
                (SELECT COUNT(*) FROM games WHERE host_user_id = u.id) as games_created,
                COALESCE((SELECT is_admin FROM admin_users WHERE user_id = u.id), 0) as is_admin
            FROM users u
            ORDER BY u.created_at DESC
        `);
        res.json({ 
            users: users.map(u => ({
                ...u,
                is_admin: u.is_admin === 1
            }))
        });
    } catch (error) {
        console.error('[ADMIN] Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a user
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUserId = req.user.userId;
        
        if (parseInt(id) === currentUserId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }
        
        // Check if user is admin
        const [adminCheck] = await pool.execute(
            'SELECT is_admin FROM admin_users WHERE user_id = ?',
            [id]
        );
        if (adminCheck.length > 0 && adminCheck[0].is_admin) {
            return res.status(400).json({ error: 'Cannot delete an admin user' });
        }
        
        // Remove from admin_users first
        await pool.execute('DELETE FROM admin_users WHERE user_id = ?', [id]);
        
        // Remove from game_players
        await pool.execute('DELETE FROM game_players WHERE user_id = ?', [id]);
        
        // Delete user
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('[ADMIN] Delete user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ============================================================
// ADMINS MANAGEMENT
// ============================================================

// Add admin
router.post('/admins', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { user_id } = req.body;
        
        // Check if user exists
        const [users] = await pool.execute('SELECT id, username FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Add or update admin status
        await pool.execute(
            `INSERT INTO admin_users (user_id, is_admin) VALUES (?, TRUE)
             ON DUPLICATE KEY UPDATE is_admin = TRUE`,
            [user_id]
        );
        
        res.json({ message: `${users[0].username} is now an admin` });
    } catch (error) {
        console.error('[ADMIN] Add admin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove admin
router.delete('/admins/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user.userId;
        
        if (parseInt(userId) === currentUserId) {
            return res.status(400).json({ error: 'Cannot remove your own admin status' });
        }
        
        await pool.execute('UPDATE admin_users SET is_admin = FALSE WHERE user_id = ?', [userId]);
        
        res.json({ message: 'Admin status removed' });
    } catch (error) {
        console.error('[ADMIN] Remove admin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
