import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../../db/schema";

const sqlite = new Database(":memory:");

const migrationSql = readFileSync(
	resolve(__dirname, "../../db/0000_dizzy_redwing.sql"),
	"utf-8",
);
const migrationSql2 = readFileSync(
	resolve(__dirname, "../../db/0001_absurd_fat_cobra.sql"),
	"utf-8",
);
const migrationSql3 = readFileSync(
	resolve(__dirname, "../../db/0002_passwordless_auth.sql"),
	"utf-8",
);
const migrationSql4 = readFileSync(
	resolve(__dirname, "../../db/0003_email_2fa.sql"),
	"utf-8",
);
const migrationSql5 = readFileSync(
	resolve(__dirname, "../../db/0004_email_verified.sql"),
	"utf-8",
);
sqlite.exec(migrationSql);
sqlite.exec(migrationSql2);
sqlite.exec(migrationSql3);
sqlite.exec(migrationSql4);
sqlite.exec(migrationSql5);

export const db = drizzle(sqlite, { schema });
