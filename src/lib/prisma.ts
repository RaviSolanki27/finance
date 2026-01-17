// import { PrismaClient } from "";
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import { Pool } from 'pg';


// Handle bigint serialization if needed
export const jsonReplacer = (_key: string, value: any) => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

declare global {
  var prisma: PrismaClient | undefined;
}
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 10000, // 10 SECONDS
  idleTimeoutMillis: 30000, // 30 SECONDS
  max: 10 // MAXIMUM NUMBER OF CLIENTS IN THE POOL
});
const adapter = new PrismaPg(pool);

const prisma = globalThis.prisma || (() => {
  const client = new PrismaClient({ adapter });
  console.log('Prisma client connected successfully');
  return client;
})();

if (process.env.NEXT_PUBLIC_NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// EXPORTS
export { prisma };
export * from '../../generated/prisma/client';
