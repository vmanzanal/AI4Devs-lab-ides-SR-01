import { PrismaClient } from '@prisma/client';

// Global instance to prevent multiple connections
declare global {
  var __db: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, reuse connection across hot reloads
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__db;
}

export default prisma;
