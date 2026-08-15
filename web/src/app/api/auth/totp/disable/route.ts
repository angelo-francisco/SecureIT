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

		await db
			.update(user)
			.set({ totpEnabled: false, totpSecret: null })
			.where(eq(user.id, session.sub))
			.run();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[TOTP Disable]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
