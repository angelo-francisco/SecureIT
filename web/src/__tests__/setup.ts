import { vi } from "vitest";

const privateKeyPath = process.env.ED25519_PRIVATE_KEY_PATH || "/app/ed25519_private.pem";
const publicKeyPath = process.env.ED25519_PUBLIC_KEY_PATH || "/app/ed25519_public.pem";

process.env.DATABASE_URL_SQLITE = process.env.DATABASE_URL_SQLITE || "file:./dev.db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-";
process.env.ED25519_PRIVATE_KEY_PATH = privateKeyPath;
process.env.ED25519_PUBLIC_KEY_PATH = publicKeyPath;

const { PrismaClient: TestPrismaClient } = await import("../generated/prisma-node/client");

const testPrisma = new TestPrismaClient({
  datasourceUrl: process.env.DATABASE_URL_SQLITE,
});

vi.mock("@/lib/prisma", () => ({
  prisma: testPrisma,
}));
