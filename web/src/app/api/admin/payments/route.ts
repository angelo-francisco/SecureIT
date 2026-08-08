import { desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import {
	paymentInfo,
	paymentRequest,
	plan,
	planFeature,
	planService,
	user,
} from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { decryptPaymentInfo } from "@/lib/crypto";

function parseIds(raw: string | null): string[] {
	if (!raw) return [];
	try {
		const value: unknown = JSON.parse(raw);
		return Array.isArray(value)
			? value.filter((x): x is string => typeof x === "string")
			: [];
	} catch {
		return [];
	}
}

export async function GET() {
	const session = await getAdminSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const rows = await db
			.select()
			.from(paymentRequest)
			.orderBy(desc(paymentRequest.createdAt))
			.all();

		const result = await Promise.all(
			rows.map(async (r) => {
				const [p, pi, u, features, services] = await Promise.all([
					db.select().from(plan).where(eq(plan.id, r.planId)).get(),
					db
						.select()
						.from(paymentInfo)
						.where(eq(paymentInfo.id, r.paymentInfoId))
						.get(),
					db.select().from(user).where(eq(user.id, r.userId)).get(),
					parseIds(r.selectedFeatures).length
						? db
								.select()
								.from(planFeature)
								.where(inArray(planFeature.id, parseIds(r.selectedFeatures)))
								.all()
						: Promise.resolve([]),
					parseIds(r.selectedServices).length
						? db
								.select()
								.from(planService)
								.where(inArray(planService.id, parseIds(r.selectedServices)))
								.all()
						: Promise.resolve([]),
				]);
				const decPi = pi ? await decryptPaymentInfo(pi) : null;
				return {
					...r,
					plan: p ?? null,
					selectedFeatureNames: features.map((f) => f.name),
					selectedServiceNames: services.map((s) => s.name),
					paymentInfo: decPi
						? {
								id: decPi.id,
								iban: decPi.iban,
								accountName: decPi.accountName,
								bankName: decPi.bankName,
								reference: decPi.reference,
								isActive: decPi.isActive,
								createdAt: decPi.createdAt,
							}
						: null,
					user: u
						? { firstName: u.firstName, lastName: u.lastName, email: u.email }
						: null,
				};
			}),
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("[Admin Payments GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
