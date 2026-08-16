import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { GET as ACCOUNTS_GET } from "@/app/api/auth/accounts/route";
import { POST as EMAIL_CODE_CHALLENGE_POST } from "@/app/api/auth/email-code/challenge/route";
import { POST as EMAIL_CODE_SEND_POST } from "@/app/api/auth/email-code/send/route";
import { POST as EMAIL_CODE_VERIFY_POST } from "@/app/api/auth/email-code/verify/route";
import { POST as EMAIL2FA_DISABLE_POST } from "@/app/api/auth/email2fa/disable/route";
import { POST as EMAIL2FA_ENABLE_POST } from "@/app/api/auth/email2fa/enable/route";
import { POST as EMAIL2FA_VERIFY_POST } from "@/app/api/auth/email2fa/verify/route";
import { POST as LOGOUT_POST } from "@/app/api/auth/logout/route";
import { GET as ME_GET, PUT as ME_PUT } from "@/app/api/auth/me/route";
import { POST as PIN_POST } from "@/app/api/auth/pin/route";
import { POST as PIN_LOGIN_POST } from "@/app/api/auth/pin-login/route";
import { POST as REFRESH_POST } from "@/app/api/auth/refresh/route";
import { db } from "@/db";
import { adminUser, user } from "@/db/schema";
import { createChallengeToken } from "@/lib/auth";
import { createEmailCode } from "@/lib/email";
import { createTestToken, createTestUser, makeRequest } from "../helpers/auth";

let userId = "";
let userEmail = "";
let userToken = "";
let refreshCookie = "";

vi.mock("next/headers", () => ({
	cookies: vi.fn().mockResolvedValue({
		get: (name: string) => {
			if (name === "token") return userToken ? { value: userToken } : undefined;
			if (name === "refresh_token")
				return refreshCookie ? { value: refreshCookie } : undefined;
			return undefined;
		},
	}),
}));

function json(body: unknown, path = "/api/auth/test") {
	return makeRequest(`http://localhost${path}`, { method: "POST", body });
}

async function cleanupUser(email: string) {
	const found = await db.select().from(user).where(eq(user.email, email)).get();
	if (found) await db.delete(user).where(eq(user.id, found.id)).run();
}

beforeAll(async () => {
	const result = await createTestUser(db, {
		email: `test_auth_session_${Date.now()}@example.com`,
		withPin: true,
	});
	userId = result.id;
	userEmail = result.email;
	userToken = await createTestToken(userId, userEmail);
	refreshCookie = await createTestToken(userId, userEmail, "refresh");
});

afterAll(async () => {
	await db.delete(user).where(eq(user.id, userId)).run();
	await db.delete(adminUser).run();
});

describe("POST /api/auth/pin", () => {
	it("returns a pin_token for valid email and pin", async () => {
		const res = await PIN_POST(json({ email: userEmail, pin: "1234" }));
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.pin_token).toBeDefined();
	});

	it("returns 400 for missing fields", async () => {
		const res = await PIN_POST(json({ email: userEmail }));
		expect(res.status).toBe(400);
	});

	it("returns 400 for non-numeric pin", async () => {
		const res = await PIN_POST(json({ email: userEmail, pin: "12a4" }));
		expect(res.status).toBe(400);
	});

	it("returns 401 for wrong pin", async () => {
		const res = await PIN_POST(json({ email: userEmail, pin: "9999" }));
		expect(res.status).toBe(401);
	});

	it("returns 401 when no pin is configured", async () => {
		const { email } = await createTestUser(db, {});
		const res = await PIN_POST(json({ email, pin: "1234" }));
		expect(res.status).toBe(401);
		await cleanupUser(email);
	});

	it("returns 403 for deactivated account", async () => {
		const { email, id } = await createTestUser(db, {
			withPin: true,
			isActive: false,
		});
		const res = await PIN_POST(json({ email, pin: "1234" }));
		expect(res.status).toBe(403);
		await db.delete(user).where(eq(user.id, id)).run();
	});
});

describe("POST /api/auth/pin-login", () => {
	it("returns access token and set-cookie for valid pin", async () => {
		const res = await PIN_LOGIN_POST(
			json({ email: userEmail, pin: "1234" }, "/api/auth/pin-login"),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.access_token).toBeDefined();
		expect(data.user.email).toBe(userEmail);
		expect(res.headers.get("set-cookie")).toContain("token=");
	});

	it("returns 400 when pin is not configured", async () => {
		const { email } = await createTestUser(db, {});
		const res = await PIN_LOGIN_POST(
			json({ email, pin: "1234" }, "/api/auth/pin-login"),
		);
		expect(res.status).toBe(400);
		await cleanupUser(email);
	});

	it("returns 401 for wrong pin", async () => {
		const res = await PIN_LOGIN_POST(
			json({ email: userEmail, pin: "9999" }, "/api/auth/pin-login"),
		);
		expect(res.status).toBe(401);
	});

	it("returns 401 for nonexistent email", async () => {
		const res = await PIN_LOGIN_POST(
			json({ email: "nobody@example.com", pin: "1234" }, "/api/auth/pin-login"),
		);
		expect(res.status).toBe(401);
	});
});

