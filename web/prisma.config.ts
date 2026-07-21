import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations_sqlite",
  },
  datasource: {
    url: process.env.DATABASE_URL_SQLITE ?? "",
  },
});