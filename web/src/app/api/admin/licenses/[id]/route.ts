import { NextResponse } from "next/server";
import { db } from "@/db";
import { licenseKey, license, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminSession } from "@/lib/auth";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const { id } = await params;
		const key = await db
			.select()
			.from(licenseKey)
			.where(eq(licenseKey.id, id))
			.get();

		if (!key) {
			return NextResponse.json(
				{ error: "Licença não encontrada" },
				{ status: 404 },
			);
		}

		const lic = await db
			.select()
			.from(license)
			.where(eq(license.keyId, id))
			.get();

		let licUser: { email: string; firstName: string; lastName: string } | null =
			null;
		if (lic) {
			const u = await db
				.select()
				.from(user)
				.where(eq(user.id, lic.userId))
				.get();
			if (u) {
				licUser = {
					email: u.email,
					firstName: u.firstName,
					lastName: u.lastName,
				};
			}
		}

		return NextResponse.json({
			...key,
			license: lic ? { ...lic, user: licUser } : null,
		});
	} catch (error) {
		console.error("[Admin Get License]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const session = await getAdminSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const { id } = await params;
		const key = await db
			.select()
			.from(licenseKey)
			.where(eq(licenseKey.id, id))
			.get();

		if (!key) {
			return NextResponse.json(
				{ error: "Licença não encontrada" },
				{ status: 404 },
			);
		}

		await db
			.update(licenseKey)
			.set({ status: "REVOKED" })
			.where(eq(licenseKey.id, id))
			.run();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Admin Revoke License]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
