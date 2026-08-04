import type { DrizzleDB } from "@/db";
import { generateId, license, licenseKey, subProfile, user } from "@/db/schema";
import { createToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

type TestDB = DrizzleDB;

export async function createTestToken(
	sub: string,
	email: string,
	type: "access" | "refresh" = "access",
) {
	return createToken({ sub, email }, type);
}

export async function createTestUser(
	db: TestDB,
	overrides?: {
		id?: string;
		email?: string;
		isActive?: boolean;
		withPin?: boolean;
	},
) {
	const id = overrides?.id ?? generateId();
	const email =
		overrides?.email ??
		`test_user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
	const passwordHash = await hashPassword("TestPass123456!", 10);
	const pinHash = overrides?.withPin ? await hashPassword("1234") : null;

	await db
		.insert(user)
		.values({
			id,
			email,
			passwordHash,
			pinHash,
			firstName: "Test",
			lastName: "User",
			isActive: overrides?.isActive ?? true,
		})
		.run();

	return { id, email, passwordHash };
}

export async function createTestProfile(
	db: TestDB,
	userId: string,
	name = "TestProfile",
) {
	const id = generateId();
	await db
		.insert(subProfile)
		.values({
			id,
			userId,
			name,
			avatarColor: "#2C9ED5",
			isDefault: false,
		})
		.run();
	return id;
}

export async function createTestLicense(
	db: TestDB,
	userId: string,
	opts?: { status?: string; keyStatus?: string; expiresAt?: string },
) {
	const keyId = generateId();
	const key = `SEC-TEST-${Date.now().toString(36).toUpperCase().padStart(4, "0")}-ABCD-5678`;
	const expiresAt =
		opts?.expiresAt ??
		new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

	await db
		.insert(licenseKey)
		.values({
			id: keyId,
			key,
			type: "B2C",
			durationDays: 30,
			status: opts?.keyStatus ?? "ACTIVE",
		})
		.run();

	const licId = generateId();
	await db
		.insert(license)
		.values({
			id: licId,
			keyId,
			userId,
			activatedAt: new Date().toISOString(),
			expiresAt,
			status: opts?.status ?? "ACTIVE",
			signedPayload: "test-payload",
		})
		.run();

	return { licId, keyId, key, expiresAt };
}

export function makeRequest(
	url: string,
	options: {
		method?: string;
		body?: unknown;
		token?: string;
		headers?: Record<string, string>;
	} = {},
) {
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...options.headers,
	};

	if (options.token) {
		headers.Authorization = `Bearer ${options.token}`;
	}

	return new Request(url, {
		method: options.method ?? (options.body ? "POST" : "GET"),
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});
}
