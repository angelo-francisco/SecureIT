import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function getConnectionString(): string {
  return process.env.DATABASE_URL!;
}

const adapter = new PrismaPg({ connectionString: getConnectionString(), maxUses: 1 });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
