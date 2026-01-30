import { runMigrations } from '../database/migrations.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('Starting database migrations...');
console.log('Database:', process.env.DB_NAME || 'outvoted');
console.log('Host:', process.env.DB_HOST || 'localhost');
console.log('User:', process.env.DB_USER || 'root');
console.log('');

runMigrations()
    .then(() => {
        console.log('\n✅ Migrations completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration error:', error);
        process.exit(1);
    });
