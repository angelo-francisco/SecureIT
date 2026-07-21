import { PrismaClient } from "@/generated/prisma/client";

let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (_client) return _client;

  const dbUrl = process.env.DATABASE_URL_SQLITE;

  if (dbUrl?.startsWith("file:")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");
    const adapter = new PrismaLibSQL({ url: dbUrl });
    _client = new PrismaClient({ adapter });
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaD1 } = require("@prisma/adapter-d1");
    const { env } = getCloudflareContext();
    const adapter = new PrismaD1(env.DATABASE_URL_SQLITE);
    _client = new PrismaClient({ adapter });
  }

  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getClient() as any)[prop];
  },
});
