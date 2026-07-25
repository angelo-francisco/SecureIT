import { drizzle as drizzleBunSqlite } from "drizzle-orm/bun-sqlite";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

type BunSqliteDB = ReturnType<typeof drizzleBunSqlite<typeof schema>>;
type D1DB = ReturnType<typeof drizzleD1<typeof schema>>;
type DrizzleDB = BunSqliteDB | D1DB;

let _db: DrizzleDB | undefined;

function getDb(): DrizzleDB {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL_SQLITE;

  if (dbUrl?.startsWith("file:")) {
    const sqlite = new Database("./dev.db");
    _db = drizzleBunSqlite(sqlite, { schema });
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
