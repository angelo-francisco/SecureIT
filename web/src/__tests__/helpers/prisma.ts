import { PrismaClient } from "@/generated/prisma-node/client";

let _client: InstanceType<typeof PrismaClient> | undefined;

function getClient(): InstanceType<typeof PrismaClient> {
  if (_client) return _client;

  const dbUrl = process.env.DATABASE_URL_SQLITE;
  if (!dbUrl) throw new Error("DATABASE_URL_SQLITE not set");

  _client = new PrismaClient({
    datasourceUrl: dbUrl,
  });

  return _client;
}

export const prisma = new Proxy({} as InstanceType<typeof PrismaClient>, {
  get(_, prop) {
    return (getClient() as any)[prop];
  },
});
