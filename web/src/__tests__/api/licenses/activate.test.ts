import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/db";
import { user, license, licenseKey } from "@/db/schema";
import { eq } from "drizzle-orm";
import { POST } from "@/app/api/licenses/activate/route";
import { generateLicenseKey } from "@/lib/license-key";
import { hashPassword } from "@/lib/password";
import { generateId } from "@/db/schema";

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
	const pwHash = await hashPassword("TestPass123!", 10);
	testUserId = generateId();
	await db
		.insert(user)
		.values({
			id: testUserId,
			email: testUserEmail,
			passwordHash: pwHash,
			firstName: "Test",
			lastName: "Activate",
		})
		.run();

	testKey = generateLicenseKey();
	testKeyId = generateId();
	await db
		.insert(licenseKey)
		.values({
			id: testKeyId,
			key: testKey,
			type: "B2C",
			durationDays: 30,
			maxCameras: -1,
			maxPeople: -1,
			status: "PENDING",
		})
		.run();
});

afterAll(async () => {
	await db.delete(license).where(eq(license.userId, testUserId)).run();
	await db.delete(licenseKey).where(eq(licenseKey.id, testKeyId)).run();
	await db.delete(user).where(eq(user.id, testUserId)).run();
});

beforeEach(async () => {
	await db.delete(license).where(eq(license.userId, testUserId)).run();
	await db
		.update(licenseKey)
		.set({ status: "PENDING" })
		.where(eq(licenseKey.id, testKeyId))
		.run();
});

describe("POST /api/licenses/activate", () => {
	it("successful activation returns valid=true with signedPayload, publicKey, features", async () => {
		const req = makeRequest({
			key: testKey,
			email: testUserEmail,
			hardwareFp: "test-hw-001",
		});
		const response = await POST(req);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.valid).toBe(true);
		expect(data.signedPayload).toBeDefined();
		expect(data.publicKey).toBeDefined();
		expect(data.features).toEqual(["face_recognition"]);
		expect(data.type).toBe("B2C");
		expect(data.licenseId).toBeDefined();
		expect(data.expiresAt).toBeDefined();
	});

	it("double activate returns existing license (same licenseId)", async () => {
		const req1 = makeRequest({
			key: testKey,
			email: testUserEmail,
			hardwareFp: "hw-001",
		});
		const res1 = await POST(req1);
		const data1 = await res1.json();
		const firstLicenseId = data1.licenseId;

		const req2 = makeRequest({
			key: testKey,
			email: testUserEmail,
			hardwareFp: "hw-001",
		});
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
		const req = makeRequest({
			key: "SEC-0000-0000-0000-0000",
			email: testUserEmail,
		});
		const response = await POST(req);
		expect(response.status).toBe(404);
	});

	it("nonexistent user returns 404", async () => {
		const newKey = generateLicenseKey();
		const createdId = generateId();
		await db
			.insert(licenseKey)
			.values({
				id: createdId,
				key: newKey,
				type: "B2C",
				durationDays: 30,
			})
			.run();
		try {
			const req = makeRequest({ key: newKey, email: "nobody@example.com" });
			const response = await POST(req);
			expect(response.status).toBe(404);
		} finally {
			await db.delete(licenseKey).where(eq(licenseKey.id, createdId)).run();
		}
	});

	it("revoked key returns 403", async () => {
		const newKey = generateLicenseKey();
		const createdId = generateId();
		await db
			.insert(licenseKey)
			.values({
				id: createdId,
				key: newKey,
				type: "B2C",
				durationDays: 30,
				status: "REVOKED",
			})
			.run();
		try {
			const req = makeRequest({ key: newKey, email: testUserEmail });
			const response = await POST(req);
			expect(response.status).toBe(403);
		} finally {
			await db.delete(licenseKey).where(eq(licenseKey.id, createdId)).run();
		}
	});

	it("user already has active license returns 400", async () => {
		const req1 = makeRequest({
			key: testKey,
			email: testUserEmail,
			hardwareFp: "hw-001",
		});
		await POST(req1);

		const secondKey = generateLicenseKey();
		const secondKeyId = generateId();
		await db
			.insert(licenseKey)
			.values({
				id: secondKeyId,
				key: secondKey,
				type: "B2C",
				durationDays: 30,
				status: "PENDING",
			})
			.run();
		try {
			const req2 = makeRequest({
				key: secondKey,
				email: testUserEmail,
				hardwareFp: "hw-002",
			});
			const response = await POST(req2);
			expect(response.status).toBe(400);
		} finally {
			await db.delete(licenseKey).where(eq(licenseKey.id, secondKeyId)).run();
		}
	});

	it("B2C type has features=[face_recognition]", async () => {
		const req = makeRequest({
			key: testKey,
			email: testUserEmail,
			hardwareFp: "hw-features",
		});
		const response = await POST(req);
		const data = await response.json();
		expect(data.features).toEqual(["face_recognition"]);
		expect(data.type).toBe("B2C");
	});

	it("B2B type has correct maxCameras and maxPeople", async () => {
		const b2bUserEmail = `${TEST_PREFIX}_b2b_${Date.now()}@example.com`;
		const pwHash = await hashPassword("TestPass123!", 10);
		const b2bUserId = generateId();
		await db
			.insert(user)
			.values({
				id: b2bUserId,
				email: b2bUserEmail,
				passwordHash: pwHash,
				firstName: "B2B",
				lastName: "User",
			})
			.run();

		const b2bKey = generateLicenseKey();
		const b2bKeyId = generateId();
		await db
			.insert(licenseKey)
			.values({
				id: b2bKeyId,
				key: b2bKey,
				type: "B2B",
				durationDays: 7,
				maxCameras: -1,
				maxPeople: -1,
				status: "PENDING",
			})
			.run();

		try {
			const req = makeRequest({
				key: b2bKey,
				email: b2bUserEmail,
				hardwareFp: "b2b-hw",
			});
			const response = await POST(req);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.valid).toBe(true);
			expect(data.maxCameras).toBe(-1);
			expect(data.maxPeople).toBe(-1);
			expect(data.features).toEqual(["face_recognition"]);
		} finally {
			await db.delete(license).where(eq(license.userId, b2bUserId)).run();
			await db.delete(licenseKey).where(eq(licenseKey.id, b2bKeyId)).run();
			await db.delete(user).where(eq(user.id, b2bUserId)).run();
		}
	});
});
