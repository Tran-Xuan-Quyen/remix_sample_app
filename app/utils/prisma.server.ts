// app/utils/prisma.server.ts

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

declare global {
  // This prevents the TypeScript error "Cannot find name 'globalThis'"
  // and is necessary for extending NodeJS's global scope in TypeScript.
  var __db: PrismaClient | undefined;
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
  prisma.$connect(); // Ensures the client is connected to the database.
} else {
  if (!global.__db) {
    global.__db = new PrismaClient();
    global.__db.$connect(); // Connect to the database in development mode.
  }
  prisma = global.__db;
}

export { prisma };