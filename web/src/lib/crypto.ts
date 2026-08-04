const DEFAULT_KEY_TEXT =
	process.env.PAYMENT_ENCRYPTION_KEY || "secureit_payment_db_secret_key_v1_32b";

async function getEncryptionKey(): Promise<CryptoKey> {
	const encoder = new TextEncoder();
	const keyData = encoder.encode(DEFAULT_KEY_TEXT.padEnd(32, "0").slice(0, 32));
	return await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "AES-GCM" },
		false,
		["encrypt", "decrypt"],
	);
}

/**
 * Encrypts plaintext string using AES-GCM 256-bit encryption.
 * Returns formatted string `enc:<hex_iv>:<hex_ciphertext>`.
 */
export async function encryptText(
	text: string | null | undefined,
): Promise<string | null> {
	if (!text) return null;
	if (text.startsWith("enc:")) return text;

	try {
		const key = await getEncryptionKey();
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encoder = new TextEncoder();
		const encodedText = encoder.encode(text);

		const encryptedBuffer = await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv },
			key,
			encodedText,
		);

		const ivHex = Array.from(iv)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");
		const cipherHex = Array.from(new Uint8Array(encryptedBuffer))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return `enc:${ivHex}:${cipherHex}`;
	} catch (err) {
		console.error("[Encrypt Error]", err);
		return text;
	}
}

/**
 * Decrypts string encrypted with encryptText.
 * If text does not start with `enc:`, returns text as is.
 */
export async function decryptText(
	text: string | null | undefined,
): Promise<string | null> {
	if (!text) return null;
	if (!text.startsWith("enc:")) return text;

	try {
		const parts = text.split(":");
		if (parts.length !== 3) return text;

		const ivHex = parts[1];
		const cipherHex = parts[2];

		const iv = new Uint8Array(
			ivHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) || [],
		);
		const cipherBuffer = new Uint8Array(
			cipherHex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ||
				[],
		);

		const key = await getEncryptionKey();
		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			key,
			cipherBuffer,
		);

		const decoder = new TextDecoder();
		return decoder.decode(decryptedBuffer);
	} catch (err) {
		console.error("[Decrypt Error]", err);
		return text;
	}
}

export async function encryptPaymentInfo<T extends object>(
	info: T,
): Promise<T> {
	if (!info) return info;
	const encrypted = { ...info } as Record<string, unknown>;
	if (encrypted.iban)
		encrypted.iban = await encryptText(encrypted.iban as string);
	if (encrypted.accountName)
		encrypted.accountName = await encryptText(encrypted.accountName as string);
	if (encrypted.bankName)
		encrypted.bankName = await encryptText(encrypted.bankName as string);
	if (encrypted.reference)
		encrypted.reference = await encryptText(encrypted.reference as string);
	return encrypted as T;
}

export async function decryptPaymentInfo<T extends object>(
	info: T,
): Promise<T> {
	if (!info) return info;
	const decrypted = { ...info } as Record<string, unknown>;
	if (decrypted.iban)
		decrypted.iban =
			(await decryptText(decrypted.iban as string)) || decrypted.iban;
	if (decrypted.accountName)
		decrypted.accountName =
			(await decryptText(decrypted.accountName as string)) ||
			decrypted.accountName;
	if (decrypted.bankName)
		decrypted.bankName =
			(await decryptText(decrypted.bankName as string)) || decrypted.bankName;
	if (decrypted.reference)
		decrypted.reference =
			(await decryptText(decrypted.reference as string)) || decrypted.reference;
	return decrypted as T;
}
