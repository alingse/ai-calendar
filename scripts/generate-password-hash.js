import bcrypt from 'bcrypt';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node generate-password-hash.js <password>');
  process.exit(1);
}

const saltRounds = 10;
const hash = await bcrypt.hash(password, saltRounds);

console.log('\nPassword hash generated successfully!');
console.log('\nAdd this to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('');
