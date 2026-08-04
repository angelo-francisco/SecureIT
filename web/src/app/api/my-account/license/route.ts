import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { license, licenseKey, paymentRequest, plan } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const userLicenses = await db
			.select()
			.from(license)
			.where(eq(license.userId, session.sub))
			.orderBy(desc(license.createdAt))
			.all();

		const userLicense =
			userLicenses.find((l) => l.status === "ACTIVE") ??
			userLicenses[0] ??
			null;

		let licenseKeyData: typeof licenseKey.$inferSelect | undefined;
		if (userLicense) {
			licenseKeyData = await db
				.select()
				.from(licenseKey)
				.where(eq(licenseKey.id, userLicense.keyId))
				.get();
		}

		const payments = await db
			.select()
			.from(paymentRequest)
			.where(eq(paymentRequest.userId, session.sub))
			.orderBy(desc(paymentRequest.createdAt))
			.all();

		const paymentsWithPlans = await Promise.all(
			payments.map(async (r) => {
				const p = await db
					.select()
					.from(plan)
					.where(eq(plan.id, r.planId))
					.get();
				return { ...r, plan: p ?? null };
			}),
		);

		const licenseWithKey =
			userLicense && licenseKeyData
				? { ...userLicense, key: licenseKeyData }
				: null;

		return NextResponse.json({
			license: licenseWithKey,
			payments: paymentsWithPlans,
		});
	} catch (error) {
		console.error("[License GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
