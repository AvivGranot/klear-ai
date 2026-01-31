/**
 * Script to update existing user passwords to bcrypt
 * Run once after migrating to bcrypt
 */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Updating password hash to bcrypt...');

  const newHash = await bcrypt.hash('12345678', 12);

  const result = await prisma.user.updateMany({
    where: { email: 'hello@klear.ai' },
    data: { passwordHash: newHash }
  });

  console.log('✅ Updated', result.count, 'user(s) with bcrypt hash');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});
