import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient;

async function connectDb() {
  if (prisma && typeof prisma.$connect === 'function') {
    await prisma.$connect();
    console.log('Prisma connected');
  }
}



export { prisma, connectDb };
