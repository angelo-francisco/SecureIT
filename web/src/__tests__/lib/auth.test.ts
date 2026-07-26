import { describe, it, expect } from "vitest";
import { createToken, verifyAccessToken, verifyRefreshToken } from "@/lib/auth";

describe("lib/auth", () => {
	const testPayload = {
		sub: "test-user-123",
		email: "test@example.com",
	};

	it("createToken returns a JWT string", async () => {
		const token = await createToken(testPayload, "access");
		expect(typeof token).toBe("string");
		expect(token.split(".")).toHaveLength(3);
	});

	it("verifyAccessToken with valid token returns payload with sub, email, type", async () => {
		const token = await createToken(testPayload, "access");
		const result = await verifyAccessToken(token);
		expect(result).not.toBeNull();
		expect(result!.sub).toBe(testPayload.sub);
		expect(result!.email).toBe(testPayload.email);
		expect(result!.type).toBe("access");
	});

	it("verifyAccessToken with invalid token returns null", async () => {
		const result = await verifyAccessToken("not-a-valid-token");
		expect(result).toBeNull();
	});

	it("verifyAccessToken with wrong type returns null", async () => {
		const refreshToken = await createToken(testPayload, "refresh");
		const result = await verifyAccessToken(refreshToken);
		expect(result).toBeNull();
	});

	it("verifyRefreshToken with valid token returns payload", async () => {
		const token = await createToken(testPayload, "refresh");
		const result = await verifyRefreshToken(token);
		expect(result).not.toBeNull();
		expect(result!.sub).toBe(testPayload.sub);
		expect(result!.email).toBe(testPayload.email);
		expect(result!.type).toBe("refresh");
	});

	it("verifyRefreshToken with invalid token returns null", async () => {
		const result = await verifyRefreshToken("totally-bogus-token");
		expect(result).toBeNull();
	});
});
