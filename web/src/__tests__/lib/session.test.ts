import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user } from "@/db/schema";
import type { AuthUser } from "@/lib/session";
import {
	buildUserPayload,
	issueAuthRedirect,
	issueAuthResponse,
	issueChallengeResponse,
	issueSetupRedirect,
	issueSetupResponse,
	requiresTwoFactorSetup,
} from "@/lib/session";
import { createTestUser } from "../helpers/auth";

const TEST = "session_test";
let plainUser: AuthUser;
let setupUser: AuthUser;

async function fetchUser(id: string): Promise<AuthUser> {
	const row = await db.select().from(user).where(eq(user.id, id)).get();
	if (!row) throw new Error("user not found");
	return row;
}

beforeAll(async () => {
	const plain = await createTestUser(db, {
		email: `${TEST}_plain@example.com`,
	});
	plainUser = await fetchUser(plain.id);
	const setup = await createTestUser(db, {
		email: `${TEST}_setup@example.com`,
		withSetup: true,
	});
	setupUser = await fetchUser(setup.id);
});

afterAll(async () => {
	await db.delete(user).where(eq(user.id, plainUser.id)).run();
	await db.delete(user).where(eq(user.id, setupUser.id)).run();
});

describe("lib/session requiresTwoFactorSetup", () => {
	it("requires setup when email is not verified", () => {
		expect(requiresTwoFactorSetup({ ...plainUser, emailVerified: false })).toBe(
			true,
		);
	});

	it("requires setup when email 2FA is disabled", () => {
		expect(
			requiresTwoFactorSetup({ ...setupUser, email2faEnabled: false }),
		).toBe(true);
	});

	it("requires setup when TOTP is disabled", () => {
		expect(requiresTwoFactorSetup({ ...setupUser, totpEnabled: false })).toBe(
			true,
		);
	});

	it("returns false when fully set up", () => {
		expect(requiresTwoFactorSetup(setupUser)).toBe(false);
	});
});

describe("lib/session buildUserPayload", () => {
	it("exposes only public user fields", () => {
		const payload = buildUserPayload(setupUser);
		expect(payload).toMatchObject({
			id: setupUser.id,
			email: setupUser.email,
			firstName: setupUser.firstName,
			lastName: setupUser.lastName,
			totpEnabled: true,
			email2faEnabled: true,
			isActive: true,
		});
		expect(payload).not.toHaveProperty("passwordHash");
		expect(payload).not.toHaveProperty("pinHash");
		expect(payload).not.toHaveProperty("totpSecret");
	});
});

describe("lib/session issueAuthResponse", () => {
	it("returns access token, user payload and sets cookies", async () => {
		const res = await issueAuthResponse(setupUser);
		const data = await res.json();

		expect(res.status).toBe(200);
		expect(typeof data.access_token).toBe("string");
		expect(data.user.email).toBe(setupUser.email);
		expect(data.user).not.toHaveProperty("passwordHash");

		const setCookie = res.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain("token=");
		expect(setCookie).toContain("refresh_token=");
		expect(setCookie).toContain("HttpOnly");
	});
});

describe("lib/session issueChallengeResponse", () => {
	it("returns a challenge token for the requested method", async () => {
		const res = await issueChallengeResponse(setupUser, "email-code");
		const data = await res.json();
		expect(data.challenge).toBe("email-code");
		expect(typeof data.challenge_token).toBe("string");
		expect(data.email).toBe(setupUser.email);
	});
});

describe("lib/session issueSetupResponse", () => {
	it("returns a setup token and requires_setup flag", async () => {
		const res = await issueSetupResponse(plainUser);
		const data = await res.json();
		expect(data.requires_setup).toBe(true);
		expect(typeof data.setup_token).toBe("string");
		expect(data.email).toBe(plainUser.email);
	});
});

describe("lib/session redirect helpers", () => {
	it("issueAuthRedirect sets auth cookies on the redirect", async () => {
		const res = await issueAuthRedirect(
			setupUser,
			"http://localhost:3000/my-account",
		);
		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toBe(
			"http://localhost:3000/my-account",
		);
		const setCookie = res.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain("token=");
	});

	it("issueSetupRedirect builds a /setup URL with the token", async () => {
		const res = await issueSetupRedirect(plainUser, "http://localhost:3000");
		expect(res.status).toBe(307);
		const location = res.headers.get("location") ?? "";
		expect(
			location.startsWith("http://localhost:3000/setup?setup_token="),
		).toBe(true);
	});
});
