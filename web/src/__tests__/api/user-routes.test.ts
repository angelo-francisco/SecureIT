import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST as REVOKE_POST } from "@/app/api/licenses/revoke/route";
import { POST as MAINTENANCE_POST } from "@/app/api/maintenance/request/route";
import { GET as MY_LICENSE_GET } from "@/app/api/my-account/license/route";
import { GET as NOTIFICATIONS_GET } from "@/app/api/notifications/route";
import { POST as PAYMENTS_POST } from "@/app/api/payments/submit/route";
import {
	GET as PROFILES_GET,
	POST as PROFILES_POST,
} from "@/app/api/profiles/route";
import { db } from "@/db";
import {
	generateId,
	license,
	licenseKey,
	maintenanceRequest,
	notification,
	paymentInfo,
	paymentRequest,
	plan,
	subProfile,
	user,
} from "@/db/schema";
import {
	createTestLicense,
	createTestToken,
	createTestUser,
	makeRequest,
} from "../helpers/auth";

let userId = "";
let userEmail = "";
let userToken = "";
let profileId = "";

vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		get: (name: string) => {
			if (name === "token") return { value: userToken };
			return undefined;
		},
	}),
}));

beforeAll(async () => {
	const result = await createTestUser(db, {
		email: `test_user_routes_${Date.now()}@example.com`,
	});
	userId = result.id;
	userEmail = result.email;
	userToken = await createTestToken(userId, userEmail);

	profileId = generateId();
	await db
		.insert(subProfile)
		.values({
			id: profileId,
			userId,
			name: "Default",
			isDefault: true,
		})
		.run();
});

afterAll(async () => {
	await db
		.delete(maintenanceRequest)
		.where(eq(maintenanceRequest.userId, userId))
		.run();
	await db
		.delete(paymentRequest)
		.where(eq(paymentRequest.userId, userId))
		.run();
	await db.delete(license).where(eq(license.userId, userId)).run();
	await db.delete(subProfile).where(eq(subProfile.userId, userId)).run();
	await db.delete(notification).where(eq(notification.userId, userId)).run();
	await db.delete(user).where(eq(user.id, userId)).run();
});

