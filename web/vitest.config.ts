import { defineConfig } from "vitest/config";
import path from "path";

process.env.DATABASE_URL_SQLITE = process.env.DATABASE_URL_SQLITE || "file:./dev.db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-";

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
