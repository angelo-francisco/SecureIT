import { getCloudflareContext } from "@opennextjs/cloudflare";
import { PrismaD1 } from "@prisma/adapter-d1";
import { PrismaClient } from "@/generated/prisma/client";

let _client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_client) {
    const { env } = getCloudflareContext();
    const adapter = new PrismaD1(env.DB);
    _client = new PrismaClient({ adapter });
  }
  return _client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getClient() as any)[prop];
  },
});
