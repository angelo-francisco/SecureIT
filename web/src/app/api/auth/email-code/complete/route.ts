import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifyChallengeToken } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/email";
import {
	issueAuthResponse,
	issueSetupResponse,
	requiresTwoFactorSetup,
} from "@/lib/session";
export async function POST(request: Request) {
	try {
		const { challenge_token, code } = (await request.json()) as {
			challenge_token?: string;
			code?: string;
		};

		if (!challenge_token || !code) {
			return NextResponse.json(
				{ error: "Token de desafio e código são obrigatórios" },
				{ status: 400 },
			);
		}

		const payload = await verifyChallengeToken(challenge_token);
		if (!payload) {
			return NextResponse.json(
				{ error: "Sessão de desafio expirada, tente novamente" },
				{ status: 401 },
			);
		}

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.id, payload.sub))
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

		if (!foundUser.email2faEnabled) {
			return NextResponse.json(
				{ error: "Código por e-mail não está ativo para esta conta" },
				{ status: 400 },
			);
		}

		const valid = await verifyEmailCode(foundUser.email, code);
		if (!valid) {
			return NextResponse.json(
				{ error: "Código inválido ou expirado" },
				{ status: 401 },
			);
		}

		const updated = { ...foundUser, emailVerified: true };
		if (!foundUser.emailVerified) {
			await db
				.update(user)
				.set({ emailVerified: true })
				.where(eq(user.id, foundUser.id))
				.run();
		}

		if (requiresTwoFactorSetup(updated)) {
			return await issueSetupResponse(updated);
		}

		return await issueAuthResponse(updated);
	} catch (error) {
		console.error("[Email Code Complete]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
