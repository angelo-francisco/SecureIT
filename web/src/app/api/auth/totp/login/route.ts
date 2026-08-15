import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import {
	issueAuthResponse,
	issueSetupResponse,
	requiresTwoFactorSetup,
} from "@/lib/session";
import { verifyTOTP } from "@/lib/totp";

export async function POST(request: Request) {
	try {
		const { email, code } = (await request.json()) as {
			email?: string;
			code?: string;
		};

		if (!email || !code) {
			return NextResponse.json(
				{ error: "Email e código são obrigatórios" },
				{ status: 400 },
			);
		}

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();
		if (!foundUser) {
			return NextResponse.json(
				{ error: "Email ou código incorrectos" },
				{ status: 401 },
			);
		}

		if (!foundUser.isActive) {
			return NextResponse.json({ error: "Conta desactivada" }, { status: 403 });
		}

		if (!foundUser.totpEnabled || !foundUser.totpSecret) {
			return NextResponse.json(
				{ error: "Autenticador não está configurado para esta conta" },
				{ status: 400 },
			);
		}

		const valid = verifyTOTP(foundUser.totpSecret, code);
		if (!valid) {
			return NextResponse.json({ error: "Código inválido" }, { status: 401 });
		}

		if (requiresTwoFactorSetup(foundUser)) {
			return await issueSetupResponse(foundUser);
		}

		return await issueAuthResponse(foundUser);
	} catch (error) {
		console.error("[TOTP Login]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
