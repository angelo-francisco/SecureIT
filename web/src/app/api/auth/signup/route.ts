import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { generateId, user } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { issueSetupResponse } from "@/lib/session";

export async function POST(request: Request) {
	try {
		const { email, password, pin, firstName, lastName, phone } =
			(await request.json()) as {
				email?: string;
				password?: string;
				pin?: string;
				firstName?: string;
				lastName?: string;
				phone?: string;
			};

		if (!email || !password || !firstName || !lastName) {
			return NextResponse.json(
				{ error: "Campos obrigatórios em falta" },
				{ status: 400 },
			);
		}

		if (password.length < 12) {
			return NextResponse.json(
				{ error: "Palavra-passe deve ter pelo menos 12 caracteres" },
				{ status: 400 },
			);
		}

		if (pin && (pin.length !== 4 || !/^\d{4}$/.test(pin))) {
			return NextResponse.json(
				{ error: "O PIN deve conter 4 dígitos" },
				{ status: 400 },
			);
		}

		const existing = await db
			.select()
			.from(user)
			.where(eq(user.email, email))
			.get();
		if (existing) {
			return NextResponse.json(
				{ error: "Email já registado" },
				{ status: 409 },
			);
		}

		const passwordHash = await hashPassword(password);
		const pinHash = pin ? await hashPassword(pin) : null;

		const userId = generateId();
		const profileId = generateId();
		const now = new Date().toISOString();

		await db
			.insert(user)
			.values({
				id: userId,
				email,
				passwordHash,
				pinHash,
				firstName,
				lastName,
				phone: phone || null,
				createdAt: now,
			})
			.run();

		const { subProfile } = await import("@/db/schema");
		await db
			.insert(subProfile)
			.values({
				id: profileId,
				userId,
				name: firstName,
				avatarColor: "#2C9ED5",
				isDefault: true,
				createdAt: now,
			})
			.run();

		const createdUser = await db
			.select()
			.from(user)
			.where(eq(user.id, userId))
			.get();
		if (!createdUser) {
			return NextResponse.json(
				{ error: "Erro interno do servidor" },
				{ status: 500 },
			);
		}

		return await issueSetupResponse(createdUser);
	} catch (error) {
		console.error("[Signup]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
