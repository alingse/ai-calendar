import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../data/calendar.db');
const db = new Database(dbPath);

console.log('Adding seed data...\n');

// Add some sample events
const insertEvent = db.prepare(`
  INSERT INTO events (title, type, date, day_of_week, start_time, end_time)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// One-time event
insertEvent.run('重要会议', 'one-time', '2026-03-02', null, '10:00', '11:30');
console.log('✓ Added one-time event: 重要会议');

// Recurring events
insertEvent.run('周会', 'recurring', null, 1, '14:00', '15:00'); // Monday
console.log('✓ Added recurring event: 周会 (每周一)');

insertEvent.run('私人时间', 'recurring', null, 3, '12:00', '13:00'); // Wednesday
console.log('✓ Added recurring event: 私人时间 (每周三)');

insertEvent.run('团队同步', 'recurring', null, 5, '16:00', '17:00'); // Friday
console.log('✓ Added recurring event: 团队同步 (每周五)');

db.close();

console.log('\n✓ Seed data added successfully!');
console.log('\nYou can now:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Visit http://localhost:5173/ to see the public calendar');
console.log('3. Visit http://localhost:5173/admin to manage events (password: admin123)');

