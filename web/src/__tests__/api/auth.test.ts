import { eq } from "drizzle-orm";
import * as OTPAuth from "otpauth";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST as CHECK_EMAIL_POST } from "@/app/api/auth/check-email/route";
import { POST as EMAIL_CODE_COMPLETE_POST } from "@/app/api/auth/email-code/complete/route";
import { POST as LOGIN_POST } from "@/app/api/auth/login/route";
import { POST as SETUP_EMAIL_SEND_POST } from "@/app/api/auth/setup/email/send/route";
import { POST as SETUP_EMAIL_VERIFY_POST } from "@/app/api/auth/setup/email/verify/route";
import { POST as SETUP_STATUS_POST } from "@/app/api/auth/setup/status/route";
import { POST as SETUP_TOTP_POST } from "@/app/api/auth/setup/totp/route";
import { POST as SETUP_TOTP_VERIFY_POST } from "@/app/api/auth/setup/totp/verify/route";
import { POST } from "@/app/api/auth/signup/route";
import { POST as TOTP_LOGIN_POST } from "@/app/api/auth/totp/login/route";
import { db } from "@/db";
import { subProfile, user } from "@/db/schema";
import { createSetupToken } from "@/lib/auth";
import { createEmailCode } from "@/lib/email";
import { createTestUser } from "../helpers/auth";

const TEST = "test_auth";

let userId = "";
let existingEmail = "";

function generateTotpCode(secret: string): string {
	return new OTPAuth.TOTP({
		issuer: "SecureIT",
		label: "",
		algorithm: "SHA1",
		digits: 6,
		period: 30,
		secret: OTPAuth.Secret.fromBase32(secret),
	}).generate();
}

beforeAll(async () => {
	const result = await createTestUser(db, {
		email: `${TEST}_existing@example.com`,
		withSetup: true,
	});
	userId = result.id;
	existingEmail = result.email;
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
	const onboardUsers = await db
		.select()
		.from(user)
		.where(eq(user.email, `${TEST}_onboard@example.com`))
		.all();
	for (const u of onboardUsers) {
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
	it("creates user and returns setup response", async () => {
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
		expect(data.requires_setup).toBe(true);
		expect(data.setup_token).toBeDefined();
		expect(data.email).toBe(`${TEST}_new@example.com`);
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
				email: existingEmail,
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
		const created = await db
			.select()
			.from(user)
			.where(eq(user.email, `${TEST}_profile_test@example.com`))
			.get();
		expect(created).toBeDefined();
		if (!created) throw new Error("user should exist");
		const profiles = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.userId, created.id))
			.all();
		expect(profiles.length).toBe(1);
		expect(profiles[0].isDefault).toBe(true);
	});
});

