import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { issueAuthResponse } from "@/lib/session";
import { resolveSetupUser } from "@/lib/setup";
import { verifyTOTP } from "@/lib/totp";

export async function POST(request: Request) {
	try {
		const { setup_token, code } = (await request.json()) as {
			setup_token?: string;
			code?: string;
		};

		if (!code) {
			return NextResponse.json(
				{ error: "Código obrigatório" },
				{ status: 400 },
			);
		}

		const resolved = await resolveSetupUser(setup_token);
		if (!resolved.ok) {
			return NextResponse.json(
				{ error: resolved.error },
				{ status: resolved.status },
			);
		}

		if (!resolved.user.totpSecret) {
			return NextResponse.json(
				{ error: "O autenticador ainda não foi configurado" },
				{ status: 400 },
			);
		}

		const valid = verifyTOTP(resolved.user.totpSecret, code);
		if (!valid) {
			return NextResponse.json({ error: "Código inválido" }, { status: 401 });
		}

		await db
			.update(user)
			.set({ totpEnabled: true })
			.where(eq(user.id, resolved.user.id))
			.run();

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.id, resolved.user.id))
			.get();
		if (!foundUser) {
			return NextResponse.json(
				{ error: "Utilizador não encontrado" },
				{ status: 404 },
			);
		}

		return await issueAuthResponse(foundUser);
	} catch (error) {
		console.error("[Setup TOTP Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
