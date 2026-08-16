import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createSetupToken } from "@/lib/auth";
import { resolveSetupUser } from "@/lib/setup";
import { createTestUser } from "../helpers/auth";

const TEST = "setup_test";
let userId = "";
let email = "";

beforeAll(async () => {
	const u = await createTestUser(db, { email: `${TEST}@example.com` });
	userId = u.id;
	email = u.email;
});

afterAll(async () => {
	await db.delete(user).where(eq(user.id, userId)).run();
});

describe("lib/setup resolveSetupUser", () => {
	it("returns 400 when no token is provided", async () => {
		const result = await resolveSetupUser(undefined);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.status).toBe(400);
	});

	it("returns 401 for an invalid token", async () => {
		const result = await resolveSetupUser("not-a-real-token");
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.status).toBe(401);
	});

	it("returns 404 when the token user no longer exists", async () => {
		const token = await createSetupToken("missing-user-id", email);
		const result = await resolveSetupUser(token);
		expect(result.ok).toBe(false);
		if (!result.ok) expect(result.status).toBe(404);
	});

	it("returns the user for a valid token", async () => {
		const token = await createSetupToken(userId, email);
		const result = await resolveSetupUser(token);
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.user.id).toBe(userId);
	});
});
