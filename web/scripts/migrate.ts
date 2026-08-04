import { resolve } from "node:path";
import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { normalizeTursoUrl } from "../src/lib/turso";

async function main() {
	const url = process.env.TURSO_DATABASE_URL;
	if (!url) {
		console.log("TURSO_DATABASE_URL is not set; skipping migrations.");
		return;
	}

	const normalized = normalizeTursoUrl(url);
	console.log(`Applying drizzle migrations to ${normalized}...`);
	const client = createClient({
		url: normalized,
		authToken: process.env.TURSO_AUTH_TOKEN,
	});
	const db = drizzle(client);

	await migrate(db, {
		migrationsFolder: resolve(process.cwd(), "src/db"),
	});

	await client.close();
	console.log("Migrations applied.");
}

main().catch((error) => {
	console.error("Migration failed:", error);
	process.exit(1);
});
