import { eq } from "drizzle-orm";
import { afterAll, describe, expect, it, vi } from "vitest";
import { GET as GOOGLE_BRIDGE_GET } from "@/app/api/auth/google/bridge/route";
import { db } from "@/db";
import { user } from "@/db/schema";

const createdEmails: string[] = [];

vi.mock("@/lib/next-auth", () => ({
	auth: vi.fn().mockResolvedValue(null),
	authConfig: {},
}));

function session(overrides: Record<string, unknown> = {}) {
	const email = `google_${Date.now()}_${Math.random().toString(36).slice(2)}@gmail.com`;
	return {
		user: {
			email,
			name: "Ana Google",
			googleId: `google-id-${Math.random().toString(36).slice(2)}`,
			googleEmailVerified: true,
			...overrides,
		},
	};
}

function googleRequest() {
	return new Request("http://localhost/api/auth/google/bridge");
}

afterAll(async () => {
	for (const email of createdEmails) {
		const found = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();
		if (found) await db.delete(user).where(eq(user.id, found.id)).run();
	}
});

describe("GET /api/auth/google/bridge", () => {
	it("redirects to /login when no session exists", async () => {
		const { auth } = await import("@/lib/next-auth");
		vi.mocked(auth).mockResolvedValue(null);
		const res = await GOOGLE_BRIDGE_GET(googleRequest());
		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toContain("/login?error=google_failed");
	});

	it("redirects to setup for a new google user without totp", async () => {
		const { auth } = await import("@/lib/next-auth");
		const s = session();
		createdEmails.push(s.user.email);
		vi.mocked(auth).mockResolvedValue(s as never);

		const res = await GOOGLE_BRIDGE_GET(googleRequest());
		expect(res.status).toBe(307);
		const location = res.headers.get("location") ?? "";
		expect(location).toContain("/setup?setup_token=");

		const created = await db
			.select()
			.from(user)
			.where(eq(user.email, s.user.email))
			.get();
		expect(created).toBeDefined();
		expect(created?.googleId).toBe(s.user.googleId);
		expect(created?.emailVerified).toBe(true);
		expect(created?.email2faEnabled).toBe(true);
	});

	it("redirects to my-account for an existing user with totp", async () => {
		const { auth } = await import("@/lib/next-auth");
		const s = session();
		const googleEmail = s.user.email;
		createdEmails.push(googleEmail);
		vi.mocked(auth).mockResolvedValue(s as never);

		await GOOGLE_BRIDGE_GET(googleRequest());
		const found = await db
			.select()
			.from(user)
			.where(eq(user.email, googleEmail))
			.get();
		expect(found).toBeDefined();
		if (!found) throw new Error("user should exist");

		await db
			.update(user)
			.set({ totpEnabled: true })
			.where(eq(user.id, found.id))
			.run();

		const res = await GOOGLE_BRIDGE_GET(googleRequest());
		expect(res.status).toBe(307);
		const location = res.headers.get("location") ?? "";
		expect(location).toContain("/my-account");
		expect(res.headers.get("set-cookie")).toContain("token=");
	});

	it("redirects with google_email_not_verified when email is unverified", async () => {
		const { auth } = await import("@/lib/next-auth");
		const s = session({ googleEmailVerified: false });
		vi.mocked(auth).mockResolvedValue(s as never);

		const res = await GOOGLE_BRIDGE_GET(googleRequest());
		expect(res.status).toBe(307);
		expect(res.headers.get("location")).toContain("google_email_not_verified");
	});
});
