import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/licenses/heartbeat/route";
import { generateLicenseKey } from "@/lib/license-key";
import bcrypt from "bcryptjs";

const TEST_PREFIX = "test_heartbeat";

function makeRequest(body: any) {
  return new Request("http://localhost/api/licenses/heartbeat", {
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
  const pwHash = await bcrypt.hash("TestPass123!", 10);
  const user = await prisma.user.create({
    data: {
      email: testEmail,
      passwordHash: pwHash,
      firstName: "Heartbeat",
      lastName: "Test",
    },
  });
  userId = user.id;

  testKey = generateLicenseKey();
  const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const key = await prisma.licenseKey.create({
    data: {
      key: testKey,
      type: "STANDARD",
      durationDays: 30,
      status: "ACTIVE",
    },
  });
  keyId = key.id;

  const license = await prisma.license.create({
    data: {
      keyId: key.id,
      userId: user.id,
      activatedAt: now,
      expiresAt: futureExpiry,
      hardwareFp: "test-hw-fp",
    },
  });
  licenseId = license.id;
});

afterAll(async () => {
  await prisma.license.deleteMany({ where: { userId } });
  await prisma.licenseKey.deleteMany({ where: { id: keyId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe("POST /api/licenses/heartbeat", () => {
  it("valid heartbeat by licenseId", async () => {
    const req = makeRequest({ licenseId, hardwareFp: "test-hw-fp" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.isActive).toBe(true);
    expect(data.revoked).toBe(false);
    expect(data.type).toBe("STANDARD");
    expect(data.daysRemaining).toBeGreaterThan(0);
  });

  it("valid heartbeat by email", async () => {
    const req = makeRequest({ email: testEmail, hardwareFp: "test-hw-fp" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(data.isActive).toBe(true);
  });

  it("wrong fingerprint returns valid=false", async () => {
    const req = makeRequest({ licenseId, hardwareFp: "wrong-fingerprint" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain("Fingerprint");
  });

  it("revoked key returns valid=false with revoked=true", async () => {
    const revokedUserEmail = `${TEST_PREFIX}_revoked_${Date.now()}@example.com`;
    const pwHash = await bcrypt.hash("TestPass123!", 10);
    const revokedUser = await prisma.user.create({
      data: { email: revokedUserEmail, passwordHash: pwHash, firstName: "Rev", lastName: "User" },
    });

    const revokedKey = generateLicenseKey();
    const revokedKeyRecord = await prisma.licenseKey.create({
      data: { key: revokedKey, type: "STANDARD", durationDays: 30, status: "REVOKED" },
    });

    const futureExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const revokedLicense = await prisma.license.create({
      data: {
        keyId: revokedKeyRecord.id,
        userId: revokedUser.id,
        activatedAt: new Date(),
        expiresAt: futureExpiry,
        hardwareFp: "some-hw",
      },
    });

    try {
      const req = makeRequest({ licenseId: revokedLicense.id });
      const response = await POST(req);
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.revoked).toBe(true);
    } finally {
      await prisma.license.delete({ where: { id: revokedLicense.id } });
      await prisma.licenseKey.delete({ where: { id: revokedKeyRecord.id } });
      await prisma.user.delete({ where: { id: revokedUser.id } });
    }
  });

  it("no license found returns valid=false", async () => {
    const req = makeRequest({ licenseId: "nonexistent-id" });
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(false);
    expect(data.error).toContain("não encontrada");
  });

  it("expired license returns valid=false", async () => {
    const expiredUserEmail = `${TEST_PREFIX}_expired_${Date.now()}@example.com`;
    const pwHash = await bcrypt.hash("TestPass123!", 10);
    const expiredUser = await prisma.user.create({
      data: { email: expiredUserEmail, passwordHash: pwHash, firstName: "Exp", lastName: "User" },
    });

    const expiredKey = generateLicenseKey();
    const expiredKeyRecord = await prisma.licenseKey.create({
      data: { key: expiredKey, type: "STANDARD", durationDays: 1, status: "ACTIVE" },
    });

    const pastExpiry = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const expiredLicense = await prisma.license.create({
      data: {
        keyId: expiredKeyRecord.id,
        userId: expiredUser.id,
        activatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        expiresAt: pastExpiry,
        hardwareFp: "some-hw",
      },
    });

    try {
      const req = makeRequest({ licenseId: expiredLicense.id });
      const response = await POST(req);
      const data = await response.json();

      expect(data.valid).toBe(false);
      expect(data.isActive).toBe(false);
    } finally {
      await prisma.license.delete({ where: { id: expiredLicense.id } });
      await prisma.licenseKey.delete({ where: { id: expiredKeyRecord.id } });
      await prisma.user.delete({ where: { id: expiredUser.id } });
    }
  });

  it("missing licenseId and email returns valid=false", async () => {
    const req = makeRequest({});
    const response = await POST(req);
    const data = await response.json();

    expect(data.valid).toBe(false);
  });
});
