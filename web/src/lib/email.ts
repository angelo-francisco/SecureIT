import { db } from "@/db";
import { emailCode } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { customAlphabet } from "nanoid";

const generateCode = customAlphabet("0123456789", 6);

export async function createEmailCode(email: string): Promise<string> {
	await db
		.delete(emailCode)
		.where(and(eq(emailCode.email, email), eq(emailCode.used, false)))
		.run();

	const code = generateCode();
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

	await db.insert(emailCode).values({ email, code, expiresAt }).run();

	return code;
}

export async function verifyEmailCode(
	email: string,
	code: string,
): Promise<boolean> {
	const record = await db
		.select()
		.from(emailCode)
		.where(
			and(
				eq(emailCode.email, email),
				eq(emailCode.code, code),
				eq(emailCode.used, false),
				gt(emailCode.expiresAt, new Date().toISOString()),
			),
		)
		.limit(1)
		.get();

	if (!record) return false;

	await db
		.update(emailCode)
		.set({ used: true })
		.where(eq(emailCode.id, record.id))
		.run();

	return true;
}

export async function sendVerificationEmail(
	email: string,
	code: string,
): Promise<void> {
	console.log(`[Email] Sending code ${code} to ${email}`);
}
