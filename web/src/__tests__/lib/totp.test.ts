import * as OTPAuth from "otpauth";
import { describe, expect, it } from "vitest";
import { createTOTP, getTOTPUri, verifyTOTP } from "@/lib/totp";

describe("lib/totp", () => {
	it("creates a TOTP with a 20-byte secret and otpauth URI", () => {
		const totp = createTOTP("user@example.com");
		expect(totp.secret.base32.length).toBe(32);
		expect(totp.digits).toBe(6);
		expect(totp.period).toBe(30);
		const uri = getTOTPUri(totp);
		expect(uri.startsWith("otpauth://totp/")).toBe(true);
		expect(uri).toContain("issuer=SecureIT");
		expect(uri).toContain("user%40example.com");
	});

	it("produces different secrets for different calls", () => {
		expect(createTOTP("a@b.c").secret.base32).not.toBe(
			createTOTP("a@b.c").secret.base32,
		);
	});

	it("verifies a freshly generated code", () => {
		const totp = createTOTP("user@example.com");
		const code = new OTPAuth.TOTP({
			issuer: "SecureIT",
			label: "",
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: totp.secret,
		}).generate();
		expect(verifyTOTP(totp.secret.base32, code)).toBe(true);
	});

	it("rejects an incorrect code", () => {
		const totp = createTOTP("user@example.com");
		expect(verifyTOTP(totp.secret.base32, "000000")).toBe(false);
	});

	it("accepts a code from the ±1 step window", () => {
		const totp = createTOTP("user@example.com");
		const secret = totp.secret.base32;
		const other = new OTPAuth.TOTP({
			issuer: "SecureIT",
			label: "",
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: OTPAuth.Secret.fromBase32(secret),
		});
		other.epoch = totp.epoch - 30 * 1000;
		expect(verifyTOTP(secret, other.generate())).toBe(true);
	});

	it("throws on an invalid base32 secret", () => {
		expect(() => verifyTOTP("not-a-secret!!!", "000000")).toThrow();
	});
});
