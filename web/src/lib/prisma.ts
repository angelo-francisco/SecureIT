import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

const adapter = new PrismaNeon({ connectionString, maxUses: 1 });

export const prisma = 
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
