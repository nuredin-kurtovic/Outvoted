import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Updated image URLs - using correct Wikipedia Commons paths with 220px thumbnails
const candidateImages = [
    { 
        name: 'Bakir Izetbegović', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Izetbegovi%C4%87%2C_Bakir.jpg' 
    },
    { 
        name: 'Denis Bećirović', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Denis_Be%C4%87irovi%C4%87_%282022%29.jpg/220px-Denis_Be%C4%87irovi%C4%87_%282022%29.jpg' 
    },
    { 
        name: 'Ramo Isak', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Ramo_Isak.jpg/220px-Ramo_Isak.jpg' 
    },
    { 
        name: 'Halid Genjac', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Halid_Genjac.jpg/220px-Halid_Genjac.jpg' 
    },
    { 
        name: 'Milorad Dodik', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Milorad_Dodik_2022.jpg/220px-Milorad_Dodik_2022.jpg' 
    },
    { 
        name: 'Željka Cvijanović', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/%C5%BDeljka_Cvijanovi%C4%87_%282019%29.jpg/220px-%C5%BDeljka_Cvijanovi%C4%87_%282019%29.jpg' 
    },
    { 
        name: 'Staša Košarac', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Sta%C5%A1a_Ko%C5%A1arac.jpg/220px-Sta%C5%A1a_Ko%C5%A1arac.jpg' 
    },
    { 
        name: 'Draško Stanivuković', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Drasko_Stanivukovic_2020.jpg/220px-Drasko_Stanivukovic_2020.jpg' 
    },
    { 
        name: 'Dragan Čović', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Dragan_%C4%8Covi%C4%87_%282013%29.jpg/220px-Dragan_%C4%8Covi%C4%87_%282013%29.jpg' 
    },
    { 
        name: 'Željko Komšić', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/%C5%BDeljko_Kom%C5%A1i%C4%87_2019.jpg/220px-%C5%BDeljko_Kom%C5%A1i%C4%87_2019.jpg' 
    },
    { 
        name: 'Martin Raguž', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Martin_Ragu%C5%BE.jpg/220px-Martin_Ragu%C5%BE.jpg' 
    },
    { 
        name: 'Dijana Zelenika', 
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Dijana_Zelenika.jpg/220px-Dijana_Zelenika.jpg' 
    }
];

async function updateImages() {
    try {
        console.log('Updating candidate images...\n');
        
        for (const candidate of candidateImages) {
            // Update directly without testing (to avoid rate limits)
            try {
                await pool.execute('UPDATE candidates SET image_url = ? WHERE name = ?', [candidate.image, candidate.name]);
                console.log(`✅ ${candidate.name}: Image URL updated`);
            } catch (error) {
                console.log(`❌ ${candidate.name}: Error updating - ${error.message}`);
            }
        }
        
        console.log('\n✅ Image update completed!');
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

updateImages();