describe("POST /api/auth/login", () => {
	it("returns requires_setup for account without 2FA", async () => {
		const { email } = await createTestUser(db, {});
		const res = await LOGIN_POST(
			req(
				{
					email,
					password: "TestPass123456!",
				},
				"/api/auth/login",
			),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.requires_setup).toBe(true);
		expect(data.setup_token).toBeDefined();
		await db.delete(user).where(eq(user.email, email)).run();
	});

	it("returns email-code challenge for valid credentials", async () => {
		const res = await LOGIN_POST(
			req(
				{
					email: existingEmail,
					password: "TestPass123456!",
				},
				"/api/auth/login",
			),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.challenge).toBe("email-code");
		expect(data.challenge_token).toBeDefined();
	});

	it("completes login with password and email code", async () => {
		const loginRes = await LOGIN_POST(
			req(
				{
					email: existingEmail,
					password: "TestPass123456!",
				},
				"/api/auth/login",
			),
		);
		const loginData = await loginRes.json();
		const code = await createEmailCode(existingEmail);

		const completeRes = await EMAIL_CODE_COMPLETE_POST(
			req(
				{
					challenge_token: loginData.challenge_token,
					code,
				},
				"/api/auth/email-code/complete",
			),
		);
		const completeData = await completeRes.json();
		expect(completeRes.status).toBe(200);
		expect(completeData.access_token).toBeDefined();
		expect(completeData.user.email).toBe(existingEmail);
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
					email: existingEmail,
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

describe("POST /api/auth/totp/login", () => {
	it("returns 400 when authenticator is not configured", async () => {
		const { email } = await createTestUser(db, {});
		const res = await TOTP_LOGIN_POST(
			req(
				{
					email,
					code: "123456",
				},
				"/api/auth/totp/login",
			),
		);
		expect(res.status).toBe(400);
		await db.delete(user).where(eq(user.email, email)).run();
	});

	it("returns access tokens for a valid authenticator code", async () => {
		const { email } = await createTestUser(db, { withSetup: true });
		const secret = new OTPAuth.Secret({ size: 20 }).base32;
		const found = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();
		expect(found).toBeDefined();
		if (!found) throw new Error("user should exist");
		await db
			.update(user)
			.set({ totpSecret: secret, totpEnabled: true })
			.where(eq(user.id, found.id))
			.run();

		const code = generateTotpCode(secret);
		const res = await TOTP_LOGIN_POST(
			req(
				{
					email,
					code,
				},
				"/api/auth/totp/login",
			),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.access_token).toBeDefined();
		expect(data.user.email).toBe(email);
		await db.delete(user).where(eq(user.email, email)).run();
	});
});

describe("POST /api/auth/setup", () => {
	it("completes the full onboarding flow", async () => {
		const email = `${TEST}_onboard@example.com`;
		const signupRes = await POST(
			req({
				email,
				password: "TestPass123456!",
				firstName: "João",
				lastName: "Silva",
			}),
		);
		const signupData = await signupRes.json();
		const setupToken = signupData.setup_token as string;
		expect(signupData.requires_setup).toBe(true);

		const statusRes = await SETUP_STATUS_POST(
			req({ setup_token: setupToken }, "/api/auth/setup/status"),
		);
		const statusData = await statusRes.json();
		expect(statusData.emailVerified).toBe(false);
		expect(statusData.totpEnabled).toBe(false);

		const sendRes = await SETUP_EMAIL_SEND_POST(
			req({ setup_token: setupToken }, "/api/auth/setup/email/send"),
		);
		expect(sendRes.status).toBe(200);

		const code = await createEmailCode(email);
		const verifyEmailRes = await SETUP_EMAIL_VERIFY_POST(
			req({ setup_token: setupToken, code }, "/api/auth/setup/email/verify"),
		);
		expect(verifyEmailRes.status).toBe(200);

		const totpRes = await SETUP_TOTP_POST(
			req({ setup_token: setupToken }, "/api/auth/setup/totp"),
		);
		const totpData = await totpRes.json();
		expect(totpData.secret).toBeDefined();
		expect(totpData.uri).toContain("otpauth://");

		const totpCode = generateTotpCode(totpData.secret);
		const verifyTotpRes = await SETUP_TOTP_VERIFY_POST(
			req(
				{ setup_token: setupToken, code: totpCode },
				"/api/auth/setup/totp/verify",
			),
		);
		const verifyTotpData = await verifyTotpRes.json();
		expect(verifyTotpRes.status).toBe(200);
		expect(verifyTotpData.access_token).toBeDefined();
		expect(verifyTotpData.user.email).toBe(email);
	});

	it("rejects an invalid setup token", async () => {
		const res = await SETUP_STATUS_POST(
			req({ setup_token: "invalid" }, "/api/auth/setup/status"),
		);
		expect(res.status).toBe(401);
	});

	it("authenticates existing user with totp when email step completes", async () => {
		const { email, id } = await createTestUser(db, {
			totpEnabled: true,
			email2faEnabled: true,
			emailVerified: false,
		});
		const setupToken = await createSetupToken(id, email);

		const statusRes = await SETUP_STATUS_POST(
			req({ setup_token: setupToken }, "/api/auth/setup/status"),
		);
		const statusData = await statusRes.json();
		expect(statusData.emailVerified).toBe(false);
		expect(statusData.totpEnabled).toBe(true);

		const code = await createEmailCode(email);
		const verifyRes = await SETUP_EMAIL_VERIFY_POST(
			req({ setup_token: setupToken, code }, "/api/auth/setup/email/verify"),
		);
		const verifyData = await verifyRes.json();
		expect(verifyRes.status).toBe(200);
		expect(verifyData.access_token).toBeDefined();
		expect(verifyData.user.email).toBe(email);

		await db.delete(user).where(eq(user.id, id)).run();
	});
});

describe("POST /api/auth/check-email", () => {
	it("returns valid=true for existing email", async () => {
		const res = await CHECK_EMAIL_POST(
			req({ email: existingEmail }, "/api/auth/check-email"),
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
