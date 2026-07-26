import { db } from "@/db";
import { paymentRequest, plan, paymentInfo, user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

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
				const u = await db
					.select()
					.from(user)
					.where(eq(user.id, r.userId))
					.get();
				return {
					...r,
					plan: p ?? null,
					paymentInfo: pi
						? {
								id: pi.id,
								iban: pi.iban,
								accountName: pi.accountName,
								bankName: pi.bankName,
								reference: pi.reference,
								isActive: pi.isActive,
								createdAt: pi.createdAt,
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
