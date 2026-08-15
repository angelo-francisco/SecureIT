import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { resolveSetupUser } from "@/lib/setup";
import { createTOTP, getTOTPUri } from "@/lib/totp";

export async function POST(request: Request) {
	try {
		const { setup_token } = (await request.json()) as {
			setup_token?: string;
		};

		const resolved = await resolveSetupUser(setup_token);
		if (!resolved.ok) {
			return NextResponse.json(
				{ error: resolved.error },
				{ status: resolved.status },
			);
		}

		if (!resolved.user.emailVerified) {
			return NextResponse.json(
				{ error: "Verifique o e-mail antes de configurar o autenticador" },
				{ status: 400 },
			);
		}

		if (resolved.user.totpEnabled) {
			return NextResponse.json(
				{ error: "TOTP já está configurado" },
				{ status: 400 },
			);
		}

		const totp = createTOTP(resolved.user.email);
		const secret = totp.secret.base32;
		const uri = getTOTPUri(totp);

		await db
			.update(user)
			.set({ totpSecret: secret })
			.where(eq(user.id, resolved.user.id))
			.run();

		return NextResponse.json({ secret, uri });
	} catch (error) {
		console.error("[Setup TOTP]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
