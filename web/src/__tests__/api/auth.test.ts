import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as CHECK_EMAIL_POST } from "@/app/api/auth/check-email/route";
import { POST as LOGIN_POST } from "@/app/api/auth/login/route";
import { POST } from "@/app/api/auth/signup/route";
import { db } from "@/db";
import { subProfile, user } from "@/db/schema";
import { createTestUser } from "../helpers/auth";

const TEST = "test_auth";

let userId = "";

beforeAll(async () => {
	const result = await createTestUser(db, {
		email: `${TEST}_existing@example.com`,
	});
	userId = result.id;
});

afterAll(async () => {
	const newUsers = await db
		.select()
		.from(user)
		.where(eq(user.email, `${TEST}_new@example.com`))
		.all();
	for (const u of newUsers) {
		await db.delete(subProfile).where(eq(subProfile.userId, u.id)).run();
		await db.delete(user).where(eq(user.id, u.id)).run();
	}
	const profileUsers = await db
		.select()
		.from(user)
		.where(eq(user.email, `${TEST}_profile_test@example.com`))
		.all();
	for (const u of profileUsers) {
		await db.delete(subProfile).where(eq(subProfile.userId, u.id)).run();
		await db.delete(user).where(eq(user.id, u.id)).run();
	}
	await db.delete(subProfile).where(eq(subProfile.userId, userId)).run();
	await db.delete(user).where(eq(user.id, userId)).run();
});

function req(body: unknown, path = "/api/auth/signup") {
	return new Request(`http://localhost${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});
}

describe("POST /api/auth/signup", () => {
	it("creates user and returns tokens", async () => {
		const res = await POST(
			req({
				email: `${TEST}_new@example.com`,
				password: "TestPass123456!",
				firstName: "João",
				lastName: "Silva",
			}),
		);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(data.access_token).toBeDefined();
		expect(data.user.email).toBe(`${TEST}_new@example.com`);
		expect(data.user.firstName).toBe("João");
		expect(data.user.totpEnabled).toBe(false);
	});

	it("returns 400 for missing fields", async () => {
		const res = await POST(req({ email: "x@test.com" }));
		expect(res.status).toBe(400);
		const data = await res.json();
		expect(data.error).toBeDefined();
	});

	it("returns 400 for short password", async () => {
		const res = await POST(
			req({
				email: `${TEST}_short@test.com`,
				password: "short",
				firstName: "A",
				lastName: "B",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid pin", async () => {
		const res = await POST(
			req({
				email: `${TEST}_pin@test.com`,
				password: "TestPass123456!",
				firstName: "A",
				lastName: "B",
				pin: "12",
			}),
		);
		expect(res.status).toBe(400);
	});

	it("returns 409 for duplicate email", async () => {
		const res = await POST(
			req({
				email: `${TEST}_existing@example.com`,
				password: "TestPass123456!",
				firstName: "Dup",
				lastName: "User",
			}),
		);
		expect(res.status).toBe(409);
	});

	it("creates default profile on signup", async () => {
		const res = await POST(
			req({
				email: `${TEST}_profile_test@example.com`,
				password: "TestPass123456!",
				firstName: "Profile",
				lastName: "Test",
			}),
		);
		expect(res.status).toBe(200);
		const data = await res.json();
		const profiles = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.userId, data.user.id))
			.all();
		expect(profiles.length).toBe(1);
		expect(profiles[0].isDefault).toBe(true);
	});
});

describe("POST /api/auth/login", () => {
	it("returns tokens for valid credentials", async () => {
		const res = await LOGIN_POST(
			req(
				{
					email: `${TEST}_existing@example.com`,
					password: "TestPass123456!",
				},
				"/api/auth/login",
			),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.access_token).toBeDefined();
		expect(data.user.email).toBe(`${TEST}_existing@example.com`);
	});

	it("returns 400 for missing fields", async () => {
		const res = await LOGIN_POST(
			req({ email: "x@test.com" }, "/api/auth/login"),
		);
		expect(res.status).toBe(400);
	});

	it("returns 401 for wrong password", async () => {
		const res = await LOGIN_POST(
			req(
				{
					email: `${TEST}_existing@example.com`,
					password: "WrongPassword12345!",
				},
				"/api/auth/login",
			),
		);
		expect(res.status).toBe(401);
	});

	it("returns 401 for nonexistent user", async () => {
		const res = await LOGIN_POST(
			req(
				{
					email: "nonexistent@test.com",
					password: "TestPass123456!",
				},
				"/api/auth/login",
			),
		);
		expect(res.status).toBe(401);
	});

	it("returns 403 for deactivated account", async () => {
		const { id } = await createTestUser(db, {
			email: `${TEST}_deactivated@example.com`,
			isActive: false,
		});
		const res = await LOGIN_POST(
			req(
				{
					email: `${TEST}_deactivated@example.com`,
					password: "TestPass123456!",
				},
				"/api/auth/login",
			),
		);
		expect(res.status).toBe(403);
		await db.delete(user).where(eq(user.id, id)).run();
	});
});

describe("POST /api/auth/check-email", () => {
	it("returns valid=true for existing email", async () => {
		const res = await CHECK_EMAIL_POST(
			req({ email: `${TEST}_existing@example.com` }, "/api/auth/check-email"),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.valid).toBe(true);
	});

	it("returns 400 for missing email", async () => {
		const res = await CHECK_EMAIL_POST(req({}, "/api/auth/check-email"));
		expect(res.status).toBe(400);
	});

	it("returns 404 for nonexistent email", async () => {
		const res = await CHECK_EMAIL_POST(
			req({ email: "nonexistent_check@test.com" }, "/api/auth/check-email"),
		);
		expect(res.status).toBe(404);
	});

	it("returns 403 for deactivated account", async () => {
		const { id } = await createTestUser(db, {
			email: `${TEST}_check_deactivated@example.com`,
			isActive: false,
		});
		const res = await CHECK_EMAIL_POST(
			req(
				{ email: `${TEST}_check_deactivated@example.com` },
				"/api/auth/check-email",
			),
		);
		expect(res.status).toBe(403);
		await db.delete(user).where(eq(user.id, id)).run();
	});
});
