import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { paymentInfo, paymentRequest, plan } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { decryptPaymentInfo } from "@/lib/crypto";

export async function GET() {
	const session = await getSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const rows = await db
			.select()
			.from(paymentRequest)
			.where(eq(paymentRequest.userId, session.sub))
			.orderBy(desc(paymentRequest.createdAt))
			.all();

		const result = await Promise.all(
			rows.map(async (r) => {
				const p = await db
					.select()
					.from(plan)
					.where(eq(plan.id, r.planId))
					.get();
				const pi = await db
					.select()
					.from(paymentInfo)
					.where(eq(paymentInfo.id, r.paymentInfoId))
					.get();
				const decPi = pi ? await decryptPaymentInfo(pi) : null;
				return {
					...r,
					plan: p ?? null,
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
				};
			}),
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("[Payments GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
