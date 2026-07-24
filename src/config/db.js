import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function connectDb() {
  await prisma.$connect();
  console.log('Prisma connected');
}

export { prisma, connectDb };
