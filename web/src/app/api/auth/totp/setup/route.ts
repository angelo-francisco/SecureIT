import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { createTOTP, getTOTPUri } from "@/lib/totp";

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

		if (foundUser.totpEnabled) {
			return NextResponse.json(
				{ error: "TOTP já está configurado" },
				{ status: 400 },
			);
		}

		const totp = createTOTP(foundUser.email);
		const secret = totp.secret.base32;
		const uri = getTOTPUri(totp);

		await db
			.update(user)
			.set({ totpSecret: secret })
			.where(eq(user.id, foundUser.id))
			.run();

		return NextResponse.json({ secret, uri });
	} catch (error) {
		console.error("[TOTP Setup]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
