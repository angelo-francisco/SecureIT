import { vi } from "vitest";

process.env.DATABASE_URL_SQLITE = process.env.DATABASE_URL_SQLITE || "file:./dev.db";
process.env.JWT_SECRET = process.env.JWT_SECRET || "x4$n!bnme4(khao6sy@8t*x&d1jn@#xk4^*u41-v20=5(2c55-";

if (!process.env.ED25519_PRIVATE_KEY) {
  process.env.ED25519_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEII9EDpsa1ONU5hnBuipqXwKIfj4BGW/aLQS4b4LyPWuE
-----END PRIVATE KEY-----`;
}
if (!process.env.ED25519_PUBLIC_KEY) {
  process.env.ED25519_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAHrtEND2DcZ62fPtiBqDbvNqoqoaJbwcxW4+WFHsB9Xg=
-----END PUBLIC KEY-----`;
}

const { db: testDb } = await import("./helpers/db");

vi.mock("@/db", () => ({
  db: testDb,
}));
