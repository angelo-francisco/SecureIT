import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function getUrl(): string {
  return process.env.DATABASE_URL_SQLITE!;
}

const adapter = new PrismaLibSQL({ url: getUrl() });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
