import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/db";
import { adminUser, licenseKey } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { generateLicenseKey } from "@/lib/license-key";
import { generateId } from "@/db/schema";

let adminToken = "";
let adminUserId = "";

const ADMIN_EMAIL = `admin_test_${Date.now()}@example.com`;
const ADMIN_PASSWORD = "AdminPass123!";

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (name: string) => {
      if (name === "admin_token" && adminToken) return { value: adminToken };
      return undefined;
    },
  }),
}));

function makeAdminRequest(url: string, options?: { method?: string; body?: any }) {
  const method = options?.method || "GET";
  const init: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
  }
  return new Request(url, init);
}

beforeAll(async () => {
  const pwHash = await hashPassword(ADMIN_PASSWORD, 10);
  adminUserId = generateId();
  await db
    .insert(adminUser)
    .values({ id: adminUserId, email: ADMIN_EMAIL, passwordHash: pwHash })
    .run();
  adminToken = await createToken({ sub: "admin", email: ADMIN_EMAIL }, "access");
});

afterAll(async () => {
  await db.delete(adminUser).where(eq(adminUser.id, adminUserId)).run();
});

const testLicenseKeys: string[] = [];

describe("POST /api/admin/licenses/generate", () => {
  it("generate STANDARD x2 returns count=2", async () => {
    const { POST: generatePost } = await import("@/app/api/admin/licenses/generate/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/generate", {
      method: "POST",
      body: { type: "STANDARD", durationDays: 30, quantity: 2 },
    });

    const response = await generatePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(2);
    expect(data.licenses).toHaveLength(2);
    expect(data.licenses[0].type).toBe("STANDARD");
    testLicenseKeys.push(...data.licenses.map((l: any) => l.id));
  });

  it("generate TRIAL x1 returns type=TRIAL", async () => {
    const { POST: generatePost } = await import("@/app/api/admin/licenses/generate/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/generate", {
      method: "POST",
      body: { type: "TRIAL", durationDays: 7, quantity: 1 },
    });

    const response = await generatePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.count).toBe(1);
    expect(data.licenses[0].type).toBe("TRIAL");
    expect(data.licenses[0].maxCameras).toBe(1);
    expect(data.licenses[0].maxPeople).toBe(10);
    testLicenseKeys.push(data.licenses[0].id);
  });

  it("invalid type returns 400", async () => {
    const { POST: generatePost } = await import("@/app/api/admin/licenses/generate/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/generate", {
      method: "POST",
      body: { type: "PREMIUM", durationDays: 30, quantity: 1 },
    });

    const response = await generatePost(req);
    expect(response.status).toBe(400);
  });

  it("quantity=0 returns 400", async () => {
    const { POST: generatePost } = await import("@/app/api/admin/licenses/generate/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/generate", {
      method: "POST",
      body: { type: "STANDARD", durationDays: 30, quantity: 0 },
    });

    const response = await generatePost(req);
    expect(response.status).toBe(400);
  });

  it("quantity=101 returns 400", async () => {
    const { POST: generatePost } = await import("@/app/api/admin/licenses/generate/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/generate", {
      method: "POST",
      body: { type: "STANDARD", durationDays: 30, quantity: 101 },
    });

    const response = await generatePost(req);
    expect(response.status).toBe(400);
  });
});

describe("GET /api/admin/licenses", () => {
  it("returns list with pagination", async () => {
    const { GET: licensesGet } = await import("@/app/api/admin/licenses/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses?page=1&limit=10");
    const response = await licensesGet(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.licenses).toBeDefined();
    expect(Array.isArray(data.licenses)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination.total).toBeGreaterThanOrEqual(0);
  });
});

describe("GET /api/admin/licenses/[id]", () => {
  it("returns key details", async () => {
    const { GET: licenseGet } = await import("@/app/api/admin/licenses/[id]/route");

    if (testLicenseKeys.length === 0) {
      throw new Error("No test license keys created");
    }

    const targetId = testLicenseKeys[0];
    const req = makeAdminRequest(`http://localhost/api/admin/licenses/${targetId}`);
    const response = await licenseGet(req, { params: Promise.resolve({ id: targetId }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe(targetId);
    expect(data.key).toBeDefined();
    expect(data.type).toBeDefined();
  });

  it("nonexistent returns 404", async () => {
    const { GET: licenseGet } = await import("@/app/api/admin/licenses/[id]/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/nonexistent-id");
    const response = await licenseGet(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/admin/licenses/[id]", () => {
  it("revokes license (sets status=REVOKED)", async () => {
    const { DELETE: licenseDelete } = await import("@/app/api/admin/licenses/[id]/route");

    const newKey = generateLicenseKey();
    const createdId = generateId();
    await db
      .insert(licenseKey)
      .values({ id: createdId, key: newKey, type: "STANDARD", durationDays: 30 })
      .run();

    try {
      const req = makeAdminRequest(`http://localhost/api/admin/licenses/${createdId}`, {
        method: "DELETE",
      });
      const response = await licenseDelete(req, { params: Promise.resolve({ id: createdId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      const updated = await db.select().from(licenseKey).where(eq(licenseKey.id, createdId)).get();
      expect(updated!.status).toBe("REVOKED");
    } finally {
      await db.delete(licenseKey).where(eq(licenseKey.id, createdId)).run();
    }
  });

  it("nonexistent returns 404", async () => {
    const { DELETE: licenseDelete } = await import("@/app/api/admin/licenses/[id]/route");
    const req = makeAdminRequest("http://localhost/api/admin/licenses/nonexistent-id", {
      method: "DELETE",
    });
    const response = await licenseDelete(req, { params: Promise.resolve({ id: "nonexistent-id" }) });
    expect(response.status).toBe(404);
  });
});

describe("unauthenticated admin access", () => {
  it("returns 401 when not authenticated", async () => {
    const savedToken = adminToken;
    adminToken = "";

    try {
      const { GET: licensesGet } = await import("@/app/api/admin/licenses/route");
      const req = makeAdminRequest("http://localhost/api/admin/licenses");
      const response = await licensesGet(req);
      expect(response.status).toBe(401);
    } finally {
      adminToken = savedToken;
    }
  });
});
