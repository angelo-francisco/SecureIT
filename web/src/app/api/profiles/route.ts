import { db } from "@/db";
import { subProfile, license, licenseKey } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { NextResponse } from "next/server";

const PROFILE_LIMITS: Record<string, number> = {
	basic: 2,
	pro: 5,
	enterprise: 10,
};

export async function GET(request: Request) {
	const session = await getSession(request);
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const profiles = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.userId, session.sub))
			.all();

		return NextResponse.json(
			profiles.map((p) => ({
				id: p.id,
				name: p.name,
				avatarColor: p.avatarColor,
				isDefault: p.isDefault,
				createdAt: p.createdAt,
				hasPin: !!p.pinHash,
			})),
		);
	} catch (error) {
		console.error("[Profiles GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	const session = await getSession(request);
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const body = (await request.json()) as any;
		const { name, avatarColor, pin } = body;

		if (!name?.trim()) {
			return NextResponse.json(
				{ error: "Nome é obrigatório" },
				{ status: 400 },
			);
		}

		if (pin && (typeof pin !== "string" || !/^\d{4}$/.test(pin))) {
			return NextResponse.json(
				{ error: "O PIN deve conter 4 dígitos" },
				{ status: 400 },
			);
		}

		const countResult = await db.all<{ count: number }>(
			sql`SELECT count(*) as "count" FROM ${subProfile} WHERE ${eq(subProfile.userId, session.sub)}`,
		);

		const profileCount = countResult?.[0]?.count ?? 0;

		const userLicense = await db
			.select()
			.from(license)
			.where(eq(license.userId, session.sub))
			.get();

		let licenseType = "basic";
		if (userLicense) {
			const keyRow = await db
				.select()
				.from(licenseKey)
				.where(eq(licenseKey.id, userLicense.keyId))
				.get();
			licenseType = keyRow?.type?.toLowerCase() ?? "basic";
		}
		const maxProfiles = PROFILE_LIMITS[licenseType] ?? 2;

		if (profileCount >= maxProfiles) {
			return NextResponse.json(
				{
					error: `Máximo de ${maxProfiles} perfis para o plano ${licenseType}`,
				},
				{ status: 400 },
			);
		}

		const pinHash = pin ? await hashPassword(pin) : null;

		const created = await db
			.insert(subProfile)
			.values({
				userId: session.sub,
				name: name.trim(),
				avatarColor: avatarColor || "#2C9ED5",
				pinHash,
			})
			.returning()
			.get();

		return NextResponse.json({
			id: created.id,
			name: created.name,
			avatarColor: created.avatarColor,
			isDefault: created.isDefault,
			hasPin: !!created.pinHash,
		});
	} catch (error) {
		console.error("[Profiles POST]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
