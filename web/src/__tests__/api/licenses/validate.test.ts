import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/db";
import { user, license, licenseKey } from "@/db/schema";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/licenses/validate/route";
import { generateLicenseKey } from "@/lib/license-key";
import { generateId } from "@/db/schema";

const TEST_PREFIX = "test_validate";

function makeRequest(body: any) {
  return new Request("http://localhost/api/licenses/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let userId = "";
let licenseId = "";
let keyId = "";
let testEmail = "";
let testKey = "";

beforeAll(async () => {
  testEmail = `${TEST_PREFIX}_user_${Date.now()}@example.com`;
  const pwHash = await Bun.password.hash("TestPass123!", { algorithm: "bcrypt", cost: 10 });
  userId = generateId();
  await db.insert(user).values({
    id: userId, email: testEmail, passwordHash: pwHash, firstName: "Validate", lastName: "Test",
  }).run();

  testKey = generateLicenseKey();
  keyId = generateId();
  const now = new Date().toISOString();
  const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await db.insert(licenseKey).values({
    id: keyId, key: testKey, type: "STANDARD", durationDays: 30, status: "ACTIVE",
  }).run();

  licenseId = generateId();
  await db.insert(license).values({
    id: licenseId, keyId, userId, activatedAt: now, expiresAt: futureExpiry, hardwareFp: "validate-hw-fp",
  }).run();
});

afterAll(async () => {
  await db.delete(license).where(eq(license.userId, userId)).run();
  await db.delete(licenseKey).where(eq(licenseKey.id, keyId)).run();
  await db.delete(user).where(eq(user.id, userId)).run();
});

describe("POST /api/licenses/validate", () => {
  it("valid validate by email", async () => {
    const req = makeRequest({ email: testEmail, hardwareFp: "validate-hw-fp" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.isActive).toBe(true);
    expect(data.type).toBe("STANDARD");
    expect(data.signedPayload).toBeDefined();
    expect(data.user.email).toBe(testEmail);
    expect(data.daysRemaining).toBeGreaterThan(0);
  });

  it("valid validate by licenseId", async () => {
    const req = makeRequest({ licenseId, hardwareFp: "validate-hw-fp" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.isActive).toBe(true);
  });

  it("revoked returns valid=false", async () => {
    const revokedUserEmail = `${TEST_PREFIX}_revoked_${Date.now()}@example.com`;
    const pwHash = await Bun.password.hash("TestPass123!", { algorithm: "bcrypt", cost: 10 });
    const revokedUserId = generateId();
    await db.insert(user).values({
      id: revokedUserId, email: revokedUserEmail, passwordHash: pwHash, firstName: "Rev", lastName: "User",
    }).run();

    const revokedKey = generateLicenseKey();
    const revokedKeyId = generateId();
    await db.insert(licenseKey).values({
      id: revokedKeyId, key: revokedKey, type: "STANDARD", durationDays: 30, status: "REVOKED",
    }).run();

    const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const revokedLicenseId = generateId();
    await db.insert(license).values({
      id: revokedLicenseId, keyId: revokedKeyId, userId: revokedUserId,
      activatedAt: new Date().toISOString(), expiresAt: futureExpiry,
    }).run();

    try {
      const req = makeRequest({ licenseId: revokedLicenseId });
      const response = await POST(req);
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.error).toContain("revogada");
    } finally {
      await db.delete(license).where(eq(license.id, revokedLicenseId)).run();
      await db.delete(licenseKey).where(eq(licenseKey.id, revokedKeyId)).run();
      await db.delete(user).where(eq(user.id, revokedUserId)).run();
    }
  });

  it("wrong fingerprint returns valid=false", async () => {
    const req = makeRequest({ licenseId, hardwareFp: "wrong-fp" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain("Fingerprint");
  });

  it("not found returns valid=false", async () => {
    const req = makeRequest({ licenseId: "nonexistent-id" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain("não encontrada");
  });
});
