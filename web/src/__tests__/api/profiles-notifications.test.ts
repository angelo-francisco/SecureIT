import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { POST as ADMIN_LOGIN_POST } from "@/app/api/admin/login/route";
import { PUT as NOTIFICATION_READ_PUT } from "@/app/api/notifications/[id]/read/route";
import { PUT as NOTIFICATIONS_READ_ALL_PUT } from "@/app/api/notifications/read-all/route";
import { GET as PAYMENTS_GET } from "@/app/api/payments/route";
import {
	DELETE as PROFILE_DELETE,
	PUT as PROFILE_PUT,
} from "@/app/api/profiles/[id]/route";
import { POST as PROFILE_SELECT_POST } from "@/app/api/profiles/[id]/select/route";
import { db } from "@/db";
import {
	adminUser,
	generateId,
	notification,
	paymentInfo,
	paymentRequest,
	plan,
	subProfile,
	user,
} from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { createTestToken, createTestUser, makeRequest } from "../helpers/auth";

let userId = "";
let userEmail = "";
let userToken = "";
let defaultProfileId = "";
let secondaryProfileId = "";
let pinProfileId = "";

vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		get: (name: string) => {
			if (name === "token") return userToken ? { value: userToken } : undefined;
			return undefined;
		},
	}),
}));

function req(body: unknown, path = "/api/test", method = "POST") {
	return makeRequest(`http://localhost${path}`, { method, body });
}

beforeAll(async () => {
	const result = await createTestUser(db, {
		email: `test_profiles_${Date.now()}@example.com`,
	});
	userId = result.id;
	userEmail = result.email;
	userToken = await createTestToken(userId, userEmail);

	defaultProfileId = generateId();
	await db
		.insert(subProfile)
		.values({ id: defaultProfileId, userId, name: "Default", isDefault: true })
		.run();

	secondaryProfileId = generateId();
	await db
		.insert(subProfile)
		.values({ id: secondaryProfileId, userId, name: "Secondary" })
		.run();

	const pinHash = await hashPassword("1234");
	pinProfileId = generateId();
	await db
		.insert(subProfile)
		.values({ id: pinProfileId, userId, name: "PinProtected", pinHash })
		.run();
});

afterAll(async () => {
	await db
		.delete(paymentRequest)
		.where(eq(paymentRequest.userId, userId))
		.run();
	await db.delete(notification).where(eq(notification.userId, userId)).run();
	await db.delete(subProfile).where(eq(subProfile.userId, userId)).run();
	await db.delete(user).where(eq(user.id, userId)).run();
	await db.delete(adminUser).run();
	await db.delete(paymentInfo).run();
	await db.delete(plan).run();
});

describe("PUT /api/profiles/[id]", () => {
	it("updates the profile name and avatar color", async () => {
		const res = await PROFILE_PUT(
			req(
				{ name: "Renamed", avatarColor: "#FF0000" },
				`/api/profiles/${secondaryProfileId}`,
				"PUT",
			),
			{ params: Promise.resolve({ id: secondaryProfileId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.name).toBe("Renamed");
		expect(data.avatarColor).toBe("#FF0000");
	});

	it("sets and clears the profile pin", async () => {
		const setRes = await PROFILE_PUT(
			req(
				{ name: "Secondary", pin: "5678" },
				`/api/profiles/${secondaryProfileId}`,
				"PUT",
			),
			{ params: Promise.resolve({ id: secondaryProfileId }) },
		);
		expect(setRes.status).toBe(200);
		const withPin = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.id, secondaryProfileId))
			.get();
		expect(withPin?.pinHash).toBeDefined();

		const clearRes = await PROFILE_PUT(
			req(
				{ name: "Secondary", pin: null },
				`/api/profiles/${secondaryProfileId}`,
				"PUT",
			),
			{ params: Promise.resolve({ id: secondaryProfileId }) },
		);
		expect(clearRes.status).toBe(200);
		const withoutPin = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.id, secondaryProfileId))
			.get();
		expect(withoutPin?.pinHash).toBeNull();
	});

	it("returns 400 for an invalid pin", async () => {
		const res = await PROFILE_PUT(
			req(
				{ name: "Secondary", pin: "123" },
				`/api/profiles/${secondaryProfileId}`,
				"PUT",
			),
			{ params: Promise.resolve({ id: secondaryProfileId }) },
		);
		expect(res.status).toBe(400);
	});

	it("returns 404 for another user's profile", async () => {
		const other = await createTestUser(db, {});
		const otherProfileId = generateId();
		await db
			.insert(subProfile)
			.values({ id: otherProfileId, userId: other.id, name: "Other" })
			.run();
		const res = await PROFILE_PUT(
			req({ name: "Hijack" }, `/api/profiles/${otherProfileId}`, "PUT"),
			{ params: Promise.resolve({ id: otherProfileId }) },
		);
		expect(res.status).toBe(404);
		await db.delete(subProfile).where(eq(subProfile.id, otherProfileId)).run();
		await db.delete(user).where(eq(user.id, other.id)).run();
	});

	it("returns 401 without a session", async () => {
		const prev = userToken;
		userToken = "";
		try {
			const res = await PROFILE_PUT(
				req({ name: "X" }, `/api/profiles/${secondaryProfileId}`, "PUT"),
				{ params: Promise.resolve({ id: secondaryProfileId }) },
			);
			expect(res.status).toBe(401);
		} finally {
			userToken = prev;
		}
	});
});

