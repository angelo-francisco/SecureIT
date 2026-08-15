import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { verifyEmailCode } from "@/lib/email";

export async function POST(request: Request) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const { code } = (await request.json()) as { code?: string };
		if (!code) {
			return NextResponse.json(
				{ error: "Código obrigatório" },
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

		if (foundUser.email2faEnabled) {
			return NextResponse.json(
				{ error: "O código por e-mail já está ativo" },
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

		await db
			.update(user)
			.set({ email2faEnabled: true })
			.where(eq(user.id, foundUser.id))
			.run();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Email2FA Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
