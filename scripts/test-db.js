import { db } from '../server/src/db.js';

console.log('Testing database...\n');

// Check if tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables);

// Check settings
const settings = db.prepare('SELECT * FROM settings').all();
console.log('\nSettings:', settings);

// Check events
const events = db.prepare('SELECT * FROM events').all();
console.log('\nEvents:', events);

console.log('\n✓ Database test completed successfully!');
