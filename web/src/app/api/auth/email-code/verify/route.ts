import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifyEmailCode } from "@/lib/email";
import {
	issueChallengeResponse,
	issueSetupResponse,
	requiresTwoFactorSetup,
} from "@/lib/session";

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

		const valid = await verifyEmailCode(email, code);
		if (!valid) {
			return NextResponse.json(
				{ error: "Código inválido ou expirado" },
				{ status: 401 },
			);
		}

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();
		if (!foundUser) {
			return NextResponse.json(
				{ error: "Utilizador não encontrado" },
				{ status: 404 },
			);
		}

		if (!foundUser.isActive) {
			return NextResponse.json({ error: "Conta desactivada" }, { status: 403 });
		}

		if (requiresTwoFactorSetup(foundUser)) {
			return await issueSetupResponse(foundUser);
		}

		return await issueChallengeResponse(foundUser, "email-code");
	} catch (error) {
		console.error("[Email Code Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
