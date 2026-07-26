import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../../db/schema";

const dbUrl = process.env.DATABASE_URL_SQLITE;
const dbPath = dbUrl?.startsWith("file:")
	? dbUrl.replace("file:", "")
	: "./dev.db";

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
