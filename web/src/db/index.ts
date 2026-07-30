import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1DB = ReturnType<typeof drizzleD1<typeof schema>>;
type DrizzleDB = D1DB;

let _db: DrizzleDB | undefined;

function getDb(): DrizzleDB {
	if (_db) return _db;

	const nodeEnv = process.env.NODE_ENV;
	if (nodeEnv === "development") {
		const { Database } = require("bun:sqlite");
		const { drizzle } = require("drizzle-orm/bun-sqlite");
		const sqlite = new Database("./secureit.db");
		sqlite.run("PRAGMA journal_mode=WAL");

		const tableExists = sqlite
			.query("SELECT name FROM sqlite_master WHERE type='table' AND name='User'")
			.get();
		if (!tableExists) {
			const { readFileSync } = require("node:fs");
			const { resolve } = require("node:path");
			const migrationSql = readFileSync(
				resolve(process.cwd(), "src/db/0000_dizzy_redwing.sql"),
				"utf-8",
			);
			sqlite.exec(migrationSql);
		} else {
			try {
				const prColumns = sqlite.query("PRAGMA table_info(PaymentRequest)").all() as any[];
				const hasDurationDays = prColumns.some((col) => col.name === "durationDays");
				if (!hasDurationDays) {
					sqlite.exec("ALTER TABLE PaymentRequest ADD COLUMN durationDays INTEGER DEFAULT 30 NOT NULL;");
				}
			} catch {}
		}

		_db = drizzle(sqlite, { schema }) as DrizzleDB;
	} else {
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