describe("DELETE /api/profiles/[id]", () => {
	it("deletes a non-default profile", async () => {
		const tempId = generateId();
		await db
			.insert(subProfile)
			.values({ id: tempId, userId, name: "Temp" })
			.run();
		const res = await PROFILE_DELETE(
			req({}, `/api/profiles/${tempId}`, "DELETE"),
			{ params: Promise.resolve({ id: tempId }) },
		);
		expect(res.status).toBe(200);
		const remaining = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.id, tempId))
			.get();
		expect(remaining).toBeUndefined();
	});

	it("returns 400 when deleting the default profile", async () => {
		const res = await PROFILE_DELETE(
			req({}, `/api/profiles/${defaultProfileId}`, "DELETE"),
			{ params: Promise.resolve({ id: defaultProfileId }) },
		);
		expect(res.status).toBe(400);
	});

	it("returns 404 for another user's profile", async () => {
		const other = await createTestUser(db, {});
		const otherProfileId = generateId();
		await db
			.insert(subProfile)
			.values({ id: otherProfileId, userId: other.id, name: "Other" })
			.run();
		const res = await PROFILE_DELETE(
			req({}, `/api/profiles/${otherProfileId}`, "DELETE"),
			{ params: Promise.resolve({ id: otherProfileId }) },
		);
		expect(res.status).toBe(404);
		await db.delete(subProfile).where(eq(subProfile.id, otherProfileId)).run();
		await db.delete(user).where(eq(user.id, other.id)).run();
	});
});

describe("POST /api/profiles/[id]/select", () => {
	it("selects a profile without a pin", async () => {
		const res = await PROFILE_SELECT_POST(
			req({}, `/api/profiles/${secondaryProfileId}/select`),
			{ params: Promise.resolve({ id: secondaryProfileId }) },
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.id).toBe(secondaryProfileId);
	});

	it("returns 400 when a pin is required but missing", async () => {
		const res = await PROFILE_SELECT_POST(
			req({}, `/api/profiles/${pinProfileId}/select`),
			{ params: Promise.resolve({ id: pinProfileId }) },
		);
		expect(res.status).toBe(400);
	});

	it("returns 401 for a wrong pin", async () => {
		const res = await PROFILE_SELECT_POST(
			req({ pin: "9999" }, `/api/profiles/${pinProfileId}/select`),
			{ params: Promise.resolve({ id: pinProfileId }) },
		);
		expect(res.status).toBe(401);
	});

	it("selects a pin-protected profile with the correct pin", async () => {
		const res = await PROFILE_SELECT_POST(
			req({ pin: "1234" }, `/api/profiles/${pinProfileId}/select`),
			{ params: Promise.resolve({ id: pinProfileId }) },
		);
		expect(res.status).toBe(200);
	});

	it("returns 404 for an unknown profile", async () => {
		const res = await PROFILE_SELECT_POST(
			req({}, "/api/profiles/unknown/select"),
			{ params: Promise.resolve({ id: "unknown" }) },
		);
		expect(res.status).toBe(404);
	});
});

