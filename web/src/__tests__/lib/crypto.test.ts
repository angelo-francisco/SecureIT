import { describe, it, expect } from "vitest";
import {
	encryptText,
	decryptText,
	encryptPaymentInfo,
	decryptPaymentInfo,
} from "@/lib/crypto";

describe("lib/crypto", () => {
	it("encrypts and decrypts text correctly", async () => {
		const plain = "AO06 0040 0000 8891 2345 6789 1";
		const encrypted = await encryptText(plain);
		expect(encrypted).not.toBe(plain);
		expect(encrypted?.startsWith("enc:")).toBe(true);

		const decrypted = await decryptText(encrypted);
		expect(decrypted).toBe(plain);
	});

	it("returns original text if text does not start with enc:", async () => {
		const plain = "Plain Unencrypted IBAN";
		const decrypted = await decryptText(plain);
		expect(decrypted).toBe(plain);
	});

	it("handles null and undefined values", async () => {
		expect(await encryptText(null)).toBeNull();
		expect(await decryptText(null)).toBeNull();
	});

	it("encrypts and decrypts payment info object", async () => {
		const info = {
			id: "pi_123",
			iban: "AO06 0040 0000 1111 2222 3333 4",
			accountName: "SecureIT Test Account",
			bankName: "Banco BAI",
			reference: "REF123456",
		};

		const encObj = await encryptPaymentInfo(info);
		expect(encObj.iban).not.toBe(info.iban);
		expect(encObj.accountName).not.toBe(info.accountName);

		const decObj = await decryptPaymentInfo(encObj);
		expect(decObj.iban).toBe(info.iban);
		expect(decObj.accountName).toBe(info.accountName);
		expect(decObj.bankName).toBe(info.bankName);
		expect(decObj.reference).toBe(info.reference);
	});
});
