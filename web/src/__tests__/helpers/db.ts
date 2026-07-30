import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../../db/schema";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const sqlite = new Database(":memory:");

const migrationSql = readFileSync(
	resolve(__dirname, "../../db/0000_dizzy_redwing.sql"),
	"utf-8",
);
const migrationSql2 = readFileSync(
	resolve(__dirname, "../../db/0001_absurd_fat_cobra.sql"),
	"utf-8",
);
sqlite.exec(migrationSql);
sqlite.exec(migrationSql2);

export const db = drizzle(sqlite, { schema });
