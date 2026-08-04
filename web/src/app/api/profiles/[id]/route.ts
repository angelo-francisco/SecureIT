import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { subProfile } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession(request);
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const { id } = await params;
		const body = (await request.json()) as {
			name?: string;
			avatarColor?: string;
			pin?: unknown;
		};

		const profile = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.id, id))
			.get();
		if (!profile || profile.userId !== session.sub) {
			return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
		}

		const updates: Record<string, unknown> = {};
		if (body.name?.trim()) updates.name = body.name.trim();
		if (body.avatarColor) updates.avatarColor = body.avatarColor;

		if (body.pin !== undefined) {
			if (body.pin === null || body.pin === "") {
				updates.pinHash = null;
			} else if (typeof body.pin === "string" && /^\d{4}$/.test(body.pin)) {
				updates.pinHash = await hashPassword(body.pin);
			} else {
				return NextResponse.json(
					{ error: "O PIN deve conter 4 dígitos" },
					{ status: 400 },
				);
			}
		}

		const updated = await db
			.update(subProfile)
			.set(updates)
			.where(eq(subProfile.id, id))
			.returning()
			.get();

		return NextResponse.json({
			id: updated.id,
			name: updated.name,
			avatarColor: updated.avatarColor,
			isDefault: updated.isDefault,
			hasPin: !!updated.pinHash,
		});
	} catch (error) {
		console.error("[Profile PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getSession(_request);
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const { id } = await params;

		const profile = await db
			.select()
			.from(subProfile)
			.where(eq(subProfile.id, id))
			.get();
		if (!profile || profile.userId !== session.sub) {
			return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
		}

		if (profile.isDefault) {
			return NextResponse.json(
				{ error: "Não é possível eliminar o perfil principal" },
				{ status: 400 },
			);
		}

		await db.delete(subProfile).where(eq(subProfile.id, id)).run();
		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Profile DELETE]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
