import { Pool, neonConfig } from '@neondatabase/serverless';

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
