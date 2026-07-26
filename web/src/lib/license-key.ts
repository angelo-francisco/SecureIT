import { customAlphabet } from "nanoid";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const generateKey = customAlphabet(ALPHABET, 16);

export function generateLicenseKey(): string {
	const raw = generateKey();
	return `SEC-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12)}`;
}

export function formatLicenseKeyDisplay(key: string): string {
	return key;
}

export function isValidLicenseKeyFormat(key: string): boolean {
	return /^SEC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(key);
}
