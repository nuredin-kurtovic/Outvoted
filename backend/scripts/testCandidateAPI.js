import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAPI() {
    try {
        // Test 1: Check what the API query returns
        console.log('\n=== Testing API Query ===\n');
        const [candidates] = await pool.execute(`
            SELECT c.*, r.name as region_name 
            FROM candidates c 
            JOIN regions r ON c.home_region_id = r.id 
            ORDER BY c.ethnicity, c.name
            LIMIT 3
        `);
        
        console.log('Sample candidates from database:');
        candidates.forEach(c => {
            console.log(`- ${c.name}: image_url = ${c.image_url ? c.image_url.substring(0, 60) + '...' : 'NULL'}`);
        });
        
        // Test 2: Check what the API would return
        console.log('\n=== What API Returns ===\n');
        const apiResponse = candidates.map(c => ({
            id: c.id,
            name: c.name,
            ethnicity: c.ethnicity,
            ideology: c.ideology,
            home_region_id: c.home_region_id,
            home_region_name: c.region_name,
            description: c.description,
            image_url: c.image_url
        }));
        
        console.log('API Response format:');
        console.log(JSON.stringify(apiResponse[0], null, 2));
        
        // Test 3: Check if image URLs are accessible
        console.log('\n=== Testing Image URLs ===\n');
        for (const candidate of candidates.slice(0, 2)) {
            if (candidate.image_url) {
                console.log(`Testing: ${candidate.name}`);
                console.log(`URL: ${candidate.image_url}`);
                try {
                    const response = await fetch(candidate.image_url, { method: 'HEAD' });
                    console.log(`Status: ${response.status} ${response.statusText}`);
                    console.log(`Content-Type: ${response.headers.get('content-type')}`);
                } catch (error) {
                    console.log(`Error: ${error.message}`);
                }
                console.log('');
            }
        }
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

testAPI();
