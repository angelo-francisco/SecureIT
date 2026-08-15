import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import {
	issueChallengeResponse,
	issueSetupResponse,
	requiresTwoFactorSetup,
} from "@/lib/session";

export async function POST(request: Request) {
	try {
		const { email, password } = (await request.json()) as {
			email?: string;
			password?: string;
		};

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email e password são obrigatórios" },
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
				{ error: "Email ou palavra-passe incorrectos" },
				{ status: 401 },
			);
		}

		if (!foundUser.isActive) {
			return NextResponse.json({ error: "Conta desactivada" }, { status: 403 });
		}

		const valid = await verifyPassword(password, foundUser.passwordHash);
		if (!valid) {
			return NextResponse.json(
				{ error: "Email ou palavra-passe incorrectos" },
				{ status: 401 },
			);
		}

		if (requiresTwoFactorSetup(foundUser)) {
			return await issueSetupResponse(foundUser);
		}

		return await issueChallengeResponse(foundUser, "email-code");
	} catch (error) {
		console.error("[Login]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
