import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { paymentInfo } from "@/db/schema";
import { getAdminSession } from "@/lib/auth";
import { decryptPaymentInfo, encryptText } from "@/lib/crypto";

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
		return NextResponse.json(info ? await decryptPaymentInfo(info) : null);
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
		const body = (await request.json()) as {
			iban?: string;
			accountName?: string;
			bankName?: string;
			reference?: string;
		};
		const { iban, accountName, bankName, reference } = body;

		if (!iban || !accountName) {
			return NextResponse.json(
				{ error: "IBAN e nome da conta são obrigatórios" },
				{ status: 400 },
			);
		}

		const encIban = (await encryptText(iban)) as string;
		const encAccountName = (await encryptText(accountName)) as string;
		const encBankName = bankName ? await encryptText(bankName) : null;
		const encReference = reference ? await encryptText(reference) : null;

		const existing = await db
			.select()
			.from(paymentInfo)
			.where(eq(paymentInfo.isActive, true))
			.limit(1)
			.get();

		if (existing) {
			const updated = await db
				.update(paymentInfo)
				.set({
					iban: encIban,
					accountName: encAccountName,
					bankName: encBankName,
					reference: encReference,
				})
				.where(eq(paymentInfo.id, existing.id))
				.returning()
				.get();
			return NextResponse.json(await decryptPaymentInfo(updated));
		}

		const created = await db
			.insert(paymentInfo)
			.values({
				iban: encIban,
				accountName: encAccountName,
				bankName: encBankName,
				reference: encReference,
			})
			.returning()
			.get();
		return NextResponse.json(await decryptPaymentInfo(created));
	} catch (error) {
		console.error("[Admin PaymentInfo PUT]", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
