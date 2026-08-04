import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { verifyTOTP } from "@/lib/totp";

export async function POST(request: Request) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const { code } = (await request.json()) as { code?: string };

		if (!code) {
			return NextResponse.json(
				{ error: "Código é obrigatório" },
				{ status: 400 },
			);
		}

		const foundUser = await db
			.select()
			.from(user)
			.where(eq(user.id, session.sub))
			.get();

		if (!foundUser) {
			return NextResponse.json(
				{ error: "Utilizador não encontrado" },
				{ status: 404 },
			);
		}

		if (!foundUser.totpSecret) {
			return NextResponse.json(
				{ error: "TOTP não está configurado" },
				{ status: 400 },
			);
		}

		const valid = verifyTOTP(foundUser.totpSecret, code);
		if (!valid) {
			return NextResponse.json({ error: "Código inválido" }, { status: 401 });
		}

		if (!foundUser.totpEnabled) {
			await db
				.update(user)
				.set({ totpEnabled: true })
				.where(eq(user.id, foundUser.id))
				.run();
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[TOTP Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
