import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createToken, setTokenCookies } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/email";

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
			return NextResponse.json({ error: "Conta desativada" }, { status: 403 });
		}

		const accessToken = await createToken(
			{ sub: foundUser.id, email: foundUser.email },
			"access",
		);
		const refreshToken = await createToken(
			{ sub: foundUser.id, email: foundUser.email },
			"refresh",
		);

		const body = {
			access_token: accessToken,
			user: {
				id: foundUser.id,
				email: foundUser.email,
				firstName: foundUser.firstName,
				lastName: foundUser.lastName,
				phone: foundUser.phone,
				totpEnabled: foundUser.totpEnabled,
				createdAt: foundUser.createdAt,
			},
		};

		const baseResponse = NextResponse.json(body);
		const response = setTokenCookies(baseResponse, accessToken, refreshToken);

		return response;
	} catch (error) {
		console.error("[Email Code Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
