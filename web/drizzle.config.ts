import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL ?? "./secureit.db";

export default defineConfig({
	schema: "./src/db/schema.ts",
	out: "./src/db",
	dialect: "turso",
	dbCredentials: {
		url,
		authToken:
			url.startsWith("libsql://") || url.startsWith("https://")
				? process.env.TURSO_AUTH_TOKEN
				: undefined,
	},
});
