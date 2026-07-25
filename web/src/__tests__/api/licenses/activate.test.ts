import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { POST } from "@/app/api/licenses/activate/route";
import { generateLicenseKey } from "@/lib/license-key";

const TEST_PREFIX = "test_activate";

function makeRequest(body: any) {
  return new Request("http://localhost/api/licenses/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

let testUserEmail = `${TEST_PREFIX}_user_${Date.now()}@example.com`;
let testKey = "";
let testUserId = "";
let testKeyId = "";

beforeAll(async () => {
  const pwHash = await await Bun.password.hash("TestPass123!", {
    algorithm: "bcrypt",
    cost: 10
  });
  const user = await prisma.user.create({
    data: {
      email: testUserEmail,
      passwordHash: pwHash,
      firstName: "Test",
      lastName: "Activate",
    },
  });
  testUserId = user.id;

  testKey = generateLicenseKey();
  const key = await prisma.licenseKey.create({
    data: {
      key: testKey,
      type: "STANDARD",
      durationDays: 30,
      maxCameras: -1,
      maxPeople: -1,
      status: "PENDING",
    },
  });
  testKeyId = key.id;
});

afterAll(async () => {
  await prisma.license.deleteMany({ where: { userId: testUserId } });
  await prisma.licenseKey.deleteMany({ where: { id: testKeyId } });
  await prisma.user.deleteMany({ where: { id: testUserId } });
});

beforeEach(async () => {
  await prisma.license.deleteMany({ where: { userId: testUserId } });
  await prisma.licenseKey.update({ where: { id: testKeyId }, data: { status: "PENDING" } });
});

describe("POST /api/licenses/activate", () => {
  it("successful activation returns valid=true with signedPayload, publicKey, features", async () => {
    const req = makeRequest({ key: testKey, email: testUserEmail, hardwareFp: "test-hw-001" });
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.valid).toBe(true);
    expect(data.signedPayload).toBeDefined();
    expect(data.publicKey).toBeDefined();
    expect(data.features).toEqual(["face_recognition"]);
    expect(data.type).toBe("STANDARD");
    expect(data.licenseId).toBeDefined();
    expect(data.expiresAt).toBeDefined();
  });

  it("double activate returns existing license (same licenseId)", async () => {
    const req1 = makeRequest({ key: testKey, email: testUserEmail, hardwareFp: "hw-001" });
    const res1 = await POST(req1);
    const data1 = await res1.json();
    const firstLicenseId = data1.licenseId;

    const req2 = makeRequest({ key: testKey, email: testUserEmail, hardwareFp: "hw-001" });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(res2.status).toBe(200);
    expect(data2.valid).toBe(true);
    expect(data2.licenseId).toBe(firstLicenseId);
  });

  it("missing key returns 400", async () => {
    const req = makeRequest({ email: testUserEmail });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("missing email returns 400", async () => {
    const req = makeRequest({ key: testKey });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("invalid key format returns 400", async () => {
    const req = makeRequest({ key: "INVALID-KEY", email: testUserEmail });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it("nonexistent key returns 404", async () => {
    const req = makeRequest({ key: "SEC-0000-0000-0000-0000", email: testUserEmail });
    const response = await POST(req);
    expect(response.status).toBe(404);
  });

  it("nonexistent user returns 404", async () => {
    const newKey = generateLicenseKey();
    const created = await prisma.licenseKey.create({
      data: { key: newKey, type: "STANDARD", durationDays: 30 },
    });
    try {
      const req = makeRequest({ key: newKey, email: "nobody@example.com" });
      const response = await POST(req);
      expect(response.status).toBe(404);
    } finally {
      await prisma.licenseKey.delete({ where: { id: created.id } });
    }
  });

  it("revoked key returns 403", async () => {
    const newKey = generateLicenseKey();
    const created = await prisma.licenseKey.create({
      data: { key: newKey, type: "STANDARD", durationDays: 30, status: "REVOKED" },
    });
    try {
      const req = makeRequest({ key: newKey, email: testUserEmail });
      const response = await POST(req);
      expect(response.status).toBe(403);
    } finally {
      await prisma.licenseKey.delete({ where: { id: created.id } });
    }
  });

  it("user already has active license returns 400", async () => {
    const req1 = makeRequest({ key: testKey, email: testUserEmail, hardwareFp: "hw-001" });
    await POST(req1);

    const secondKey = generateLicenseKey();
    const secondKeyRecord = await prisma.licenseKey.create({
      data: { key: secondKey, type: "STANDARD", durationDays: 30, status: "PENDING" },
    });
    try {
      const req2 = makeRequest({ key: secondKey, email: testUserEmail, hardwareFp: "hw-002" });
      const response = await POST(req2);
      expect(response.status).toBe(400);
    } finally {
      await prisma.licenseKey.delete({ where: { id: secondKeyRecord.id } });
    }
  });

  it("STANDARD type has features=[face_recognition]", async () => {
    const req = makeRequest({ key: testKey, email: testUserEmail, hardwareFp: "hw-features" });
    const response = await POST(req);
    const data = await response.json();
    expect(data.features).toEqual(["face_recognition"]);
    expect(data.type).toBe("STANDARD");
  });

  it("TRIAL type has correct maxCameras and maxPeople", async () => {
    const trialUserEmail = `${TEST_PREFIX}_trial_${Date.now()}@example.com`;
    const pwHash = await await Bun.password.hash("TestPass123!", {
    algorithm: "bcrypt",
    cost: 10
  });
    const trialUser = await prisma.user.create({
      data: {
        email: trialUserEmail,
        passwordHash: pwHash,
        firstName: "Trial",
        lastName: "User",
      },
    });

    const trialKey = generateLicenseKey();
    const trialKeyRecord = await prisma.licenseKey.create({
      data: {
        key: trialKey,
        type: "TRIAL",
        durationDays: 7,
        maxCameras: 1,
        maxPeople: 10,
        status: "PENDING",
      },
    });

    try {
      const req = makeRequest({ key: trialKey, email: trialUserEmail, hardwareFp: "trial-hw" });
      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.maxCameras).toBe(1);
      expect(data.maxPeople).toBe(10);
      expect(data.features).toEqual([]);
    } finally {
      await prisma.license.deleteMany({ where: { userId: trialUser.id } });
      await prisma.licenseKey.delete({ where: { id: trialKeyRecord.id } });
      await prisma.user.delete({ where: { id: trialUser.id } });
    }
  });
});
