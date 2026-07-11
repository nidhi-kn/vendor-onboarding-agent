/**
 * db.js
 * 
 * Prisma Client singleton instance.
 * Ensures only one instance of PrismaClient is created.
 */

const { PrismaClient } = require('@prisma/client');

/**
 * Global Prisma instance to prevent multiple instances in development
 */
let prisma;

/**
 * Get Prisma Client instance
 * 
 * @returns {PrismaClient} Prisma client singleton
 */
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error']
    });
  }
  return prisma;
}

/**
 * Disconnect Prisma Client
 * Call this when shutting down the application
 */
async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  getPrismaClient,
  disconnectPrisma,
  // Export singleton instance for direct use
  prisma: getPrismaClient()
};
