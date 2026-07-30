import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, license, licenseKey } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, createToken } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function GET() {
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
			const res = NextResponse.json(
				{ error: "Utilizador não encontrado" },
				{ status: 404 },
			);
			res.cookies.delete("token");
			res.cookies.delete("refresh_token");
			return res;
		}

		const userLicense = await db
			.select()
			.from(license)
			.where(eq(license.userId, session.sub))
			.get();

		let licenseKeyData: typeof licenseKey.$inferSelect | undefined;
		if (userLicense) {
			licenseKeyData = await db
				.select()
				.from(licenseKey)
				.where(eq(licenseKey.id, userLicense.keyId))
				.get();
		}

		const token = await createToken(
			{ sub: foundUser.id, email: foundUser.email },
			"access",
		);

		const expiresAtDate = userLicense ? new Date(userLicense.expiresAt) : null;

		return NextResponse.json({
			access_token: token,
			user: {
				id: foundUser.id,
				email: foundUser.email,
				firstName: foundUser.firstName,
				lastName: foundUser.lastName,
				phone: foundUser.phone,
				hasPin: !!foundUser.pinHash,
				totpEnabled: foundUser.totpEnabled,
				isActive: foundUser.isActive,
				createdAt: foundUser.createdAt,
			},
			license:
				userLicense && licenseKeyData
					? {
							id: userLicense.id,
							type: licenseKeyData.type,
							activatedAt: userLicense.activatedAt,
							expiresAt: userLicense.expiresAt,
							lastChecked: userLicense.lastChecked,
							isActive: expiresAtDate! > new Date(),
							daysRemaining: Math.max(
								0,
								Math.ceil(
									(expiresAtDate!.getTime() - Date.now()) /
										(1000 * 60 * 60 * 24),
								),
							),
						}
					: null,
		});
	} catch (error) {
		console.error("[Me]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	try {
		const session = await getSession();
		if (!session) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const body = (await request.json()) as any;
		const { firstName, lastName, phone, pin } = body;

		if (!firstName?.trim() || !lastName?.trim()) {
			return NextResponse.json(
				{ error: "Nome e apelido são obrigatórios" },
				{ status: 400 },
			);
		}

		const updates: Record<string, unknown> = {};
		if (firstName !== undefined) updates.firstName = firstName;
		if (lastName !== undefined) updates.lastName = lastName;
		if (phone !== undefined) updates.phone = phone;
		if (pin !== undefined) {
			if (pin === null || pin === "") {
				updates.pinHash = null;
			} else {
				if (typeof pin !== "string" || !/^\d{4}$/.test(pin)) {
					return NextResponse.json(
						{ error: "O PIN deve conter 4 dígitos" },
						{ status: 400 },
					);
				}
				updates.pinHash = await hashPassword(pin);
			}
		}

		const updated = await db
			.update(user)
			.set(updates)
			.where(eq(user.id, session.sub))
			.returning()
			.get();

		return NextResponse.json({
			firstName: updated.firstName,
			lastName: updated.lastName,
			email: updated.email,
			phone: updated.phone,
		});
	} catch (error) {
		console.error("[Me PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
