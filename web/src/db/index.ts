import { drizzle as drizzleBetterSqlite3 } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

type BetterSqliteDB = ReturnType<typeof drizzleBetterSqlite3<typeof schema>>;
type D1DB = ReturnType<typeof drizzleD1<typeof schema>>;
type DrizzleDB = BetterSqliteDB | D1DB;

let _db: DrizzleDB | undefined;

function getDb(): DrizzleDB {
  if (_db) return _db;

  const dbUrl = process.env.DATABASE_URL_SQLITE;

  if (dbUrl?.startsWith("file:")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const sqlite = new Database("./dev.db");
    _db = drizzleBetterSqlite3(sqlite, { schema });
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
