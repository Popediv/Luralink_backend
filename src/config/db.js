import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function connectDb() {
  await prisma.$connect();
  console.log('Prisma connected');
}

export { prisma, connectDb };