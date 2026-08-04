import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { createToken } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";

export async function POST(request: Request) {
	try {
		const { email, pin } = (await request.json()) as {
			email?: string;
			pin?: string;
		};

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
		if (!foundUser?.pinHash) {
			return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
		}

		if (!foundUser.isActive) {
			return NextResponse.json({ error: "Conta desativada" }, { status: 403 });
		}

		const validPin = await verifyPassword(pin, foundUser.pinHash);
		if (!validPin) {
			return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
		}

		const pinToken = await createToken(
			{ sub: foundUser.id, email: foundUser.email },
			"access",
		);

		return NextResponse.json({ pin_token: pinToken });
	} catch (error) {
		console.error("[Pin Verify]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
