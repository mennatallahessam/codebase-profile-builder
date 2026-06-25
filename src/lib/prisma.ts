import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function getPrisma(): PrismaClient {
  const url = process.env.DATABASE_URL || 'file:./dev.db';
  if (process.env.NODE_ENV === 'production') {
    const adapter = new PrismaBetterSqlite3({ url });
    return new PrismaClient({ adapter });
  }
  if (!global.__prisma) {
    const adapter = new PrismaBetterSqlite3({ url });
    global.__prisma = new PrismaClient({ adapter });
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
