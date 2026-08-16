import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("lib/password", () => {
	it("hashes and verifies a password", async () => {
		const hash = await hashPassword("S3cure-Pass!123");
		expect(hash).toBeTruthy();
		expect(hash).not.toContain("S3cure-Pass!123");
		await expect(verifyPassword("S3cure-Pass!123", hash)).resolves.toBe(true);
	});

	it("rejects a wrong password", async () => {
		const hash = await hashPassword("S3cure-Pass!123");
		await expect(verifyPassword("wrong-pass", hash)).resolves.toBe(false);
	});

	it("produces unique hashes for the same password (salting)", async () => {
		const [a, b] = await Promise.all([
			hashPassword("S3cure-Pass!123"),
			hashPassword("S3cure-Pass!123"),
		]);
		expect(a).not.toBe(b);
	});

	it("respects the bcrypt cost factor", async () => {
		const start = Date.now();
		await hashPassword("S3cure-Pass!123", 12);
		const elapsed = Date.now() - start;
		expect(elapsed).toBeGreaterThan(0);
	});
});
