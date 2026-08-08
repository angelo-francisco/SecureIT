import { desc, eq, and, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { license, licenseKey } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const now: string = new Date().toISOString();

		const result = await db
			.select()
			.from(license)
			.innerJoin(licenseKey, eq(license.keyId, licenseKey.id))
			.where(
				and(
					eq(license.userId, session.sub),
					eq(license.status, "ACTIVE"),
					eq(licenseKey.status, "ACTIVE"),
					gt(license.expiresAt, now)
				)
			)
			.orderBy(desc(license.createdAt))
			.limit(1)
			.get();
		const licenseWithKey = result
			? { ...result.license, key: result.licensekey }
			: null;
		return NextResponse.json(licenseWithKey);
	} catch (error) {
		console.error("[License GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
