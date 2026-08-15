import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { createEmailCode, sendVerificationEmail } from "@/lib/email";

export async function POST() {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
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

		const code = await createEmailCode(foundUser.email);
		await sendVerificationEmail(foundUser.email, code);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Email2FA Enable]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
