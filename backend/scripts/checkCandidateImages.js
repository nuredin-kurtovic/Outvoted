import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkImages() {
    try {
        const [candidates] = await pool.execute(
            'SELECT id, name, image_url FROM candidates ORDER BY name'
        );
        
        console.log('\n📸 Candidate Images Status:\n');
        console.log('─'.repeat(80));
        
        let withImages = 0;
        let withoutImages = 0;
        
        for (const candidate of candidates) {
            const status = candidate.image_url ? '✅' : '❌';
            const image = candidate.image_url ? candidate.image_url.substring(0, 60) + '...' : 'NO IMAGE';
            
            console.log(`${status} ${candidate.name.padEnd(25)} ${image}`);
            
            if (candidate.image_url) {
                withImages++;
            } else {
                withoutImages++;
            }
        }
        
        console.log('─'.repeat(80));
        console.log(`\nTotal: ${candidates.length} candidates`);
        console.log(`✅ With images: ${withImages}`);
        console.log(`❌ Without images: ${withoutImages}\n`);
        
        await pool.end();
    } catch (error) {
        console.error('Error checking images:', error);
        await pool.end();
        process.exit(1);
    }
}

checkImages();
