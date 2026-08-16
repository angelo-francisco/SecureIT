import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { emailCode } from "@/db/schema";
import {
	createEmailCode,
	createEmailCodeWithCooldown,
	sendVerificationEmail,
	verifyEmailCode,
} from "@/lib/email";

const TEST = "email_test";

describe("lib/email", () => {
	afterEach(async () => {
		await db
			.delete(emailCode)
			.where(eq(emailCode.email, `${TEST}@example.com`))
			.run();
	});

	it("createEmailCode stores a 6-digit code with expiry", async () => {
		const email = `${TEST}@example.com`;
		const code = await createEmailCode(email);
		expect(code).toMatch(/^\d{6}$/);

		const row = await db
			.select()
			.from(emailCode)
			.where(eq(emailCode.email, email))
			.get();
		expect(row).toBeDefined();
		expect(row?.code).toBe(code);
		expect(row?.used).toBe(false);
		expect(new Date(row?.expiresAt ?? "").getTime()).toBeGreaterThan(
			Date.now(),
		);
	});

	it("createEmailCode deletes previous unused codes for the same email", async () => {
		const email = `${TEST}@example.com`;
		await createEmailCode(email);
		await createEmailCode(email);
		const rows = await db
			.select()
			.from(emailCode)
			.where(eq(emailCode.email, email))
			.all();
		expect(rows.length).toBe(1);
	});

	it("verifyEmailCode marks a valid code as used and rejects reuse", async () => {
		const email = `${TEST}@example.com`;
		const code = await createEmailCode(email);
		expect(await verifyEmailCode(email, code)).toBe(true);
		expect(await verifyEmailCode(email, code)).toBe(false);
	});

	it("verifyEmailCode rejects wrong or expired codes", async () => {
		const email = `${TEST}@example.com`;
		await createEmailCode(email);
		expect(await verifyEmailCode(email, "000000")).toBe(false);

		await db
			.insert(emailCode)
			.values({
				email,
				code: "123456",
				expiresAt: new Date(Date.now() - 60_000).toISOString(),
			})
			.run();
		expect(await verifyEmailCode(email, "123456")).toBe(false);
	});

	it("createEmailCodeWithCooldown respects the cooldown window", async () => {
		const email = `${TEST}@example.com`;
		const first = await createEmailCodeWithCooldown(email);
		expect(first.shouldSend).toBe(true);

		const second = await createEmailCodeWithCooldown(email);
		expect(second.shouldSend).toBe(false);
		expect(second.code).toBe(first.code);
	});

	it("sendVerificationEmail logs the code in dev mode", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		try {
			await sendVerificationEmail(`${TEST}@example.com`, "654321");
			expect(logSpy).toHaveBeenCalled();
			expect(logSpy.mock.calls.join(" ")).toContain("654321");
		} finally {
			logSpy.mockRestore();
		}
	});
});