describe("GET /api/profiles", () => {
	it("returns user profiles", async () => {
		const res = await PROFILES_GET(
			makeRequest("http://localhost/api/profiles", { token: userToken }),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBeGreaterThanOrEqual(1);
		expect(data[0].name).toBe("Default");
		expect(data[0].hasPin).toBe(false);
	});

	it("returns 401 without auth", async () => {
		const saved = userToken;
		userToken = "";
		const res = await PROFILES_GET(
			makeRequest("http://localhost/api/profiles"),
		);
		expect(res.status).toBe(401);
		userToken = saved;
	});
});

describe("POST /api/profiles", () => {
	it("creates a new profile", async () => {
		const res = await PROFILES_POST(
			makeRequest("http://localhost/api/profiles", {
				token: userToken,
				body: { name: "New Profile", avatarColor: "#FF0000" },
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("New Profile");
		expect(data.avatarColor).toBe("#FF0000");
		expect(data.hasPin).toBe(false);

		await db.delete(subProfile).where(eq(subProfile.id, data.id)).run();
	});

	it("creates profile with pin", async () => {
		const res = await PROFILES_POST(
			makeRequest("http://localhost/api/profiles", {
				token: userToken,
				body: { name: "Pin Profile", pin: "5678" },
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.hasPin).toBe(true);

		await db.delete(subProfile).where(eq(subProfile.id, data.id)).run();
	});

	it("returns 400 for empty name", async () => {
		const res = await PROFILES_POST(
			makeRequest("http://localhost/api/profiles", {
				token: userToken,
				body: { name: "" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid pin", async () => {
		const res = await PROFILES_POST(
			makeRequest("http://localhost/api/profiles", {
				token: userToken,
				body: { name: "Bad Pin", pin: "12" },
			}),
		);
		expect(res.status).toBe(400);
	});
});

describe("GET /api/notifications", () => {
	it("returns notifications and unread count", async () => {
		const notifId = generateId();
		await db
			.insert(notification)
			.values({
				id: notifId,
				userId,
				type: "TEST",
				title: "Test Notif",
				message: "Hello",
			})
			.run();

		const res = await NOTIFICATIONS_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.notifications).toBeDefined();
		expect(data.unreadCount).toBeGreaterThanOrEqual(1);

		await db.delete(notification).where(eq(notification.id, notifId)).run();
	});

	it("returns 401 without auth", async () => {
		userToken = "";
		const res = await NOTIFICATIONS_GET();
		expect(res.status).toBe(401);
		const result = await createTestToken(userId, userEmail);
		userToken = result;
	});
});

describe("POST /api/licenses/revoke", () => {
	it("revokes an active license", async () => {
		const { licId, keyId } = await createTestLicense(db, userId);

		const res = await REVOKE_POST();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);

		await db.delete(license).where(eq(license.id, licId)).run();
		await db.delete(licenseKey).where(eq(licenseKey.id, keyId)).run();
	});

	it("returns 404 when no active license", async () => {
		const res = await REVOKE_POST();
		expect(res.status).toBe(404);
	});
});

describe("POST /api/maintenance/request", () => {
	it("returns 400 for missing licenseId", async () => {
		const res = await MAINTENANCE_POST(
			makeRequest("http://localhost/api/maintenance/request", {
				token: userToken,
				body: { description: "Fix camera" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 for missing description", async () => {
		const res = await MAINTENANCE_POST(
			makeRequest("http://localhost/api/maintenance/request", {
				token: userToken,
				body: { licenseId: "fake-id" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid license", async () => {
		const res = await MAINTENANCE_POST(
			makeRequest("http://localhost/api/maintenance/request", {
				token: userToken,
				body: { licenseId: "nonexistent", description: "Help" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("creates maintenance request for valid license", async () => {
		const { licId } = await createTestLicense(db, userId);

		const res = await MAINTENANCE_POST(
			makeRequest("http://localhost/api/maintenance/request", {
				token: userToken,
				body: { licenseId: licId, description: "Camera not working" },
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.description).toBe("Camera not working");
		expect(data.hasPaidLicense).toBe(false);

		await db
			.delete(maintenanceRequest)
			.where(eq(maintenanceRequest.id, data.id))
			.run();
		await db.delete(license).where(eq(license.id, licId)).run();
	});

	it("returns 401 without auth", async () => {
		const saved = userToken;
		userToken = "";
		const res = await MAINTENANCE_POST(
			makeRequest("http://localhost/api/maintenance/request", {
				body: { licenseId: "x", description: "y" },
			}),
		);
		expect(res.status).toBe(401);
		userToken = saved;
	});
});

describe("GET /api/my-account/license", () => {
	it("returns license and payments for user", async () => {
		const res = await MY_LICENSE_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data).toHaveProperty("license");
		expect(data).toHaveProperty("payments");
		expect(Array.isArray(data.payments)).toBe(true);
	});

	it("returns 401 without auth", async () => {
		userToken = "";
		const res = await MY_LICENSE_GET();
		expect(res.status).toBe(401);
		const result = await createTestToken(userId, userEmail);
		userToken = result;
	});
});

describe("POST /api/payments/submit", () => {
	let planId = "";
	let piId = "";

	beforeAll(async () => {
		planId = generateId();
		await db
			.insert(plan)
			.values({
				id: planId,
				name: "B2C",
				basePrice: 29.99,
				durationDays: 30,
				updatedAt: new Date().toISOString(),
			})
			.run();

		piId = generateId();
		await db
			.insert(paymentInfo)
			.values({
				id: piId,
				iban: "PT50000201231234567890154",
				accountName: "SecureIT",
				isActive: true,
			})
			.run();
	});

	afterAll(async () => {
		await db
			.delete(paymentRequest)
			.where(eq(paymentRequest.userId, userId))
			.run();
		await db.delete(paymentInfo).where(eq(paymentInfo.id, piId)).run();
		await db.delete(plan).where(eq(plan.id, planId)).run();
	});

	it("returns 400 for missing fields", async () => {
		const res = await PAYMENTS_POST(
			makeRequest("http://localhost/api/payments/submit", {
				token: userToken,
				body: { planId },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("creates payment request", async () => {
		const res = await PAYMENTS_POST(
			makeRequest("http://localhost/api/payments/submit", {
				token: userToken,
				body: {
					planId,
					proofPublicId: "test-proof-id",
					proofUrl: "https://example.com/proof.jpg",
				},
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.plan).toBeDefined();
		expect(data.plan.name).toBe("B2C");
	});

	it("returns 404 for nonexistent plan", async () => {
		const res = await PAYMENTS_POST(
			makeRequest("http://localhost/api/payments/submit", {
				token: userToken,
				body: {
					planId: "nonexistent",
					proofPublicId: "x",
					proofUrl: "https://x.com",
				},
			}),
		);
		expect(res.status).toBe(404);
	});
});
