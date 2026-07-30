import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/db";
import {
	plan,
	planFeature,
	planService,
	adminUser,
	paymentInfo,
	paymentRequest,
	user,
	licenseKey,
	license,
	maintenanceRequest,
	notification,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { createTestUser, createTestToken, makeRequest } from "../helpers/auth";
import {
	GET as PLANS_GET,
	POST as PLANS_POST,
	PUT as PLANS_PUT,
} from "@/app/api/admin/plans/route";
import {
	GET as FEATURES_GET,
	POST as FEATURES_POST,
	PUT as FEATURES_PUT,
	DELETE as FEATURES_DELETE,
} from "@/app/api/admin/plans/[id]/features/route";
import {
	GET as SERVICES_GET,
	POST as SERVICES_POST,
	PUT as SERVICES_PUT,
	DELETE as SERVICES_DELETE,
} from "@/app/api/admin/plans/[id]/services/route";
import {
	GET as PI_GET,
	PUT as PI_PUT,
} from "@/app/api/admin/payment-info/route";
import { GET as PAYMENTS_GET } from "@/app/api/admin/payments/route";
import { PUT as PAYMENT_PUT } from "@/app/api/admin/payments/[id]/route";
import { GET as MAINT_GET } from "@/app/api/admin/maintenance/route";
import { PUT as MAINT_PUT } from "@/app/api/admin/maintenance/[id]/route";
import { POST as SEED_POST } from "@/app/api/admin/seed-plans/route";
import { hashPassword } from "@/lib/password";
import { generateId } from "@/db/schema";

let adminToken = "";
let adminId = "";
let testPlanId = "";
let testFeatureId = "";
let testServiceId = "";

vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		get: (name: string) => {
			if (name === "admin_token") return { value: adminToken };
			return undefined;
		},
	}),
}));

beforeAll(async () => {
	adminId = generateId();
	const pwHash = await hashPassword("AdminPass123456!", 10);
	await db
		.insert(adminUser)
		.values({
			id: adminId,
			email: `admin_test_${Date.now()}@example.com`,
			passwordHash: pwHash,
		})
		.run();
	adminToken = await createTestToken(
		adminId,
		`admin_test_${Date.now()}@example.com`,
	);
});

afterAll(async () => {
	if (testFeatureId)
		await db.delete(planFeature).where(eq(planFeature.id, testFeatureId)).run();
	if (testServiceId)
		await db.delete(planService).where(eq(planService.id, testServiceId)).run();
	if (testPlanId) {
		await db
			.delete(planFeature)
			.where(eq(planFeature.planId, testPlanId))
			.run();
		await db
			.delete(planService)
			.where(eq(planService.planId, testPlanId))
			.run();
		await db.delete(plan).where(eq(plan.id, testPlanId)).run();
	}
	await db.delete(adminUser).where(eq(adminUser.id, adminId)).run();
});

