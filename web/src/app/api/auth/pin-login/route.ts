import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createToken, setTokenCookies } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
	try {
		const { email, pin } = (await request.json()) as any;

		if (!email || !pin) {
			return NextResponse.json(
				{ error: "Email e PIN são obrigatórios" },
				{ status: 400 },
			);
		}

		if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
			return NextResponse.json(
				{ error: "O PIN deve conter 4 dígitos" },
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
				{ error: "Email ou PIN incorrectos" },
				{ status: 401 },
			);
		}

		if (!foundUser.isActive) {
			return NextResponse.json({ error: "Conta desactivada" }, { status: 403 });
		}

		if (!foundUser.pinHash) {
			return NextResponse.json(
				{ error: "PIN não configurado" },
				{ status: 400 },
			);
		}

		const validPin = await verifyPassword(pin, foundUser.pinHash);
		if (!validPin) {
			return NextResponse.json(
				{ error: "Email ou PIN incorrectos" },
				{ status: 401 },
			);
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
		console.error("[Pin Login]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
