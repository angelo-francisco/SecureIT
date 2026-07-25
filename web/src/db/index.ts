import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1DB = ReturnType<typeof drizzleD1<typeof schema>>;
type DrizzleDB = D1DB;

let _db: DrizzleDB | undefined;

function getDb(): DrizzleDB {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL_SQLITE;
  const nodeEnv = process.env.NODE_ENV
  if (nodeEnv === "development") {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Database } = require("bun:sqlite");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/bun-sqlite");
    const sqlite = new Database("./dev.db");
    _db = drizzle(sqlite, { schema }) as DrizzleDB;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    _db = drizzleD1(env.DATABASE_URL_SQLITE, { schema });
  }

  return _db;
}

export const db = new Proxy({} as DrizzleDB, {
  get(_, prop) {
    return (_db ?? getDb())[prop as keyof DrizzleDB] as any;
  },
});
