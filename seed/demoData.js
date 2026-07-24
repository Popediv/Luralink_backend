import { prisma } from '../src/config/db.js';

async function seed() {
  await prisma.$connect();
  console.log('Seed data placeholder executed');
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