describe("Admin Plans CRUD", () => {
	it("POST /api/admin/plans - creates plan", async () => {
		const res = await PLANS_POST(
			makeRequest("http://localhost/api/admin/plans", {
				body: {
					name: "AdminTestPlan",
					basePrice: 50,
					durationDays: 30,
					description: "Test",
				},
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("AdminTestPlan");
		testPlanId = data.id;
	});

	it("POST /api/admin/plans - 400 for missing fields", async () => {
		const res = await PLANS_POST(
			makeRequest("http://localhost/api/admin/plans", {
				body: { name: "Incomplete" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("GET /api/admin/plans - lists plans", async () => {
		const res = await PLANS_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
		const found = data.find((p: any) => p.id === testPlanId);
		expect(found).toBeDefined();
	});

	it("PUT /api/admin/plans - updates plan", async () => {
		const res = await PLANS_PUT(
			makeRequest("http://localhost/api/admin/plans", {
				method: "PUT",
				body: { id: testPlanId, name: "UpdatedPlan", basePrice: 75 },
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("UpdatedPlan");
		expect(data.basePrice).toBe(75);
	});

	it("PUT /api/admin/plans - 400 for missing id", async () => {
		const res = await PLANS_PUT(
			makeRequest("http://localhost/api/admin/plans", {
				method: "PUT",
				body: { name: "No ID" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 401 without admin auth", async () => {
		adminToken = "";
		const res = await PLANS_GET();
		expect(res.status).toBe(401);
		const token = await createTestToken(adminId, "admin@test.com");
		adminToken = token;
	});
});

describe("Admin Plan Features CRUD", () => {
	it("POST - creates feature", async () => {
		const res = await FEATURES_POST(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/features`, {
				body: { name: "Test Feature", description: "Desc", price: 5 },
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("Test Feature");
		testFeatureId = data.id;
	});

	it("GET - lists features", async () => {
		const res = await FEATURES_GET(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/features`),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.some((f: any) => f.id === testFeatureId)).toBe(true);
	});

	it("PUT - updates feature", async () => {
		const res = await FEATURES_PUT(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/features`, {
				method: "PUT",
				body: { featureId: testFeatureId, name: "Updated Feature" },
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("Updated Feature");
	});

	it("PUT - 400 for missing featureId", async () => {
		const res = await FEATURES_PUT(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/features`, {
				method: "PUT",
				body: { name: "No ID" },
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		expect(res.status).toBe(400);
	});

	it("DELETE - removes feature", async () => {
		const res = await FEATURES_DELETE(
			makeRequest(
				`http://localhost/api/admin/plans/${testPlanId}/features?featureId=${testFeatureId}`,
				{ method: "DELETE" },
			),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
		testFeatureId = "";
	});

	it("DELETE - 400 for missing featureId", async () => {
		const res = await FEATURES_DELETE(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/features`, {
				method: "DELETE",
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		expect(res.status).toBe(400);
	});
});

describe("Admin Plan Services CRUD", () => {
	it("POST - creates service", async () => {
		const res = await SERVICES_POST(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/services`, {
				body: { name: "Test Service", price: 15 },
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("Test Service");
		testServiceId = data.id;
	});

	it("GET - lists services", async () => {
		const res = await SERVICES_GET(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/services`),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.some((s: any) => s.id === testServiceId)).toBe(true);
	});

	it("PUT - updates service", async () => {
		const res = await SERVICES_PUT(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/services`, {
				method: "PUT",
				body: { serviceId: testServiceId, name: "Updated Service" },
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("Updated Service");
	});

	it("PUT - 400 for missing serviceId", async () => {
		const res = await SERVICES_PUT(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/services`, {
				method: "PUT",
				body: { name: "No ID" },
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		expect(res.status).toBe(400);
	});

	it("DELETE - removes service", async () => {
		const res = await SERVICES_DELETE(
			makeRequest(
				`http://localhost/api/admin/plans/${testPlanId}/services?serviceId=${testServiceId}`,
				{ method: "DELETE" },
			),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.ok).toBe(true);
		testServiceId = "";
	});

	it("DELETE - 400 for missing serviceId", async () => {
		const res = await SERVICES_DELETE(
			makeRequest(`http://localhost/api/admin/plans/${testPlanId}/services`, {
				method: "DELETE",
			}),
			{ params: Promise.resolve({ id: testPlanId }) },
		);
		expect(res.status).toBe(400);
	});
});

describe("Admin Payment Info", () => {
	it("PUT - creates payment info when none exists", async () => {
		const res = await PI_PUT(
			makeRequest("http://localhost/api/admin/payment-info", {
				method: "PUT",
				body: {
					iban: "PT50000201231234567890154",
					accountName: "SecureIT Test",
					bankName: "BPI",
					reference: "INV-001",
				},
			}),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.iban).toBe("PT50000201231234567890154");
	});

	it("PUT - 400 for missing fields", async () => {
		const res = await PI_PUT(
			makeRequest("http://localhost/api/admin/payment-info", {
				method: "PUT",
				body: { iban: "PT50" },
			}),
		);
		expect(res.status).toBe(400);
	});

	it("GET - returns active payment info", async () => {
		const res = await PI_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data).not.toBeNull();
		expect(data.iban).toBeDefined();
	});

	it("returns 401 without admin auth", async () => {
		adminToken = "";
		const res = await PI_GET();
		expect(res.status).toBe(401);
		const token = await createTestToken(adminId, "admin@test.com");
		adminToken = token;
	});
});

describe("Admin Payments", () => {
	let userId = "";
	let prId = "";

	beforeAll(async () => {
		userId = generateId();
		await db
			.insert(user)
			.values({
				id: userId,
				email: `admin_pay_user_${Date.now()}@test.com`,
				passwordHash: "hash",
				firstName: "Pay",
				lastName: "User",
			})
			.run();

		const piRows = await db
			.select()
			.from(paymentInfo)
			.where(eq(paymentInfo.isActive, true))
			.limit(1)
			.all();
		const piId = piRows[0]?.id;

		if (testPlanId && piId) {
			prId = generateId();
			await db
				.insert(paymentRequest)
				.values({
					id: prId,
					userId,
					planId: testPlanId,
					paymentInfoId: piId,
					proofPublicId: "proof-123",
					proofUrl: "https://example.com/proof.jpg",
					status: "PENDING",
				})
				.run();
		}
	});

	afterAll(async () => {
		if (prId)
			await db.delete(paymentRequest).where(eq(paymentRequest.id, prId)).run();
		await db.delete(license).where(eq(license.userId, userId)).run();
		await db.delete(notification).where(eq(notification.userId, userId)).run();
		await db.delete(user).where(eq(user.id, userId)).run();
	});

	it("GET /api/admin/payments - lists payments", async () => {
		const res = await PAYMENTS_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
	});

	it("PUT /api/admin/payments/[id] - approve payment", async () => {
		if (!prId) return;
		const res = await PAYMENT_PUT(
			makeRequest("http://localhost/api/admin/payments/x", {
				method: "PUT",
				body: { status: "APPROVED", adminNote: "Looks good" },
			}),
			{ params: Promise.resolve({ id: prId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.status).toBe("APPROVED");
	});

	it("PUT /api/admin/payments/[id] - 400 for invalid status", async () => {
		const res = await PAYMENT_PUT(
			makeRequest("http://localhost/api/admin/payments/x", {
				method: "PUT",
				body: { status: "INVALID" },
			}),
			{ params: Promise.resolve({ id: "fake" }) },
		);
		expect(res.status).toBe(400);
	});

	it("PUT /api/admin/payments/[id] - 404 for nonexistent", async () => {
		const res = await PAYMENT_PUT(
			makeRequest("http://localhost/api/admin/payments/x", {
				method: "PUT",
				body: { status: "APPROVED" },
			}),
			{ params: Promise.resolve({ id: "nonexistent" }) },
		);
		expect(res.status).toBe(404);
	});
});

describe("Admin Maintenance", () => {
	let maintId = "";

	beforeAll(async () => {
		maintId = generateId();
		const uId = generateId();
		await db
			.insert(user)
			.values({
				id: uId,
				email: `admin_maint_user_${Date.now()}@test.com`,
				passwordHash: "hash",
				firstName: "Maint",
				lastName: "User",
			})
			.run();
		await db
			.insert(maintenanceRequest)
			.values({
				id: maintId,
				userId: uId,
				description: "Camera broken",
				status: "PENDING",
			})
			.run();
	});

	afterAll(async () => {
		await db
			.delete(maintenanceRequest)
			.where(eq(maintenanceRequest.id, maintId))
			.run();
	});

	it("GET /api/admin/maintenance - lists requests", async () => {
		const res = await MAINT_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
		const found = data.find((r: any) => r.id === maintId);
		expect(found).toBeDefined();
		expect(found.description).toBe("Camera broken");
	});

	it("PUT /api/admin/maintenance/[id] - updates request", async () => {
		const res = await MAINT_PUT(
			makeRequest("http://localhost/api/admin/maintenance/x", {
				method: "PUT",
				body: { status: "IN_PROGRESS", adminNote: "Looking into it" },
			}),
			{ params: Promise.resolve({ id: maintId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.status).toBe("IN_PROGRESS");
		expect(data.adminNote).toBe("Looking into it");
	});
});

describe("Admin Seed Plans", () => {
	it("POST /api/admin/seed-plans - seeds or returns existing", async () => {
		const res = await SEED_POST();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.plans).toBeDefined();
		expect(Array.isArray(data.plans)).toBe(true);
		expect(data.plans.length).toBeGreaterThanOrEqual(1);
	});

	it("returns 401 without admin auth", async () => {
		adminToken = "";
		const res = await SEED_POST();
		expect(res.status).toBe(401);
		const token = await createTestToken(adminId, "admin@test.com");
		adminToken = token;
	});
});
