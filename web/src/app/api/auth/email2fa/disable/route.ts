import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/auth";

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

		await db
			.update(user)
			.set({ email2faEnabled: false })
			.where(eq(user.id, foundUser.id))
			.run();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Email2FA Disable]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
