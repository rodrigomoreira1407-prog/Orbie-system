const { PrismaClient } = require('@prisma/client');

const prisma = global._prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV !== 'production' ? ['error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') global._prisma = prisma;

module.exports = prisma;