describe("POST /api/auth/email2fa/enable", () => {
	it("returns 401 without a session", async () => {
		userToken = "";
		try {
			const res = await EMAIL2FA_ENABLE_POST(json({}));
			expect(res.status).toBe(401);
		} finally {
			userToken = await createTestToken(userId, userEmail);
		}
	});

	it("returns success and creates an email code", async () => {
		const res = await EMAIL2FA_ENABLE_POST(json({}));
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
	});

	it("returns 400 when email 2FA is already enabled", async () => {
		const { email, id } = await createTestUser(db, { email2faEnabled: true });
		const token = await createTestToken(id, email);
		const prev = userToken;
		userToken = token;
		try {
			const res = await EMAIL2FA_ENABLE_POST(json({}));
			expect(res.status).toBe(400);
		} finally {
			userToken = prev;
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});
});

describe("POST /api/auth/email2fa/verify", () => {
	it("returns 400 for missing code", async () => {
		const res = await EMAIL2FA_VERIFY_POST(json({}));
		expect(res.status).toBe(400);
	});

	it("returns 401 for invalid code", async () => {
		const res = await EMAIL2FA_VERIFY_POST(json({ code: "000000" }));
		expect(res.status).toBe(401);
	});

	it("enables email 2FA with a valid code", async () => {
		const { email, id } = await createTestUser(db, {});
		const token = await createTestToken(id, email);
		const prev = userToken;
		userToken = token;
		try {
			const codeValue = await createEmailCode(email);
			const res = await EMAIL2FA_VERIFY_POST(json({ code: codeValue }));
			expect(res.status).toBe(200);
			const updated = await db.select().from(user).where(eq(user.id, id)).get();
			expect(updated?.email2faEnabled).toBe(true);
		} finally {
			userToken = prev;
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});
});

describe("POST /api/auth/email2fa/disable", () => {
	it("disables email 2FA", async () => {
		const { email, id } = await createTestUser(db, { email2faEnabled: true });
		const token = await createTestToken(id, email);
		const prev = userToken;
		userToken = token;
		try {
			const res = await EMAIL2FA_DISABLE_POST(json({}));
			expect(res.status).toBe(200);
			const updated = await db.select().from(user).where(eq(user.id, id)).get();
			expect(updated?.email2faEnabled).toBe(false);
		} finally {
			userToken = prev;
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});

	it("returns 401 without a session", async () => {
		const prev = userToken;
		userToken = "";
		try {
			const res = await EMAIL2FA_DISABLE_POST(json({}));
			expect(res.status).toBe(401);
		} finally {
			userToken = prev;
		}
	});
});

describe("POST /api/auth/email-code/send", () => {
	it("returns 400 for missing email", async () => {
		const res = await EMAIL_CODE_SEND_POST(json({}));
		expect(res.status).toBe(400);
	});

	it("returns 404 for unregistered email", async () => {
		const res = await EMAIL_CODE_SEND_POST(
			json({ email: "unknown@example.com" }),
		);
		expect(res.status).toBe(404);
	});

	it("creates a code for a registered email", async () => {
		const res = await EMAIL_CODE_SEND_POST(json({ email: userEmail }));
		expect(res.status).toBe(200);
	});
});

describe("POST /api/auth/email-code/challenge", () => {
	it("returns 400 for missing challenge token", async () => {
		const res = await EMAIL_CODE_CHALLENGE_POST(json({}));
		expect(res.status).toBe(400);
	});

	it("returns 401 for an invalid challenge token", async () => {
		const res = await EMAIL_CODE_CHALLENGE_POST(
			json({ challenge_token: "invalid" }),
		);
		expect(res.status).toBe(401);
	});

	it("returns 400 when email 2FA is not active", async () => {
		const { email, id } = await createTestUser(db, {});
		const challengeToken = await createChallengeToken(id, email);
		try {
			const res = await EMAIL_CODE_CHALLENGE_POST(
				json({ challenge_token: challengeToken }),
			);
			expect(res.status).toBe(400);
		} finally {
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});

	it("creates a code for an account with email 2FA active", async () => {
		const { email, id } = await createTestUser(db, {
			withSetup: true,
		});
		const challengeToken = await createChallengeToken(id, email);
		try {
			const res = await EMAIL_CODE_CHALLENGE_POST(
				json({ challenge_token: challengeToken }),
			);
			expect(res.status).toBe(200);
		} finally {
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});
});

describe("POST /api/auth/email-code/verify", () => {
	it("returns 400 for missing fields", async () => {
		const res = await EMAIL_CODE_VERIFY_POST(json({ email: userEmail }));
		expect(res.status).toBe(400);
	});

	it("returns 401 for an invalid code", async () => {
		const res = await EMAIL_CODE_VERIFY_POST(
			json({ email: userEmail, code: "000000" }),
		);
		expect(res.status).toBe(401);
	});

	it("returns an email-code challenge for a valid code", async () => {
		const { email, id } = await createTestUser(db, { withSetup: true });
		try {
			const code = await createEmailCode(email);
			const res = await EMAIL_CODE_VERIFY_POST(
				json({ email, code }, "/api/auth/email-code/verify"),
			);
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.challenge).toBe("email-code");
			expect(data.challenge_token).toBeDefined();
		} finally {
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});

	it("returns 401 for an unknown email", async () => {
		const res = await EMAIL_CODE_VERIFY_POST(
			json({ email: "nobody@example.com", code: "123456" }),
		);
		expect(res.status).toBe(401);
	});

	it("returns 403 for a deactivated account", async () => {
		const { email, id } = await createTestUser(db, { isActive: false });
		try {
			const code = await createEmailCode(email);
			const res = await EMAIL_CODE_VERIFY_POST(
				json({ email, code }, "/api/auth/email-code/verify"),
			);
			expect(res.status).toBe(403);
		} finally {
			await db.delete(user).where(eq(user.id, id)).run();
		}
	});
});

describe("POST /api/auth/refresh", () => {
	it("returns 401 without a refresh token", async () => {
		const prev = refreshCookie;
		refreshCookie = "";
		try {
			const res = await REFRESH_POST(json({}));
			expect(res.status).toBe(401);
		} finally {
			refreshCookie = prev;
		}
	});

	it("returns 401 for an invalid refresh token", async () => {
		const prev = refreshCookie;
		refreshCookie = "not-a-real-token";
		try {
			const res = await REFRESH_POST(json({}));
			expect(res.status).toBe(401);
		} finally {
			refreshCookie = prev;
		}
	});

	it("returns a new access token for a valid refresh token", async () => {
		const res = await REFRESH_POST(json({}));
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.access_token).toBeDefined();
		expect(res.headers.get("set-cookie")).toContain("token=");
	});

	it("issues an admin access token for an admin refresh token", async () => {
		const prev = refreshCookie;
		refreshCookie = await createTestToken(
			"admin",
			"admin@secureit.io",
			"refresh",
		);
		try {
			const res = await REFRESH_POST(json({}));
			const data = await res.json();
			expect(res.status).toBe(200);
			expect(data.access_token).toBeDefined();
			expect(res.headers.get("set-cookie")).toContain("admin_token=");
		} finally {
			refreshCookie = prev;
		}
	});
});

describe("POST /api/auth/logout", () => {
	it("clears the auth cookies", async () => {
		const res = await LOGOUT_POST(json({}));
		expect(res.status).toBe(200);
		const setCookie = res.headers.get("set-cookie") ?? "";
		expect(setCookie).toContain("token=");
		expect(setCookie).toContain("refresh_token=");
	});
});

describe("GET /api/auth/me", () => {
	it("returns 401 without a session", async () => {
		const prev = userToken;
		userToken = "";
		try {
			const res = await ME_GET();
			expect(res.status).toBe(401);
		} finally {
			userToken = prev;
		}
	});

	it("returns the current user", async () => {
		const res = await ME_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.user.id).toBe(userId);
		expect(data.user.email).toBe(userEmail);
		expect(data.license).toBeNull();
	});

	it("returns 404 for an unknown user", async () => {
		const prev = userToken;
		userToken = await createTestToken("missing-user", "missing@example.com");
		try {
			const res = await ME_GET();
			expect(res.status).toBe(404);
		} finally {
			userToken = prev;
		}
	});
});

describe("PUT /api/auth/me", () => {
	it("returns 400 for missing names", async () => {
		const res = await ME_PUT(json({ firstName: "OnlyFirst" }));
		expect(res.status).toBe(400);
	});

	it("returns 400 for an invalid pin", async () => {
		const res = await ME_PUT(
			json({ firstName: "A", lastName: "B", pin: "12" }),
		);
		expect(res.status).toBe(400);
	});

	it("updates the profile fields", async () => {
		const res = await ME_PUT(
			json({ firstName: "Updated", lastName: "Name", phone: "911222333" }),
		);
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.firstName).toBe("Updated");
		expect(data.lastName).toBe("Name");
		expect(data.phone).toBe("911222333");
	});

	it("sets and clears the account pin", async () => {
		const setRes = await ME_PUT(
			json({ firstName: "A", lastName: "B", pin: "4321" }),
		);
		expect(setRes.status).toBe(200);
		const withPin = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.get();
		expect(withPin?.pinHash).toBeDefined();

		const clearRes = await ME_PUT(
			json({ firstName: "A", lastName: "B", pin: null }),
		);
		expect(clearRes.status).toBe(200);
		const withoutPin = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.get();
		expect(withoutPin?.pinHash).toBeNull();
	});
});

describe("GET /api/auth/accounts", () => {
	it("returns 401 without a session", async () => {
		const prev = userToken;
		userToken = "";
		try {
			const res = await ACCOUNTS_GET();
			expect(res.status).toBe(401);
		} finally {
			userToken = prev;
		}
	});

	it("returns the account for the session", async () => {
		const res = await ACCOUNTS_GET();
		const data = await res.json();
		expect(res.status).toBe(200);
		expect(data.id).toBe(userId);
		expect(data.email).toBe(userEmail);
	});
});
