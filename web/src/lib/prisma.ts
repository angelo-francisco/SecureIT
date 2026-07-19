import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function getConnectionString(): string {
  // Cloudflare Workers: Hyperdrive binding available globally
  if (typeof globalThis !== "undefined" && "HYPERDRIVE" in globalThis) {
    return (globalThis as any).HYPERDRIVE.connectionString;
  }
  // Local dev (Docker): DATABASE_URL from env
  return process.env.DATABASE_URL!;
}

const adapter = new PrismaPg({ connectionString: getConnectionString() });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