describe("PUT /api/notifications/[id]/read", () => {
	let notifId = "";
	beforeAll(async () => {
		notifId = generateId();
		await db
			.insert(notification)
			.values({ id: notifId, userId, type: "info", title: "T", message: "M" })
			.run();
	});

	it("marks a notification as read", async () => {
		const res = await NOTIFICATION_READ_PUT(
			req({}, `/api/notifications/${notifId}/read`, "PUT"),
			{ params: Promise.resolve({ id: notifId }) },
		);
		expect(res.status).toBe(200);
		const updated = await db
			.select()
			.from(notification)
			.where(eq(notification.id, notifId))
			.get();
		expect(updated?.read).toBe(true);
	});
});

describe("PUT /api/notifications/read-all", () => {
	it("marks all of the user's notifications as read", async () => {
		await db.insert(notification).values({
			id: generateId(),
			userId,
			type: "info",
			title: "T1",
			message: "M1",
		});
		await db.insert(notification).values({
			id: generateId(),
			userId,
			type: "info",
			title: "T2",
			message: "M2",
		});
		const res = await NOTIFICATIONS_READ_ALL_PUT(
			req({}, "/api/notifications/read-all", "PUT"),
		);
		expect(res.status).toBe(200);
		const unread = await db
			.select()
			.from(notification)
			.where(eq(notification.userId, userId))
			.all();
		expect(unread.length).toBeGreaterThan(0);
		expect(unread.every((n) => n.read === true)).toBe(true);
	});

	it("returns 401 without a session", async () => {
		const prev = userToken;
		userToken = "";
		try {
			const res = await NOTIFICATIONS_READ_ALL_PUT(
				req({}, "/api/notifications/read-all", "PUT"),
			);
			expect(res.status).toBe(401);
		} finally {
			userToken = prev;
		}
	});
});

describe("GET /api/payments", () => {
	let planId = "";
	let infoId = "";

	beforeAll(async () => {
		planId = generateId();
		await db
			.insert(plan)
			.values({
				id: planId,
				name: "Pro",
				basePrice: 49,
				durationDays: 30,
				isActive: true,
			})
			.run();

		infoId = generateId();
		await db
			.insert(paymentInfo)
			.values({
				id: infoId,
				iban: "AO06000000000000000000001",
				accountName: "Test Bank",
				bankName: "Bank",
				reference: "REF",
				isActive: true,
			})
			.run();

		await db
			.insert(paymentRequest)
			.values({
				id: generateId(),
				userId,
				planId,
				paymentInfoId: infoId,
				proofPublicId: "proof-1",
				proofUrl: "https://example.com/proof-1",
				status: "PENDING",
			})
			.run();
	});

	it("returns the user's payment requests with plan details", async () => {
		const res = await PAYMENTS_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(Array.isArray(data)).toBe(true);
		expect(data.length).toBe(1);
		expect(data[0].plan).toMatchObject({ id: planId, name: "Pro" });
		expect(data[0].paymentInfo).toMatchObject({
			iban: "AO06000000000000000000001",
			accountName: "Test Bank",
		});
	});

	it("returns 401 without a session", async () => {
		const prev = userToken;
		userToken = "";
		try {
			const res = await PAYMENTS_GET();
			expect(res.status).toBe(401);
		} finally {
			userToken = prev;
		}
	});
});

describe("POST /api/admin/login", () => {
	let adminEmail = "";
	let adminPassword = "";

	beforeAll(async () => {
		adminEmail = "admin@secureit.io";
		adminPassword = "AdminPass123456!";
		await db.insert(adminUser).values({
			email: adminEmail,
			passwordHash: await hashPassword(adminPassword),
		});
	});

	it("returns 400 for missing fields", async () => {
		const res = await ADMIN_LOGIN_POST(req({ email: adminEmail }));
		expect(res.status).toBe(400);
	});

	it("returns 401 for wrong password", async () => {
		const res = await ADMIN_LOGIN_POST(
			req({ email: adminEmail, password: "WrongPass123!" }),
		);
		expect(res.status).toBe(401);
	});

	it("returns success and sets the admin cookie", async () => {
		const res = await ADMIN_LOGIN_POST(
			req({ email: adminEmail, password: adminPassword }),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.success).toBe(true);
		expect(res.headers.get("set-cookie")).toContain("admin_token=");
	});
});
