import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Since many Wikipedia Commons images don't exist, we'll use a placeholder service
// that generates images with candidate initials and colors based on ethnicity
// Format: https://ui-avatars.com/api/?name=NAME&size=400&background=COLOR&color=fff&bold=true

const candidatePlaceholders = [
    { 
        name: 'Bakir Izetbegović', 
        // Keep the working Commons image
        image: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Izetbegovi%C4%87%2C_Bakir.jpg' 
    },
    { 
        name: 'Denis Bećirović', 
        image: 'https://ui-avatars.com/api/?name=Denis+Be%C4%87irovi%C4%87&size=400&background=22c55e&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Ramo Isak', 
        image: 'https://ui-avatars.com/api/?name=Ramo+Isak&size=400&background=22c55e&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Halid Genjac', 
        image: 'https://ui-avatars.com/api/?name=Halid+Genjac&size=400&background=22c55e&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Milorad Dodik', 
        image: 'https://ui-avatars.com/api/?name=Milorad+Dodik&size=400&background=3b82f6&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Željka Cvijanović', 
        image: 'https://ui-avatars.com/api/?name=%C5%BDeljka+Cvijanovi%C4%87&size=400&background=3b82f6&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Staša Košarac', 
        image: 'https://ui-avatars.com/api/?name=Sta%C5%A1a+Ko%C5%A1arac&size=400&background=3b82f6&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Draško Stanivuković', 
        image: 'https://ui-avatars.com/api/?name=Dra%C5%A1ko+Stanivukovi%C4%87&size=400&background=3b82f6&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Dragan Čović', 
        image: 'https://ui-avatars.com/api/?name=Dragan+%C4%8Covi%C4%87&size=400&background=ef4444&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Željko Komšić', 
        image: 'https://ui-avatars.com/api/?name=%C5%BDeljko+Kom%C5%A1i%C4%87&size=400&background=ef4444&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Martin Raguž', 
        image: 'https://ui-avatars.com/api/?name=Martin+Ragu%C5%BE&size=400&background=ef4444&color=fff&bold=true&format=png' 
    },
    { 
        name: 'Dijana Zelenika', 
        image: 'https://ui-avatars.com/api/?name=Dijana+Zelenika&size=400&background=ef4444&color=fff&bold=true&format=png' 
    }
];

async function updateImages() {
    try {
        console.log('Updating candidate images with placeholder service...\n');
        console.log('Colors: Green (Bosniak), Blue (Serb), Red (Croat)\n');
        
        for (const candidate of candidatePlaceholders) {
            try {
                await pool.execute('UPDATE candidates SET image_url = ? WHERE name = ?', [candidate.image, candidate.name]);
                console.log(`✅ ${candidate.name}: Updated`);
            } catch (error) {
                console.log(`❌ ${candidate.name}: Error - ${error.message}`);
            }
        }
        
        console.log('\n✅ All candidate images updated!');
        console.log('Note: Using UI Avatars service for candidates without Wikipedia Commons images.');
        console.log('Bakir Izetbegović uses the actual Wikipedia Commons image.');
        
        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        await pool.end();
        process.exit(1);
    }
}

updateImages();
