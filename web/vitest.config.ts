import path from "node:path";
import { defineConfig } from "vitest/config";

process.env.TURSO_DATABASE_URL =
	process.env.TURSO_DATABASE_URL || "libsql://secureit.turso.io";
process.env.JWT_SECRET =
	process.env.JWT_SECRET ||
	"x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-";

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["src/__tests__/**/*.test.ts"],
		setupFiles: ["src/__tests__/setup.ts"],
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
