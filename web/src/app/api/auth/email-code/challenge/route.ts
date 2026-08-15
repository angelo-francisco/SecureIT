import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifyChallengeToken } from "@/lib/auth";
import { createEmailCode, sendVerificationEmail } from "@/lib/email";

export async function POST(request: Request) {
	try {
		const { challenge_token } = (await request.json()) as {
			challenge_token?: string;
		};

		if (!challenge_token) {
			return NextResponse.json(
				{ error: "Token de desafio obrigatório" },
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

		if (!foundUser.email2faEnabled) {
			return NextResponse.json(
				{ error: "Código por e-mail não está ativo para esta conta" },
				{ status: 400 },
			);
		}

		const code = await createEmailCode(foundUser.email);
		await sendVerificationEmail(foundUser.email, code);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Email Code Challenge]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
