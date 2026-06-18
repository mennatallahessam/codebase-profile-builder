import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    return new PrismaClient();
  }
  if (!global.__prisma) {
    global.__prisma = new PrismaClient();
  }
  return global.__prisma;
}

// Lazily-evaluated proxy — the real PrismaClient is only instantiated
// when a property is first accessed, NOT at module-evaluation time.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return (getPrisma() as any)[prop];
  },
});

export default prisma;
