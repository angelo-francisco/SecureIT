import { db } from "@/db";
import { paymentInfo } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
	const session = await getAdminSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const info = await db
			.select()
			.from(paymentInfo)
			.where(eq(paymentInfo.isActive, true))
			.limit(1)
			.get();
		return NextResponse.json(info || null);
	} catch (error) {
		console.error("[Admin PaymentInfo GET]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function PUT(request: Request) {
	const session = await getAdminSession();
	if (!session) {
		return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
	}
	try {
		const body = (await request.json()) as any;
		const { iban, accountName, bankName, reference } = body;

		if (!iban || !accountName) {
			return NextResponse.json(
				{ error: "IBAN e nome da conta são obrigatórios" },
				{ status: 400 },
			);
		}

		const existing = await db
			.select()
			.from(paymentInfo)
			.where(eq(paymentInfo.isActive, true))
			.limit(1)
			.get();

		if (existing) {
			const updated = await db
				.update(paymentInfo)
				.set({ iban, accountName, bankName, reference })
				.where(eq(paymentInfo.id, existing.id))
				.returning()
				.get();
			return NextResponse.json(updated);
		}

		const created = await db
			.insert(paymentInfo)
			.values({ iban, accountName, bankName, reference })
			.returning()
			.get();
		return NextResponse.json(created);
	} catch (error) {
		console.error("[Admin PaymentInfo PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
