import { and, desc, eq, gt } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import { db } from "@/db";
import { emailCode } from "@/db/schema";

const generateCode = customAlphabet("0123456789", 6);

const gmailUser = process.env.GMAIL_USER?.trim();
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();
const emailFrom = process.env.EMAIL_FROM?.trim() || "SecureIT";

const transporter =
	gmailUser && gmailAppPassword
		? nodemailer.createTransport({
				host: "smtp.gmail.com",
				port: 465,
				secure: true,
				auth: { user: gmailUser, pass: gmailAppPassword },
			})
		: null;

function verificationEmailHtml(code: string): string {
	return `<!doctype html>
<html lang="pt">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
	</head>
	<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
		<div style="max-width:480px;margin:0 auto;padding:32px 16px;">
			<div style="background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
				<div style="background-color:#0b0f14;padding:24px 32px;">
					<div style="color:#ffffff;font-size:20px;font-weight:bold;">SecureIT</div>
				</div>
				<div style="padding:32px;">
					<h1 style="margin:0 0 16px;font-size:18px;color:#18181b;">O seu código de verificação</h1>
					<p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.5;">
						Use o código abaixo para concluir o acesso à sua conta. O código é válido por 10 minutos.
					</p>
					<div style="text-align:center;background-color:#f4f4f5;border-radius:8px;padding:20px;margin-bottom:24px;">
						<span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#0b0f14;">${code}</span>
					</div>
					<p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5;">
						Se não pediu este código, ignore este e-mail. Nunca partilhe o código com ninguém.
					</p>
				</div>
			</div>
		</div>
	</body>
</html>`;
}

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

export async function createEmailCodeWithCooldown(
	email: string,
	cooldownMs = 60_000,
): Promise<{ code: string; shouldSend: boolean }> {
	const existing = await db
		.select()
		.from(emailCode)
		.where(and(eq(emailCode.email, email), eq(emailCode.used, false)))
		.orderBy(desc(emailCode.createdAt))
		.limit(1)
		.get();

	if (existing) {
		const created = new Date(existing.createdAt).getTime();
		if (Date.now() - created < cooldownMs) {
			return { code: existing.code, shouldSend: false };
		}
	}

	return { code: await createEmailCode(email), shouldSend: true };
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
	if (!transporter) {
		console.log(`[Email] (dev) Código ${code} para ${email}`);
		return;
	}

	await transporter.sendMail({
		from: `"${emailFrom}" <${gmailUser}>`,
		to: email,
		subject: "SecureIT — O seu código de verificação",
		text: `O seu código de verificação SecureIT é ${code}. É válido por 10 minutos.`,
		html: verificationEmailHtml(code),
	});
}
