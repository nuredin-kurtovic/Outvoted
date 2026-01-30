import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Using Wikipedia article images and verified Commons files
// For candidates without Commons images, using Wikipedia article images or placeholders
const candidateImages = [
    { 
        name: 'Bakir Izetbegović', 
        // Using the working Commons file
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Izetbegovi%C4%87%2C_Bakir.jpg' 
    },
    { 
        name: 'Denis Bećirović', 
        // Try the full path without thumbnail
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Denis_Be%C4%87irovi%C4%87_%282022%29.jpg' 
    },
    { 
        name: 'Ramo Isak', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Ramo_Isak.jpg' 
    },
    { 
        name: 'Halid Genjac', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/Halid_Genjac.jpg' 
    },
    { 
        name: 'Milorad Dodik', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Milorad_Dodik_2022.jpg' 
    },
    { 
        name: 'Željka Cvijanović', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/9/9c/%C5%BDeljka_Cvijanovi%C4%87_%282019%29.jpg' 
    },
    { 
        name: 'Staša Košarac', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Sta%C5%A1a_Ko%C5%A1arac.jpg' 
    },
    { 
        name: 'Draško Stanivuković', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Drasko_Stanivukovic_2020.jpg' 
    },
    { 
        name: 'Dragan Čović', 
        // Use the verified 2025 image
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Dragan_%C4%8Covi%C4%87_2025.jpg/220px-Dragan_%C4%8Covi%C4%87_2025.jpg' 
    },
    { 
        name: 'Željko Komšić', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/b/b2/%C5%BDeljko_Kom%C5%A1i%C4%87_2019.jpg' 
    },
    { 
        name: 'Martin Raguž', 
        // Try without thumbnail path
        image: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Martin_Ragu%C5%BE.jpg' 
    },
    { 
        name: 'Dijana Zelenika', 
        // Try without thumbnail path - if this doesn't work, we'll need a placeholder
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Dijana_Zelenika.jpg' 
    }
];

async function updateImages() {
    try {
        console.log('Updating candidate images with direct file paths...\n');
        
        for (const candidate of candidateImages) {
            try {
                await pool.execute('UPDATE candidates SET image_url = ? WHERE name = ?', [candidate.image, candidate.name]);
                console.log(`✅ ${candidate.name}: Updated to ${candidate.image.substring(0, 70)}...`);
            } catch (error) {
                console.log(`❌ ${candidate.name}: Error updating - ${error.message}`);
            }
        }
        
        console.log('\n✅ Image update completed!');
        console.log('\nNote: Some images may still fail if the files don\'t exist on Commons.');
        console.log('If images fail, we may need to use placeholder images or find alternative sources.');
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

updateImages();
