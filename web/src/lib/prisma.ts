import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/prisma/client";

let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_client) {
    const { env } = getCloudflareContext();
    // @ts-expect-error DATABASE_URL_SQLITE D1 binding from wrangler
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
