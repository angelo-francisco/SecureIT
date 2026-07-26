import { NextResponse } from "next/server";
import { db } from "@/db";
import { license, licenseKey } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}

	try {
		const activeLicense = await db
			.select()
			.from(license)
			.innerJoin(licenseKey, eq(license.keyId, licenseKey.id))
			.where(
				and(
					eq(license.userId, session.sub),
					eq(licenseKey.status, "ACTIVE"),
				),
			)
			.get();

		if (!activeLicense) {
			return NextResponse.json(
				{ error: "Nenhuma licença ativa encontrada" },
				{ status: 404 },
			);
		}

		const expiresAt = new Date(activeLicense.License.expiresAt);
		if (expiresAt <= new Date()) {
			return NextResponse.json(
				{ error: "A licença já expirou" },
				{ status: 400 },
			);
		}

		await db
			.update(licenseKey)
			.set({ status: "REVOKED" })
			.where(eq(licenseKey.id, activeLicense.LicenseKey.id))
			.run();

		await db
			.update(license)
			.set({ status: "REVOKED" })
			.where(eq(license.id, activeLicense.License.id))
			.run();

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[License Revoke]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
