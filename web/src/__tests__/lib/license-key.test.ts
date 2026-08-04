import { describe, expect, it } from "vitest";
import {
	formatLicenseKeyDisplay,
	generateLicenseKey,
	isValidLicenseKeyFormat,
} from "@/lib/license-key";

describe("lib/license-key", () => {
	describe("generateLicenseKey", () => {
		it("returns SEC-XXXX-XXXX-XXXX-XXXX format", () => {
			const key = generateLicenseKey();
			expect(key).toMatch(
				/^SEC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
			);
		});

		it("produces unique keys (100 samples)", () => {
			const keys = new Set<string>();
			for (let i = 0; i < 100; i++) {
				keys.add(generateLicenseKey());
			}
			expect(keys.size).toBe(100);
		});
	});

	describe("isValidLicenseKeyFormat", () => {
		it("accepts valid key", () => {
			expect(isValidLicenseKeyFormat("SEC-ABCD-1234-EFGH-5678")).toBe(true);
		});

		it("rejects lowercase letters", () => {
			expect(isValidLicenseKeyFormat("SEC-abcd-1234-EFGH-5678")).toBe(false);
		});

		it("rejects wrong prefix", () => {
			expect(isValidLicenseKeyFormat("ABC-ABCD-1234-EFGH-5678")).toBe(false);
		});

		it("rejects wrong length (too short)", () => {
			expect(isValidLicenseKeyFormat("SEC-ABCD-1234")).toBe(false);
		});

		it("rejects missing dashes", () => {
			expect(isValidLicenseKeyFormat("SECABCD1234EFGH5678")).toBe(false);
		});

		it("rejects empty string", () => {
			expect(isValidLicenseKeyFormat("")).toBe(false);
		});

		it("accepts keys with digits only", () => {
			expect(isValidLicenseKeyFormat("SEC-1234-5678-9012-3456")).toBe(true);
		});
	});

	describe("formatLicenseKeyDisplay", () => {
		it("returns input unchanged", () => {
			const key = "SEC-ABCD-1234-EFGH-5678";
			expect(formatLicenseKeyDisplay(key)).toBe(key);
		});
	});
});
