import { scryptSync, randomBytes, randomUUID } from 'crypto';

const password = process.argv[2] || 'Admin@2024';
const salt = randomBytes(16).toString('hex');
const hash = scryptSync(password, salt, 64).toString('hex');
const passwordHash = `${salt}:${hash}`;
const id = randomUUID();

console.log('=== THÔNG TIN ADMIN ===');
console.log('Email: admin@illumina.com');
console.log('Password:', password);
console.log('');
console.log('=== SQL – DÁN VÀO TURSO SHELL ===');
console.log(`INSERT INTO "User" (id, fullName, email, passwordHash, role, isActive, createdAt)
VALUES (
  '${id}',
  'Admin',
  'admin@illumina.com',
  '${passwordHash}',
  'admin',
  1,
  datetime('now')
);`);
